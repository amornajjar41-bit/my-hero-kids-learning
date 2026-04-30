/**
 * Lesson & Game Audio Preloader
 *
 * Pre-fetches all audio for a lesson (or game type) from the API server's
 * /api/audio/batch endpoint and caches the base64 strings in memory.
 *
 * playPreloaded() then plays from the in-memory cache in < 100ms
 * (no network call, just fire base64 directly into AudioManager).
 */
import { Platform } from "react-native";
import { createAudioPlayer, AudioModule } from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";

// ── Cross-module stop registration ───────────────────────────────────────────
// Tells audio.ts to call our stopPreloaded() whenever speak() / stopAll() runs.
// This prevents two players from running at the same time across both modules.
import { stop as audioStop, setLessonAudioStop } from "./audio";

// ── API base URL helper ───────────────────────────────────────────────────────
// Priority: EXPO_PUBLIC_API_URL (EAS builds) → EXPO_PUBLIC_DOMAIN (Replit dev) → https://myheroapp.org
function getBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "https://myheroapp.org";
}

// ── In-memory audio cache ─────────────────────────────────────────────────────
// path → base64 MP3 string
const _audioCache = new Map<string, string>();
// Preload state per context key (lesson ID or game type)
const _preloaded = new Set<string>();

// ── Path builders ─────────────────────────────────────────────────────────────
export function wordPath(lessonId: string, wordIndex: number, type: "pronunciation" | "hint" | "reveal", lang: "en" | "ar"): string {
  return `lesson/${lessonId}/${wordIndex}/${type}-${lang}`;
}

export function mathNumPath(n: number, lang: "en" | "ar"): string {
  return `games/math/num-${n}-${lang}`;
}

export function mathOpPath(op: "plus" | "minus" | "times" | "div" | "equals", lang: "en" | "ar"): string {
  return `games/math/op-${op}-${lang}`;
}

export function mathCorrectPath(variant: number, lang: "en" | "ar"): string {
  return `games/math/correct-${variant}-${lang}`;
}

export function letterCelebratePath(variant: number, lang: "en" | "ar"): string {
  return `games/letter/celebrate-${variant}-${lang}`;
}

export function jigsawFunFactPath(id: string, lang: "en" | "ar"): string {
  return `games/jigsaw/${id}-${lang}`;
}

export function storyPath(storyId: string, sentenceIndex: number): string {
  return `story-${storyId}/sentence-${sentenceIndex}`;
}

// ── Batch fetch from server ───────────────────────────────────────────────────
async function batchFetch(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  try {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/audio/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths }),
    });
    if (!res.ok) return;
    const data = await res.json() as { audios: Record<string, string> };
    for (const [path, base64] of Object.entries(data.audios)) {
      _audioCache.set(path, base64);
    }
  } catch {
    // Silently ignore — fallback to regular TTS will handle it
  }
}

// ── Preload helpers ───────────────────────────────────────────────────────────

/**
 * Preload all audio for a specific lesson.
 * Call on lesson screen mount. Non-blocking — returns void Promise.
 */
export async function preloadLesson(
  lessonId: string,
  wordCount: number,
  lang: "en" | "ar",
): Promise<void> {
  const key = `lesson:${lessonId}`;
  if (_preloaded.has(key)) return;
  _preloaded.add(key);

  const paths: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    paths.push(wordPath(lessonId, i, "pronunciation", "en"));
    paths.push(wordPath(lessonId, i, "pronunciation", "ar"));
    paths.push(wordPath(lessonId, i, "hint", lang));
    paths.push(wordPath(lessonId, i, "reveal", lang));
  }
  await batchFetch(paths);
}

/**
 * Preload math blast audio (numbers 0–100, operators, confirmations).
 */
export async function preloadMathAudio(lang: "en" | "ar"): Promise<void> {
  const key = `math:${lang}`;
  if (_preloaded.has(key)) return;
  _preloaded.add(key);

  const paths: string[] = [];
  for (let n = 0; n <= 100; n++) paths.push(mathNumPath(n, lang));
  for (const op of ["plus", "minus", "times", "div", "equals"] as const) {
    paths.push(mathOpPath(op, lang));
  }
  for (let i = 0; i < 5; i++) paths.push(mathCorrectPath(i, lang));
  await batchFetch(paths);
}

/**
 * Preload letter match celebration phrases.
 */
export async function preloadLetterAudio(lang: "en" | "ar"): Promise<void> {
  const key = `letter:${lang}`;
  if (_preloaded.has(key)) return;
  _preloaded.add(key);

  const paths: string[] = [];
  for (let i = 0; i < 5; i++) paths.push(letterCelebratePath(i, lang));
  await batchFetch(paths);
}

/**
 * Preload jigsaw fun fact audio for all 6 puzzles.
 */
export async function preloadJigsawAudio(lang: "en" | "ar"): Promise<void> {
  const key = `jigsaw:${lang}`;
  if (_preloaded.has(key)) return;
  _preloaded.add(key);

  const ids = ["solar", "world", "abc", "ocean", "jungle", "space"];
  const paths = ids.map((id) => jigsawFunFactPath(id, lang));
  await batchFetch(paths);
}

/**
 * Preload all sentences for a story.
 */
