/**
 * AudioManager — Google WaveNet-backed TTS player.
 *
 * Calls /api/tts (Google WaveNet) → receives base64 MP3 → plays it.
 * Native: expo-audio + FileSystem  |  Web: singleton <audio> element
 *
 * Public API:
 *   speak(text, voice, speed?)  → fetch + play
 *   stopAll()                   → async stop with 50ms hardware cooldown
 *   stop()                      → sync stop (for useEffect cleanup returns)
 *   setSoundEnabled(on)         → global mute
 *   isSpeaking()                → playback state
 */
import { Platform } from "react-native";
import { createAudioPlayer, AudioModule } from "expo-audio";
import * as FileSystem from "expo-file-system";
import { ttsSpeak } from "./api";

// ── Singleton web <audio> element ─────────────────────────────────────────────
let _webEl: HTMLAudioElement | null = null;
function getWebEl(): HTMLAudioElement {
  if (!_webEl && typeof window !== "undefined") {
    _webEl = new Audio();
    _webEl.preload = "auto";
  }
  return _webEl!;
}

// ── Native player ─────────────────────────────────────────────────────────────
let _nativePlayer: ReturnType<typeof createAudioPlayer> | null = null;

// ── Shared state ──────────────────────────────────────────────────────────────
let _soundEnabled = true;
let _generation = 0;

export function setSoundEnabled(on: boolean) {
  _soundEnabled = on;
  if (!on) stopAll();
}

export function isSpeaking(): boolean {
  if (Platform.OS === "web") {
    const el = _webEl;
    return el != null && !el.paused && el.src !== "" && el.src !== window?.location?.href;
  }
  return _nativePlayer !== null;
}

// ── Stop ──────────────────────────────────────────────────────────────────────
export async function stopAll(): Promise<void> {
  _generation++;
  if (_webEl) {
    try { _webEl.pause(); _webEl.src = ""; _webEl.load(); } catch { /* no-op */ }
  }
  if (_nativePlayer) {
    try { _nativePlayer.pause(); } catch { /* no-op */ }
    try { _nativePlayer.remove(); } catch { /* no-op */ }
    _nativePlayer = null;
  }
  await new Promise<void>((r) => setTimeout(r, 50));
}

export function stop(): void {
  _generation++;
  if (_webEl) {
    try { _webEl.pause(); _webEl.src = ""; _webEl.load(); } catch { /* no-op */ }
  }
  if (_nativePlayer) {
    try { _nativePlayer.pause(); _nativePlayer.remove(); } catch { /* no-op */ }
    _nativePlayer = null;
  }
}

// ── In-app TTS cache (avoid re-fetching the same phrase) ──────────────────────
// Key: full text + voice — avoids collisions from short-prefix keying
const _ttsCache = new Map<string, string>(); // key → base64
const TTS_CACHE_MAX = 100;

function ttsCacheKey(text: string, voice: string): string {
  // Use full text so long responses with similar openings don't collide
  return `${voice}::${text}`;
}

function ttsCacheGet(text: string, voice: string): string | undefined {
  return _ttsCache.get(ttsCacheKey(text, voice));
}

function ttsCacheSet(text: string, voice: string, base64: string): void {
  if (_ttsCache.size >= TTS_CACHE_MAX) {
    const oldest = _ttsCache.keys().next().value;
    if (oldest) _ttsCache.delete(oldest);
  }
  _ttsCache.set(ttsCacheKey(text, voice), base64);
}

// ── speak() ───────────────────────────────────────────────────────────────────
export async function speak(
  text: string,
  voice: "echo" | "nova" = "echo",
  speed = 1.0,
  _contentType?: string,
): Promise<void> {
  if (!_soundEnabled || !text?.trim()) return;

  stop();
  const myGen = _generation;

  await new Promise<void>((r) => setTimeout(r, 50));
  if (myGen !== _generation) return;

  if (Platform.OS !== "web") {
    try {
      await AudioModule.setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,   // keep playing if screen locks or app goes to BG
      });
    } catch { /* ignore */ }
  }

  // Check client-side cache first — zero network cost
  let base64 = ttsCacheGet(text, voice);

  if (!base64) {
    try {
      const result = await ttsSpeak({ text, voice });
      if (!result?.audioBase64) return;
      base64 = result.audioBase64;
      ttsCacheSet(text, voice, base64);
    } catch {
      return;
    }
  }

  if (myGen !== _generation) return;

  return new Promise<void>((resolve) => {
    if (myGen !== _generation) { resolve(); return; }

    try {
      if (Platform.OS === "web") {
        const el = getWebEl();
        const uri = `data:audio/mpeg;base64,${base64}`;

        function cleanup() {
          el.removeEventListener("ended", onEnd);
          el.removeEventListener("error", onErr);
        }
        const onEnd = () => { cleanup(); resolve(); };
        const onErr = () => { cleanup(); resolve(); };

        el.addEventListener("ended", onEnd, { once: true });
        el.addEventListener("error", onErr, { once: true });
        el.src = uri;
        el.load();
        el.play().catch(() => { cleanup(); resolve(); });

      } else {
        const tmpUri = (FileSystem.cacheDirectory ?? "") + `tts_${Date.now()}.mp3`;
        FileSystem.writeAsStringAsync(tmpUri, base64!, {
          encoding: FileSystem.EncodingType.Base64,
        }).then(() => {
          if (myGen !== _generation) { resolve(); return; }

          const player = createAudioPlayer({ uri: tmpUri });
          _nativePlayer = player;

          // Track whether playback has actually started so we don't resolve early
          let playbackStarted = false;

          player.addListener("playbackStatusUpdate", (status: any) => {
            // Only count as "started" once we see isPlaying=true
            if (status.isPlaying) playbackStarted = true;

            // Only resolve on genuine completion — NOT on isLoaded===false which
            // fires during buffering/intermediate states and causes premature cutoff
            if (status.didJustFinish) {
              if (_nativePlayer === player) _nativePlayer = null;
              FileSystem.deleteAsync(tmpUri, { idempotent: true }).catch(() => {});
              resolve();
            }
          });

          player.play();

          // Safety timeout: generous budget per character so long explanations
          // never get cut off. 120ms/char, min 8s, max 90s.
          const safetyMs = Math.min(Math.max(text.length * 120, 8000), 90000);
          setTimeout(() => {
            if (_nativePlayer === player) {
              _nativePlayer = null;
              FileSystem.deleteAsync(tmpUri, { idempotent: true }).catch(() => {});
            }
            resolve();
          }, safetyMs);

        }).catch(() => resolve());
      }
    } catch (e) {
      console.warn("[AudioManager] play error", e);
      resolve();
    }
  });
}
