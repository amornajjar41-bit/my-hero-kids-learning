/**
 * Lightweight TTS playback layer using expo-audio.
 * Caches the most recent audio buffers in-memory by text+voice key.
 */
import { createAudioPlayer, AudioModule } from "expo-audio";

import { ttsSpeak } from "./api";

let currentPlayer: ReturnType<typeof createAudioPlayer> | null = null;
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
}

const cache = new Map<string, string>(); // key -> data URI

export async function speak(
  text: string,
  voice: "echo" | "nova" = "echo",
  speed = 1.05,
) {
  if (!soundEnabled || !text) return;
  try {
    await AudioModule.setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    });
  } catch {
    // ignore
  }
  const key = `${voice}:${text}`;
  let uri = cache.get(key);
  if (!uri) {
    const { audioBase64, mimeType } = await ttsSpeak({ text, voice, speed });
    uri = `data:${mimeType};base64,${audioBase64}`;
    if (cache.size > 30) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(key, uri);
  }
  stop();
  try {
    currentPlayer = createAudioPlayer({ uri });
    currentPlayer.play();
  } catch (e) {
    console.warn("[audio] play failed", e);
  }
}
