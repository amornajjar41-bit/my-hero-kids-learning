/**
 * Background music player — calm looping ambient for the Stories screen.
 *
 * Uses a completely separate audio player so it doesn't interfere with
 * the voice-over player in lessonAudio.ts or audio.ts.
 *
 * Volume is kept low (0.18) so the voice-over is always clearly heard.
 */
import { Platform } from "react-native";
import { createAudioPlayer, AudioModule } from "expo-audio";

// Calm, royalty-free lullaby/ambient piano (public domain – Erik Satie, Gymnopedie No. 1)
const BG_MUSIC_URL =
  "https://archive.org/download/02GymnopedinNo._1_satie_/02_Gymnopedie_No._1_satie_.mp3";

const VOLUME = 0.18;

// ── Native player ─────────────────────────────────────────────────────────────
let _bgPlayer: ReturnType<typeof createAudioPlayer> | null = null;

// ── Web element ───────────────────────────────────────────────────────────────
let _bgWebEl: HTMLAudioElement | null = null;

export function stopBgMusic(): void {
  if (_bgPlayer) {
    try { _bgPlayer.pause(); } catch { /* ignore */ }
    try { _bgPlayer.remove(); } catch { /* ignore */ }
    _bgPlayer = null;
  }
  if (_bgWebEl) {
    try { _bgWebEl.pause(); _bgWebEl.src = ""; } catch { /* ignore */ }
    _bgWebEl = null;
  }
}

export async function startBgMusic(): Promise<void> {
  stopBgMusic(); // ensure clean state

  try {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return;
      const el = new Audio(BG_MUSIC_URL);
      el.volume = VOLUME;
      el.loop = true;
      el.preload = "auto";
      _bgWebEl = el;
      el.play().catch(() => {
        // Browsers may block autoplay — silently ignore
      });
    } else {
      await AudioModule.setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
      }).catch(() => {});

      const player = createAudioPlayer({ uri: BG_MUSIC_URL });
      player.volume = VOLUME;
      player.loop = true;
      _bgPlayer = player;
      player.play();
    }
  } catch {
    // Music is optional — never break the story reader
  }
}
