/**
 * AudioManager — device-native TTS engine.
 *
 * Uses expo-speech on native (iOS/Android) and window.speechSynthesis on web.
 * No server round-trips, no latency, works offline, supports Arabic & English.
 *
 * Public API (unchanged from before):
 *   speak(text, voice, speed?)  → plays text aloud
 *   stopAll()                   → stops current speech (async, safe to await)
 *   stop()                      → stops current speech (sync, for cleanup returns)
 *   setSoundEnabled(on)         → global mute/unmute
 *   isSpeaking()                → whether audio is currently playing
 */
import { Platform } from "react-native";

// ── Shared state ──────────────────────────────────────────────────────────────
let _soundEnabled = true;
let _speaking = false;

export function setSoundEnabled(on: boolean) {
  _soundEnabled = on;
  if (!on) stopAll();
}

export function isSpeaking(): boolean {
  return _speaking;
}

// ── Detect Arabic ─────────────────────────────────────────────────────────────
function isArabicText(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

// ── Stop helpers ──────────────────────────────────────────────────────────────
export function stop(): void {
  _speaking = false;
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch { /* no-op */ }
    }
  } else {
    import("expo-speech").then((Speech) => {
      try { Speech.stop(); } catch { /* no-op */ }
    }).catch(() => {});
  }
}

export async function stopAll(): Promise<void> {
  stop();
  // Small cooldown so hardware fully resets
  await new Promise<void>((r) => setTimeout(r, 50));
}

// ── Web Speech API ────────────────────────────────────────────────────────────
function speakWeb(text: string, isArabic: boolean, isFemale: boolean, speed: number): Promise<void> {
  return new Promise<void>((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isArabic ? "ar-SA" : "en-US";
    utterance.rate = Math.min(1.2, Math.max(0.7, speed));
    utterance.pitch = isFemale ? 1.2 : 0.9;

    // Try to find a matching voice (best-effort, not critical)
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const langPrefix = isArabic ? "ar" : "en";
      const matching = voices.filter((v) => v.lang.startsWith(langPrefix));
      if (matching.length > 0) {
        // Prefer female/male voice if available
        const gendered = matching.find((v) =>
          isFemale
            ? /female|woman|girl|zira|samantha|karen|moira|tessa|fiona|victoria|ava|siri/i.test(v.name)
            : /male|man|boy|daniel|alex|fred|jorge|luca|reed/i.test(v.name)
        );
        utterance.voice = gendered ?? matching[0]!;
      }
    }

    utterance.onend = () => { _speaking = false; resolve(); };
    utterance.onerror = () => { _speaking = false; resolve(); };

    _speaking = true;
    window.speechSynthesis.speak(utterance);

    // Safety fallback: resolve after max duration (text.length * 80ms, min 3s, max 20s)
    const maxMs = Math.min(20000, Math.max(3000, text.length * 80));
    const safety = setTimeout(() => { _speaking = false; resolve(); }, maxMs);
    utterance.onend = () => { clearTimeout(safety); _speaking = false; resolve(); };
    utterance.onerror = () => { clearTimeout(safety); _speaking = false; resolve(); };
  });
}

// ── Native expo-speech ────────────────────────────────────────────────────────
async function speakNative(text: string, isArabic: boolean, isFemale: boolean, speed: number): Promise<void> {
  const Speech = await import("expo-speech");

  // Stop anything currently playing
  try { Speech.stop(); } catch { /* no-op */ }

  return new Promise<void>((resolve) => {
    _speaking = true;

    const options: Parameters<typeof Speech.speak>[1] = {
      language: isArabic ? "ar-SA" : "en-US",
      rate: Math.min(1.1, Math.max(0.7, speed * 0.95)), // slightly slower for kids
      pitch: isFemale ? 1.15 : 0.9,
      onDone: () => { _speaking = false; resolve(); },
      onError: () => { _speaking = false; resolve(); },
      onStopped: () => { _speaking = false; resolve(); },
    };

    try {
      Speech.speak(text, options);
    } catch {
      _speaking = false;
      resolve();
    }

    // Safety timeout
    const maxMs = Math.min(20000, Math.max(3000, text.length * 80));
    setTimeout(() => { _speaking = false; resolve(); }, maxMs);
  });
}

// ── Public speak() ────────────────────────────────────────────────────────────
export async function speak(
  text: string,
  voice: "echo" | "nova" = "echo",
  speed = 1.05,
  _contentType?: string,
): Promise<void> {
  if (!_soundEnabled || !text?.trim()) return;

  const isArabic = isArabicText(text);
  const isFemale = voice === "nova";

  if (Platform.OS === "web") {
    return speakWeb(text, isArabic, isFemale, speed);
  } else {
    return speakNative(text, isArabic, isFemale, speed);
  }
}
