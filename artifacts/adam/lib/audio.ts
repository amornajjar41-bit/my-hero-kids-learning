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
  setState("idle");
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
  setState("idle");
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
        // Write base64 → temp MP3 → play with expo-audio
        const tmpUri =
          (FileSystem.cacheDirectory ?? "") +
          `tts_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`;

        FileSystem.writeAsStringAsync(tmpUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        })
          .then(() => {
            if (myGen !== _generation) { resolve(); return; }

            const player = createAudioPlayer({ uri: tmpUri });
            _nativePlayer = player;

            let resolved = false;
            function done() {
              if (resolved) return;
              resolved = true;
              setState("idle");
              if (_nativePlayer === player) _nativePlayer = null;
              FileSystem.deleteAsync(tmpUri, { idempotent: true }).catch(() => {});
              resolve();
            }

            player.addListener("playbackStatusUpdate", (status: any) => {
              if (
                status?.didJustFinish === true ||
                status?.playbackState === "ended" ||
                status?.playbackState === "stopped"
              ) {
                done();
              }
            });

            setState("playing");
            player.play();

            // Safety timeout: 120 ms/char, min 6 s, max 90 s
            const safetyMs = Math.min(
              Math.max(textForTimeout.length * 120, 6000),
              90000,
            );
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
