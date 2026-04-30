/**
 * Background music player — calm looping ambient for the Stories screen.
 *
 * Runs in a completely separate player from the voice-over so both can
 * play simultaneously. iOS mixing is enabled via interruptionModeIOS: 0
 * (MixWithOthers) — set here AND in audio.ts / lessonAudio.ts so no call
 * to setAudioModeAsync ever resets it to DoNotMix.
 *
 * Volume 0.18 — quiet enough that the narrator voice is always clear.
 */
import { Platform } from "react-native";
import { createAudioPlayer, AudioModule } from "expo-audio";

// BenSound "Relaxing" — royalty-free, calm piano, stable CDN
const BG_MUSIC_URL =
  "https://www.bensound.com/bensound-music/bensound-relaxing.mp3";

const VOLUME = 0.18;

let _bgPlayer: ReturnType<typeof createAudioPlayer> | null = null;
let _bgWebEl: HTMLAudioElement | null = null;
let _active = false;

export function stopBgMusic(): void {
  _active = false;
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
  stopBgMusic();
  _active = true;

  try {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return;
      const el = new Audio(BG_MUSIC_URL);
      el.volume = VOLUME;
      el.loop = true;
      el.preload = "auto";
      _bgWebEl = el;
      el.play().catch(() => { /* autoplay blocked — silently skip */ });
      return;
    }

    // Native — set MixWithOthers FIRST so this player never interrupts voice-over
    await AudioModule.setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    }).catch(() => {});

    const player = createAudioPlayer({ uri: BG_MUSIC_URL });
    _bgPlayer = player;

    try { player.volume = VOLUME; } catch { /* property may not exist on all versions */ }
    try { player.loop = true; } catch { /* same */ }

    // Explicit loop fallback via event — seekTo(0) and replay when track ends
    player.addListener("playbackStatusUpdate", (status: any) => {
      if (status.didJustFinish && _active && _bgPlayer === player) {
        try {
          player.seekTo(0);
          player.play();
        } catch { /* ignore */ }
      }
    });

    player.play();
  } catch {
    // Music is completely optional — never crash the story screen
  }
}