export async function preloadStory(storyId: string, sentenceCount: number): Promise<void> {
  const key = `story:${storyId}`;
  if (_preloaded.has(key)) return;
  _preloaded.add(key);

  const paths: string[] = [];
  for (let i = 0; i < sentenceCount; i++) paths.push(storyPath(storyId, i));
  await batchFetch(paths);
}

/** Check if a path has been preloaded */
export function isPreloaded(path: string): boolean {
  return _audioCache.has(path);
}

/** Manually insert audio into the in-memory cache (e.g. after on-demand generation) */
export function cacheAudio(path: string, base64: string): void {
  _audioCache.set(path, base64);
}

// ── Playback (< 100ms when preloaded) ────────────────────────────────────────

let _gen = 0;

// Single persistent player — reused via player.replace() to avoid exhausting
// Android's audio session pool (same fix as audio.ts).
let _nativePlayer: ReturnType<typeof createAudioPlayer> | null = null;
let _nativeSub: { remove: () => void } | null = null;
let _nativeActiveTmp: string | null = null;
let _cancelCb: (() => void) | null = null;

let _audioModeSet = false;

function _clearSub(): void {
  if (_nativeSub) { try { _nativeSub.remove(); } catch { /* ignore */ } _nativeSub = null; }
}

function _cancelPending(): void {
  if (_cancelCb) { const c = _cancelCb; _cancelCb = null; c(); }
}

export function stopPreloaded(): void {
  _gen++;
  _clearSub();
  _cancelPending(); // immediately resolves any awaited playPreloaded() Promise
  if (_nativePlayer) {
    try { _nativePlayer.pause(); } catch { /* ignore */ }
    // Do NOT remove — reuse on next playPreloaded() via player.replace()
  }
}

// Register with audio.ts so speak() / stopAll() also pauses our player.
// This prevents two players from simultaneously playing across both modules.
setLessonAudioStop(stopPreloaded);

/**
 * Play a pre-generated audio path.
 * Falls back to the fallback function if not cached.
 * Returns true if played from cache, false if fell back.
 */
export async function playPreloaded(
  path: string,
  fallback?: () => Promise<void>,
): Promise<boolean> {
  const base64 = _audioCache.get(path);
  if (!base64) {
    stopPreloaded();
    if (fallback) await fallback();
    return false;
  }

  // Stop BOTH players — lessonAudio (via stopPreloaded) and audio.ts speak player.
  // audioStop() calls stop() which calls _lessonAudioStop = stopPreloaded again (double OK).
  stopPreloaded();
  audioStop();

  const myGen = ++_gen;

  await new Promise<void>((r) => setTimeout(r, 30));
  if (myGen !== _gen) return true;

  return new Promise<boolean>((resolve) => {
    if (myGen !== _gen) { resolve(true); return; }

    if (Platform.OS === "web") {
      const el = document.createElement("audio");
      el.src = `data:audio/mpeg;base64,${base64}`;
      el.onended = () => resolve(true);
      el.onerror = () => resolve(true);
      el.play().catch(() => resolve(true));
      return;
    }

    // Set audio mode once — calling setAudioModeAsync on every play can reset
    // the Android audio session mid-track.
    if (!_audioModeSet) {
      _audioModeSet = true;
      AudioModule.setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: "mixWithOthers",
      }).catch(() => {});
    }

    const tmpUri = (FileSystem.cacheDirectory ?? "") + `pre_${Date.now()}.mp3`;

    FileSystem.writeAsStringAsync(tmpUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    }).then(() => {
      if (myGen !== _gen) {
        FileSystem.deleteAsync(tmpUri, { idempotent: true }).catch(() => {});
        resolve(true); return;
      }

      // Clear previous listener, swap temp file, reuse / create player
      _clearSub();
      const oldTmp = _nativeActiveTmp;
      _nativeActiveTmp = tmpUri;

      if (_nativePlayer) {
        try {
          _nativePlayer.replace({ uri: tmpUri });
        } catch {
          try { _nativePlayer.remove(); } catch { /* ignore */ }
          _nativePlayer = createAudioPlayer({ uri: tmpUri });
        }
      } else {
        _nativePlayer = createAudioPlayer({ uri: tmpUri });
      }

      // Delete old temp file after player has replaced its source
      if (oldTmp && oldTmp !== tmpUri) {
        FileSystem.deleteAsync(oldTmp, { idempotent: true }).catch(() => {});
      }

      let _doneOnce = false;
      const done = () => {
        if (_doneOnce) return;
        _doneOnce = true;
        _clearSub();
        _cancelCb = null;
        if (_nativeActiveTmp === tmpUri) {
          FileSystem.deleteAsync(tmpUri, { idempotent: true }).catch(() => {});
          _nativeActiveTmp = null;
        }
        resolve(true);
      };

      // Cancel hook — lets stopPreloaded() instantly resolve any awaited Promise
      _cancelCb = done;

      const sub = _nativePlayer.addListener("playbackStatusUpdate", (status: any) => {
        if (status.didJustFinish || status.playbackState === "ended") done();
      });
      _nativeSub = sub;

      _nativePlayer.play();

      // Safety timeout: ~0.1ms per base64 char (≈128 kbps MP3), min 4s, max 120s
      const safeMs = Math.min(120000, Math.max(4000, base64.length * 0.1));
      setTimeout(() => done(), safeMs);
    }).catch(() => resolve(true));
  });
}
