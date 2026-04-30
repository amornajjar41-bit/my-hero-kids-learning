/**
 * AudioManager — TTS player for chat, lessons, stories, games.
 *
 * Public API:
 *   speak(text, voice, speed?)      → WaveNet (chat / lessons / stories / games)
 *   speakEdgeStory(text, lang)      → kept for backward compat — redirects to speak()
 *   stopAll()                       → async stop with 50ms hardware cooldown
 *   stop()                          → sync stop (for useEffect cleanup returns)
 *   setSoundEnabled(on)             → global mute
 *   isSpeaking()                    → playback state
 *   addAudioStateListener(fn)       → subscribe to state changes (dev indicator)
 *   getAudioState()                 → current AudioState snapshot
 *
 * Recovery policy (web):
 *   If play() rejects (autoplay blocked / broken state), the singleton <audio>
 *   element is replaced with a fresh one and play() is retried exactly once.
 *
 * expo-audio 1.1.x uses playbackState === 'ended' to detect completion.
 */
import { Platform } from "react-native";
import { createAudioPlayer, AudioModule } from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import { ttsSpeak } from "./api";

// ── Audio state (used by dev indicator) ───────────────────────────────────────
export type AudioState = "idle" | "loading" | "playing" | "error";
let _audioState: AudioState = "idle";
type StateListener = (s: AudioState) => void;
const _stateListeners: Set<StateListener> = new Set();

function setState(s: AudioState): void {
  _audioState = s;
  _stateListeners.forEach((fn) => fn(s));
}

export function getAudioState(): AudioState {
  return _audioState;
}

export function addAudioStateListener(fn: StateListener): () => void {
  _stateListeners.add(fn);
  return () => _stateListeners.delete(fn);
}

// ── Singleton web <audio> element ─────────────────────────────────────────────
let _webEl: HTMLAudioElement | null = null;

function getWebEl(): HTMLAudioElement {
  if (!_webEl && typeof window !== "undefined") {
    _webEl = new Audio();
    _webEl.preload = "auto";
  }
  return _webEl!;
}

/** Replace the broken element with a fresh one (called on play() failure) */
function resetWebEl(): HTMLAudioElement {
  if (_webEl) {
    try { _webEl.pause(); } catch { /* ignore */ }
    try { _webEl.src = ""; } catch { /* ignore */ }
  }
  _webEl = null;
  return getWebEl();
}

// ── Native player — single persistent instance, reused via player.replace() ───
// Creating/removing players on every TTS call exhausts Android's audio session
// pool after ~5-10 rapid calls, causing subsequent players to silently fail.
// Keeping one player and calling replace() avoids this entirely.
let _nativePlayer: ReturnType<typeof createAudioPlayer> | null = null;
let _nativeSub: { remove: () => void } | null = null;
let _nativeActiveTmp: string | null = null;
let _nativeCancelCb: (() => void) | null = null;

// ── Cross-module stop hook ────────────────────────────────────────────────────
// lessonAudio.ts registers its stop here so that audio.ts's stop() / stopAll()
// also kills any preloaded-audio player that might be running in parallel.
let _lessonAudioStop: (() => void) | null = null;
export function setLessonAudioStop(fn: () => void): void {
  _lessonAudioStop = fn;
}

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
  return _audioState === "playing";
}

function _clearNativeSub(): void {
  if (_nativeSub) { try { _nativeSub.remove(); } catch { /* ignore */ } _nativeSub = null; }
}

function _cancelNativePending(): void {
  if (_nativeCancelCb) { const c = _nativeCancelCb; _nativeCancelCb = null; c(); }
}

// ── Stop ──────────────────────────────────────────────────────────────────────
export async function stopAll(): Promise<void> {
  _lessonAudioStop?.();
  _generation++;
  setState("idle");
  _clearNativeSub();
  _cancelNativePending();
  if (_webEl) {
    try { _webEl.pause(); _webEl.src = ""; _webEl.load(); } catch { /* no-op */ }
  }
  if (_nativePlayer) {
    try { _nativePlayer.pause(); } catch { /* no-op */ }
    // Do NOT remove — we reuse the player instance to avoid exhausting the Android audio pool
  }
  await new Promise<void>((r) => setTimeout(r, 50));
}

