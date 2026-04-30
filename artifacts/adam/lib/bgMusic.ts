/**
 * Background music player — calm looping ambient for the Stories screen.
 *
 * Runs in a completely separate player from the voice-over so both can
 * play simultaneously. Uses mixWithOthers so the narrator is never interrupted.
 *
 * Key fix: listen for "isLoaded" status before calling play(), because
 * createAudioPlayer() loads asynchronously and an immediate play() may be
 * ignored if the source buffer isn't ready yet.
 */
import { Platform } from "react-native";
import { createAudioPlayer, AudioModule } from "expo-audio";

const BG_MUSIC_URL =
  "https://ptkncbdsrnzkmuagygom.supabase.co/storage/v1/object/public/game-audio/bg-music.mp3";

const VOLUME = 0.15;

let _bgPlayer: ReturnType<typeof createAudioPlayer> | null = null;
let _bgWebEl: HTMLAudioElement | null = null;
let _active = false;
let _hasStarted = false;

export function stopBgMusic(): void {
  _active = false;
  _hasStarted = false;
  if (_bgPlayer) {
    try { _bgPlayer.pause(); } catch { }
    try { _bgPlayer.remove(); } catch { }
    _bgPlayer = null;
  }
  if (_bgWebEl) {
    try { _bgWebEl.pause(); _bgWebEl.src = ""; } catch { }
    _bgWebEl = null;
  }
}

export async function startBgMusic(): Promise<void> {
  stopBgMusic();
  _active = true;
  _hasStarted = false;

  try {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return;
      const el = new Audio(BG_MUSIC_URL);
      el.volume = VOLUME;
      el.loop = true;
      el.preload = "auto";
      _bgWebEl = el;
      el.play().catch(() => {});
      return;
    }

    // Set MixWithOthers BEFORE creating the player so the audio session is
    // already in mixing mode when the player initialises its own session.
    await AudioModule.setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: "mixWithOthers",
    }).catch(() => {});

    const player = createAudioPlayer({ uri: BG_MUSIC_URL });
    _bgPlayer = player;

    // Set properties — wrapped in try/catch in case they're read-only on some builds
    try { (player as any).volume = VOLUME; } catch { }
    try { (player as any).loop = true; } catch { }

    player.addListener("playbackStatusUpdate", (status: any) => {
      if (!_active || _bgPlayer !== player) return;

      // Fire play() the first time the source is loaded and buffered
      if (!_hasStarted && status.isLoaded) {
        _hasStarted = true;
        try { player.play(); } catch { }
      }

      // Manual loop fallback — covers builds where player.loop didn't stick
      if (status.didJustFinish || status.playbackState === "ended") {
        try { player.seekTo(0); player.play(); } catch { }
      }
    });

    // Also try immediately — succeeds if audio was already cached on device
    try { player.play(); } catch { }

  } catch {
    // Background music is optional — never let this crash the story screen
  }
}
