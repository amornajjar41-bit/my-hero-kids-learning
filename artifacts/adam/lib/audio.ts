/**
 * Global Audio Manager — single-source-of-truth for all app audio.
 *
 * KEY RULES enforced here:
 * 1. Only ONE audio source can ever play at a time (FIX 2 — no overlap).
 * 2. Any call to speak() immediately cancels the previous one (FIX 2).
 * 3. stop() is exported so screens can clean up on unmount/navigation (FIX 3).
 * 4. A generation counter prevents stale API responses from starting playback
 *    after a newer request has already superseded them.
 */
import { Platform } from "react-native";
import { createAudioPlayer, AudioModule } from "expo-audio";
import * as FileSystem from "expo-file-system";

import { ttsSpeak } from "./api";

// ── State ────────────────────────────────────────────────────────────────────
let currentPlayer: ReturnType<typeof createAudioPlayer> | null = null;
let currentWebAudio: HTMLAudioElement | null = null;
let soundEnabled = true;

/** Incremented every time speak() is called. Lets us detect superseded calls. */
let _generation = 0;

export function setSoundEnabled(on: boolean) {
  soundEnabled = on;
  if (!on) stop();
}

/** Returns true if audio is currently playing. */
export function isSpeaking(): boolean {
  if (Platform.OS === "web") return currentWebAudio !== null && !currentWebAudio.paused;
  return currentPlayer !== null;
}

/**
 * Stop ALL playing audio immediately and reset state.
 * Safe to call at any time, from any screen.
 */
export function stop() {
  // Stop native player
  try { currentPlayer?.pause(); } catch { /* no-op */ }
  try { currentPlayer?.remove(); } catch { /* no-op */ }
  currentPlayer = null;

  // Stop web audio
  if (currentWebAudio) {
    try {
      currentWebAudio.pause();
      currentWebAudio.src = "";
    } catch { /* no-op */ }
    currentWebAudio = null;
  }

  // Bump generation so any in-flight speak() calls abort before playing
  _generation++;
}

const cache = new Map<string, string>(); // key -> base64

export async function speak(
  text: string,
  voice: "echo" | "nova" = "echo",
  speed = 1.05,
  contentType: "explanation" | "greeting" | "celebration" | "story" = "explanation",
): Promise<void> {
  if (!soundEnabled || !text) return;

  // Claim this generation slot; any previous in-flight call is now stale
  const myGen = ++_generation;

  // Immediately stop whatever was playing (FIX 2 — no overlap ever)
  // We stop BEFORE awaiting the API so the old audio is silenced right away
  if (currentWebAudio) {
    try { currentWebAudio.pause(); currentWebAudio.src = ""; } catch { /* no-op */ }
    currentWebAudio = null;
  }
  if (currentPlayer) {
    try { currentPlayer.pause(); currentPlayer.remove(); } catch { /* no-op */ }
    currentPlayer = null;
  }

  if (Platform.OS !== "web") {
    try {
      await AudioModule.setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
      });
    } catch { /* ignore */ }
  }

  const key = `${voice}:${contentType}:${text.slice(0, 120)}`;
  let base64 = cache.get(key);

  if (!base64) {
    const result = await ttsSpeak({ text, voice, speed, contentType });
    if (!result.audioBase64) return;
    base64 = result.audioBase64;
    // Evict oldest entry if cache is full
    if (cache.size > 40) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(key, base64);
  }

  // If a newer speak() call arrived while we were fetching, abort (FIX 2)
  if (myGen !== _generation) return;

  return new Promise<void>((resolve) => {
    // Double-check generation before starting playback
    if (myGen !== _generation) { resolve(); return; }

    try {
      if (Platform.OS === "web") {
        const uri = `data:audio/mpeg;base64,${base64}`;
        const audio = new Audio(uri);
        currentWebAudio = audio;
        audio.onended = () => { if (currentWebAudio === audio) currentWebAudio = null; resolve(); };
        audio.onerror = () => { if (currentWebAudio === audio) currentWebAudio = null; resolve(); };
        audio.play().catch(() => resolve());
      } else {
        const tmpUri = (FileSystem.cacheDirectory ?? "") + `tts_${Date.now()}.mp3`;
        FileSystem.writeAsStringAsync(tmpUri, base64!, {
          encoding: FileSystem.EncodingType.Base64,
        }).then(() => {
          // Check generation again — a stop() might have been called
          if (myGen !== _generation) { resolve(); return; }
          const player = createAudioPlayer({ uri: tmpUri });
          currentPlayer = player;
          player.addListener("playbackStatusUpdate", (status: any) => {
            if (status.didJustFinish || status.isLoaded === false) {
              if (currentPlayer === player) currentPlayer = null;
              FileSystem.deleteAsync(tmpUri, { idempotent: true }).catch(() => {});
              resolve();
            }
          });
          player.play();
          // Safety timeout
          setTimeout(() => resolve(), Math.max(text.length * 70, 4000));
        }).catch(() => resolve());
      }
    } catch (e) {
      console.warn("[audio] play failed", e);
      resolve();
    }
  });
}
