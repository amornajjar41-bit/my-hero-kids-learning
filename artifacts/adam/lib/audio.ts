/**
 * AudioManager — the ONLY audio system in the entire app.
 *
 * Design principles:
 * - Single singleton: one native player, one web <audio> element reused forever.
 * - stop() fully releases the audio and waits 50 ms before new playback starts.
 * - Generation counter: stale API responses are discarded before they play.
 * - stopAll() is the public alias used by every screen's unmount cleanup.
 */
import { Platform } from "react-native";
import { createAudioPlayer, AudioModule } from "expo-audio";
import * as FileSystem from "expo-file-system";

import { ttsSpeak } from "./api";

// ── Singleton web <audio> element ─────────────────────────────────────────────
// We create it once and reuse it forever — never new Audio() again after init.
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
let _generation = 0; // bumped on every speak() + stop()
let _stopping = false; // true during the 50 ms cooldown after stop()

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

/**
 * Stop all audio immediately and wait 50 ms for the hardware to fully release.
 * Safe to call from any screen at any time — even if nothing is playing.
 */
export async function stopAll(): Promise<void> {
  _generation++; // invalidate any in-flight speak() calls

  // Web: pause + clear src so the browser fully releases the audio resource
  if (_webEl) {
    try {
      _webEl.pause();
      _webEl.src = "";
      _webEl.load(); // flush the media pipeline
    } catch { /* no-op */ }
  }

  // Native: remove current player
  if (_nativePlayer) {
    try { _nativePlayer.pause(); } catch { /* no-op */ }
    try { _nativePlayer.remove(); } catch { /* no-op */ }
    _nativePlayer = null;
  }

  // 50 ms cooldown so the audio hardware fully resets before next playback
  _stopping = true;
  await new Promise<void>((r) => setTimeout(r, 50));
  _stopping = false;
}

/** Synchronous alias — for useEffect cleanup returns that must be synchronous. */
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

const _cache = new Map<string, string>(); // key → base64

export async function speak(
  text: string,
  voice: "echo" | "nova" = "echo",
  speed = 1.05,
  contentType: "explanation" | "greeting" | "celebration" | "story" = "explanation",
): Promise<void> {
  if (!_soundEnabled || !text) return;

  // Stop current audio synchronously so old sound cuts off immediately
  stop();
  const myGen = _generation; // stop() already bumped this

  // Wait for hardware cooldown (50 ms) before starting new audio
  await new Promise<void>((r) => setTimeout(r, 50));
  if (myGen !== _generation) return; // superseded while waiting

  if (Platform.OS !== "web") {
    try {
      await AudioModule.setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false });
    } catch { /* ignore */ }
  }

  const cacheKey = `${voice}:${contentType}:${text.slice(0, 120)}`;
  let base64 = _cache.get(cacheKey);

  if (!base64) {
    const result = await ttsSpeak({ text, voice, speed, contentType });
    if (!result.audioBase64) return;
    base64 = result.audioBase64;
    if (_cache.size > 40) {
      const oldest = _cache.keys().next().value;
      if (oldest) _cache.delete(oldest);
    }
    _cache.set(cacheKey, base64);
  }

  // Abort if a newer speak() or stop() arrived while we were fetching
  if (myGen !== _generation) return;

  return new Promise<void>((resolve) => {
    if (myGen !== _generation) { resolve(); return; }

    try {
      if (Platform.OS === "web") {
        const el = getWebEl();
        const uri = `data:audio/mpeg;base64,${base64}`;

        const onEnd = () => { cleanup(); resolve(); };
        const onErr = () => { cleanup(); resolve(); };

        function cleanup() {
          el.removeEventListener("ended", onEnd);
          el.removeEventListener("error", onErr);
        }

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

          player.addListener("playbackStatusUpdate", (status: any) => {
            if (status.didJustFinish || status.isLoaded === false) {
              if (_nativePlayer === player) _nativePlayer = null;
              FileSystem.deleteAsync(tmpUri, { idempotent: true }).catch(() => {});
              resolve();
            }
          });
          player.play();
          setTimeout(() => resolve(), Math.max(text.length * 75, 4000));
        }).catch(() => resolve());
      }
    } catch (e) {
      console.warn("[AudioManager] play error", e);
      resolve();
    }
  });
}
