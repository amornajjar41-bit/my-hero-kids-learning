/**
 * Lightweight TTS playback layer.
 * On native: uses expo-audio.
 * On web: uses HTML5 Audio (more reliable for data URIs).
 * Returns a Promise that resolves when playback finishes.
 */
import { Platform } from "react-native";
import { createAudioPlayer, AudioModule } from "expo-audio";

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
  } catch {
    // no-op
  }
  currentPlayer = null;
  if (currentWebAudio) {
    try {
      currentWebAudio.pause();
      currentWebAudio.src = "";
    } catch {
      // no-op
    }
    currentWebAudio = null;
  }
}

const cache = new Map<string, string>(); // key -> data URI

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
    } catch {
      // ignore
    }
  }
  const key = `${voice}:${text.slice(0, 120)}`;
  let uri = cache.get(key);
  if (!uri) {
    const { audioBase64, mimeType } = await ttsSpeak({ text, voice, speed });
    if (!audioBase64) return;
    uri = `data:${mimeType || "audio/mpeg"};base64,${audioBase64}`;
    if (cache.size > 30) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(key, uri);
  }
  stop();
  return new Promise<void>((resolve) => {
    try {
      if (Platform.OS === "web") {
        const audio = new Audio(uri);
        currentWebAudio = audio;
        audio.onended = () => { currentWebAudio = null; resolve(); };
        audio.onerror = () => { currentWebAudio = null; resolve(); };
        audio.play().catch(() => resolve());
      } else {
        const player = createAudioPlayer({ uri });
        currentPlayer = player;
        player.addListener("playbackStatusUpdate", (status: any) => {
          if (status.didJustFinish || status.isLoaded === false) {
            currentPlayer = null;
            resolve();
          }
        });
        player.play();
        // Fallback: if no event fires, resolve after estimated time
        setTimeout(resolve, Math.max(text.length * 60, 2000));
      }
    } catch (e) {
      console.warn("[audio] play failed", e);
      resolve();
    }
  });
}
