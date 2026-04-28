/**
 * AudioManager — TTS player for chat (WaveNet) and stories (Edge TTS).
 *
 * Public API:
 *   speak(text, voice, speed?)      → WaveNet (chat / lessons)
 *   speakEdgeStory(text, lang)      → Edge TTS Ana/Zariyah (stories only)
 *   stopAll()                       → async stop with 50ms hardware cooldown
 *   stop()                          → sync stop (for useEffect cleanup returns)
 *   setSoundEnabled(on)             → global mute
 *   isSpeaking()                    → playback state
 */
import { Platform } from "react-native";
import { createAudioPlayer, AudioModule } from "expo-audio";
import * as FileSystem from "expo-file-system";
import { ttsSpeak, ttsEdgeStory } from "./api";

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
const _ttsCache = new Map<string, string>();
const TTS_CACHE_MAX = 100;

function ttsCacheKey(text: string, voice: string): string {
  return `${voice}::${text}`;
}

function ttsCacheGet(k: string): string | undefined {
  return _ttsCache.get(k);
}

function ttsCacheSet(k: string, base64: string): void {
  if (_ttsCache.size >= TTS_CACHE_MAX) {
    const oldest = _ttsCache.keys().next().value;
    if (oldest) _ttsCache.delete(oldest);
  }
  _ttsCache.set(k, base64);
}

// ── Shared playback helper ────────────────────────────────────────────────────
// Both speak() and speakEdgeStory() funnel through this after fetching audio.
function _doPlay(base64: string, textForTimeout: string, myGen: number): Promise<void> {
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
        const tmpUri = (FileSystem.cacheDirectory ?? "") + `tts_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`;
        FileSystem.writeAsStringAsync(tmpUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        }).then(() => {
          if (myGen !== _generation) { resolve(); return; }

          const player = createAudioPlayer({ uri: tmpUri });
          _nativePlayer = player;

          player.addListener("playbackStatusUpdate", (status: any) => {
            if (status.didJustFinish) {
              if (_nativePlayer === player) _nativePlayer = null;
              FileSystem.deleteAsync(tmpUri, { idempotent: true }).catch(() => {});
              resolve();
            }
          });

          player.play();

          // Safety timeout: 120ms/char, min 8s, max 90s
          const safetyMs = Math.min(Math.max(textForTimeout.length * 120, 8000), 90000);
          setTimeout(() => {
            if (_nativePlayer === player) {
              _nativePlayer = null;
              FileSystem.deleteAsync(tmpUri, { idempotent: true }).catch(() => {});
            }
            resolve();
          }, safetyMs);

        }).catch(() => resolve());
      }
    } catch {
      resolve();
    }
  });
}

// ── speak() — WaveNet (chat, lessons) ────────────────────────────────────────
export async function speak(
  text: string,
  voice: "echo" | "nova" = "echo",
  speed = 1.0,
  _contentType?: string,
  ageGroup?: string,
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
        shouldPlayInBackground: true,
      });
    } catch { /* ignore */ }
  }

  const cacheKey = ageGroup ? `${voice}:${ageGroup}` : voice;
  const ck = ttsCacheKey(text, cacheKey);
  let base64 = ttsCacheGet(ck);

  if (!base64) {
    try {
      const result = await ttsSpeak({ text, voice, ageGroup });
      if (!result?.audioBase64) return;
      base64 = result.audioBase64;
      ttsCacheSet(ck, base64);
    } catch {
      return;
    }
  }

  if (myGen !== _generation) return;
  return _doPlay(base64, text, myGen);
}

// ── speakEdgeStory() — Edge TTS Ana/Zariyah (stories only) ───────────────────
export async function speakEdgeStory(
  text: string,
  lang: "en" | "ar",
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
        shouldPlayInBackground: true,
      });
    } catch { /* ignore */ }
  }

  const ck = ttsCacheKey(text, `edge-story::${lang}`);
  let base64 = ttsCacheGet(ck);

  if (!base64) {
    const result = await ttsEdgeStory({ text, lang });
    if (!result?.base64) return;
    base64 = result.base64;
    ttsCacheSet(ck, base64);
  }

  if (myGen !== _generation) return;
  return _doPlay(base64, text, myGen);
}