export function stop(): void {
  _lessonAudioStop?.();
  _generation++;
  setState("idle");
  _clearNativeSub();
  _cancelNativePending();
  if (_webEl) {
    try { _webEl.pause(); _webEl.src = ""; _webEl.load(); } catch { /* no-op */ }
  }
  if (_nativePlayer) {
    try { _nativePlayer.pause(); } catch { /* no-op */ }
    // Do NOT remove — reuse on next speak()
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

// ── Web play with automatic recovery on failure ───────────────────────────────
async function playWebWithRecovery(uri: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const attempt = (el: HTMLAudioElement, isRetry: boolean) => {
      function cleanup() {
        el.removeEventListener("ended", onEnd);
        el.removeEventListener("error", onErr);
      }
      const onEnd = () => { cleanup(); setState("idle"); resolve(); };
      const onErr = () => {
        cleanup();
        if (!isRetry) {
          // First failure — reset element and retry once
          const fresh = resetWebEl();
          attempt(fresh, true);
        } else {
          setState("error");
          resolve();
        }
      };
      el.addEventListener("ended", onEnd, { once: true });
      el.addEventListener("error", onErr, { once: true });
      el.src = uri;
      el.load();
      el.play().catch(async () => {
        cleanup();
        if (!isRetry) {
          // play() was blocked (autoplay policy) — reset and retry
          const fresh = resetWebEl();
          attempt(fresh, true);
        } else {
          setState("error");
          resolve();
        }
      });
    };
    setState("playing");
    attempt(getWebEl(), false);
  });
}

// ── Shared playback helper ─────────────────────────────────────────────────────
function _doPlay(base64: string, textForTimeout: string, myGen: number): Promise<void> {
  return new Promise<void>((resolve) => {
    if (myGen !== _generation) { resolve(); return; }

    try {
      if (Platform.OS === "web") {
        const uri = `data:audio/mpeg;base64,${base64}`;
        playWebWithRecovery(uri).then(resolve);

      } else {
        const tmpUri =
          (FileSystem.cacheDirectory ?? "") +
          `tts_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`;

        FileSystem.writeAsStringAsync(tmpUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        })
          .then(() => {
            if (myGen !== _generation) {
              FileSystem.deleteAsync(tmpUri, { idempotent: true }).catch(() => {});
              resolve(); return;
            }

            // Clear any previous listener before attaching the new one
            _clearNativeSub();

            const oldTmp = _nativeActiveTmp;
            _nativeActiveTmp = tmpUri;

            // Reuse the persistent player or create it for the very first time.
            // player.replace() swaps the audio source without destroying the native
            // MediaPlayer — avoids the Android audio pool exhaustion that causes
            // silent failures after ~10 rapid create/remove cycles.
            if (_nativePlayer) {
              try {
                _nativePlayer.replace({ uri: tmpUri });
              } catch {
                // replace() failed — fall back to a fresh instance
                try { _nativePlayer.remove(); } catch { /* ignore */ }
                _nativePlayer = createAudioPlayer({ uri: tmpUri });
              }
            } else {
              _nativePlayer = createAudioPlayer({ uri: tmpUri });
            }

            // Delete the old temp file after the player has moved to the new source
            if (oldTmp && oldTmp !== tmpUri) {
              FileSystem.deleteAsync(oldTmp, { idempotent: true }).catch(() => {});
            }

            const player = _nativePlayer;
            let resolved = false;

            function done() {
              if (resolved) return;
              resolved = true;
              setState("idle");
              _clearNativeSub();
              _nativeCancelCb = null;
              if (_nativeActiveTmp === tmpUri) {
                FileSystem.deleteAsync(tmpUri, { idempotent: true }).catch(() => {});
                _nativeActiveTmp = null;
              }
              resolve();
            }

            // Register cancel hook — called by stop()/stopAll() for instant resolution
            _nativeCancelCb = done;

            const sub = player.addListener("playbackStatusUpdate", (status: any) => {
              if (status?.didJustFinish === true || status?.playbackState === "ended") {
                done();
              }
            });
            _nativeSub = sub;

            setState("playing");
            player.play();

            // Safety timeout: 120 ms/char, min 6 s, max 90 s
            const safetyMs = Math.min(Math.max(textForTimeout.length * 120, 6000), 90000);
            setTimeout(done, safetyMs);
          })
          .catch(() => { setState("error"); resolve(); });
      }
    } catch {
      setState("error");
      resolve();
    }
  });
}

// ── speak() — Google WaveNet Neural2 (chat, lessons, stories, games) ──────────
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

  setState("loading");
  await new Promise<void>((r) => setTimeout(r, 50));
  if (myGen !== _generation) { setState("idle"); return; }

  if (Platform.OS !== "web") {
    try {
      await AudioModule.setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: "mixWithOthers",
      });
    } catch { /* ignore */ }
  }

  const cacheKey = ageGroup ? `${voice}:${ageGroup}` : voice;
  const ck = ttsCacheKey(text, cacheKey);
  let base64 = ttsCacheGet(ck);

  if (!base64) {
    try {
      const result = await ttsSpeak({ text, voice, ageGroup });
      if (!result?.audioBase64) { setState("idle"); return; }
      base64 = result.audioBase64;
      ttsCacheSet(ck, base64);
    } catch {
      setState("error");
      return;
    }
  }

  if (myGen !== _generation) { setState("idle"); return; }
  return _doPlay(base64, text, myGen);
}

// ── speakEdgeStory() — kept for backward compat, routes to speak() ────────────
export async function speakEdgeStory(
  text: string,
  _lang: "en" | "ar",
  voice: "echo" | "nova" = "echo",
): Promise<void> {
  return speak(text, voice);
}
