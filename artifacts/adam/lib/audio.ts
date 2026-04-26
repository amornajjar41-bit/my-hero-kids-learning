/**
 * Lightweight TTS playback layer.
 * On native: writes audio to a temp file then plays with expo-audio.
 *            (expo-audio does NOT support data: URIs on native)
 * On web: uses HTML5 Audio with a data URI.
 */
import { Platform } from "react-native";
import { createAudioPlayer, AudioModule } from "expo-audio";
import * as FileSystem from "expo-file-system";

import { ttsSpeak } from "./api";

let currentPlayer: ReturnType<typeof createAudioPlayer> | null = null;
let currentWebAudio: HTMLAudioElement | null = null;
let soundEnabled = true;

export function setSoundEnabled(on: boolean) {
  soundEnabled = on;
  if (!on) stop();
}

export function stop() {
  try {
    currentPlayer?.pause();
    currentPlayer?.remove();
  } catch { /* no-op */ }
  currentPlayer = null;
  if (currentWebAudio) {
    try {
      currentWebAudio.pause();
      currentWebAudio.src = "";
    } catch { /* no-op */ }
    currentWebAudio = null;
  }
}

const cache = new Map<string, string>(); // key -> base64 or data URI

export async function speak(
  text: string,
  voice: "echo" | "nova" = "echo",
  speed = 1.05,
): Promise<void> {
  if (!soundEnabled || !text) return;

  if (Platform.OS !== "web") {
    try {
      await AudioModule.setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
      });
    } catch { /* ignore */ }
  }

  const key = `${voice}:${text.slice(0, 120)}`;
  let base64 = cache.get(key);

  if (!base64) {
    const result = await ttsSpeak({ text, voice, speed });
    if (!result.audioBase64) return;
    base64 = result.audioBase64;
    if (cache.size > 30) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(key, base64);
  }

  stop();

  return new Promise<void>((resolve) => {
    try {
      if (Platform.OS === "web") {
        // Web: data URI works fine with HTML Audio
        const uri = `data:audio/mpeg;base64,${base64}`;
        const audio = new Audio(uri);
        currentWebAudio = audio;
        audio.onended = () => { currentWebAudio = null; resolve(); };
        audio.onerror  = () => { currentWebAudio = null; resolve(); };
        audio.play().catch(() => resolve());
      } else {
        // Native: expo-audio does NOT support data: URIs.
        // Write base64 to a temp file first, then play from file URI.
        const tmpUri = (FileSystem.cacheDirectory ?? "") + `tts_${Date.now()}.mp3`;
        FileSystem.writeAsStringAsync(tmpUri, base64!, {
          encoding: FileSystem.EncodingType.Base64,
        }).then(() => {
          const player = createAudioPlayer({ uri: tmpUri });
          currentPlayer = player;
          player.addListener("playbackStatusUpdate", (status: any) => {
            if (status.didJustFinish || status.isLoaded === false) {
              currentPlayer = null;
              // Clean up temp file (fire-and-forget)
              FileSystem.deleteAsync(tmpUri, { idempotent: true }).catch(() => {});
              resolve();
            }
          });
          player.play();
          // Safety timeout in case the event never fires
          setTimeout(() => { resolve(); }, Math.max(text.length * 70, 3000));
        }).catch(() => resolve());
      }
    } catch (e) {
      console.warn("[audio] play failed", e);
      resolve();
    }
  });
}
