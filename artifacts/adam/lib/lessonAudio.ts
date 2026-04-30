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
let _nativePlayer: ReturnType<typeof createAudioPlayer> | null = null;

// Only set audio mode once per session — repeated calls on Android can reset
// the audio session mid-playback and cause glitches.
let _audioModeSet = false;

function _killNativePlayer(): void {
  if (_nativePlayer) {
    try { _nativePlayer.pause(); _nativePlayer.remove(); } catch { /* ignore */ }
    _nativePlayer = null;
  }
}

export function stopPreloaded(): void {
  _gen++;
  _killNativePlayer();
}

// Register with audio.ts so speak() / stopAll() also kills our player.
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
    // No cache hit — stop our own player then delegate to fallback (which uses audio.ts)
    stopPreloaded();
    if (fallback) await fallback();
    return false;
  }

  // Stop BOTH the lessonAudio player AND any audio.ts (speak) player that may be
  // running. Without this, two players overlap and cause the voice to glitch/cut.
  stopPreloaded();   // stops lessonAudio._nativePlayer
  audioStop();       // stops audio.ts._nativePlayer (speak / TTS player)

  const myGen = ++_gen;

  // Brief hardware flush — lets the previous player fully release the audio track
  await new Promise<void>((r) => setTimeout(r, 30));
  if (myGen !== _gen) return true; // superseded by a newer call

  return new Promise<void>((resolve) => {
    if (myGen !== _gen) { resolve(); return; }

    try {
      if (Platform.OS === "web") {
        const el = document.createElement("audio");
        el.src = `data:audio/mpeg;base64,${base64}`;
        el.onended = () => resolve();
        el.onerror = () => resolve();
        el.play().catch(() => resolve());
      } else {
        // Set audio mode once per session — repeated calls on Android reset the
        // audio session mid-playback and are the primary cause of glitching.
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
            // Cancelled while writing — clean up the temp file immediately
            FileSystem.deleteAsync(tmpUri, { idempotent: true }).catch(() => {});
            resolve(); return;
          }
          const player = createAudioPlayer({ uri: tmpUri });
          _nativePlayer = player;
          let _doneOnce = false;
          const done = () => {
            if (_doneOnce) return;
            _doneOnce = true;
            if (_nativePlayer === player) _nativePlayer = null;
            FileSystem.deleteAsync(tmpUri, { idempotent: true }).catch(() => {});
            resolve();
          };
          player.addListener("playbackStatusUpdate", (status: any) => {
            if (status.didJustFinish || status.playbackState === "ended" || status.playbackState === "stopped") done();
          });
          player.play();
          // Safety timeout: ~0.1ms per base64 char (≈128 kbps MP3), min 4s, max 120s
          const safeMs = Math.min(120000, Math.max(4000, base64.length * 0.1));
          setTimeout(() => done(), safeMs);
        }).catch(() => resolve());
      }
    } catch {
      resolve();
    }
  }).then(() => true);
}
