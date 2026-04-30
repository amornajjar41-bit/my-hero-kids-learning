/**
 * Background music player — calm looping ambient for the Stories screen.
 *
 * Runs in a completely separate player from the voice-over so both can
 * play simultaneously. Uses mixWithOthers so the narrator is never interrupted.
 *
 * Robust: isLoaded listener + immediate play attempt + 2s timer fallback.
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
let _fallbackTimer: ReturnType<typeof setTimeout> | null = null;

export function stopBgMusic(): void {
  _active = false;
  _hasStarted = false;
  if (_fallbackTimer) { clearTimeout(_fallbackTimer); _fallbackTimer = null; }
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

    // Set MixWithOthers BEFORE creating the player
    await AudioModule.setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: "mixWithOthers",
    }).catch(() => {});

    const player = createAudioPlayer({ uri: BG_MUSIC_URL });
    _bgPlayer = player;

    // Set volume and loop
    try { (player as any).volume = VOLUME; } catch { }
    try { (player as any).loop = true; } catch { }

    const doPlay = () => {
      if (!_active || _bgPlayer !== player) return;
      if (!_hasStarted) {
        _hasStarted = true;
        try { player.volume = VOLUME; } catch { }
        try { player.play(); } catch { }
      }
    };

    player.addListener("playbackStatusUpdate", (status: any) => {
      if (!_active || _bgPlayer !== player) return;

      // Fire play() the first time source is loaded and ready
      if (status.isLoaded && !_hasStarted) {
        doPlay();
      }

      // Manual loop fallback
      if (_hasStarted && (status.didJustFinish || status.playbackState === "ended")) {
        try { player.seekTo(0); player.play(); } catch { }
      }
    });

    // Immediate attempt — works if audio is cached
    doPlay();

    // 2-second timer fallback — covers slow networks or unresponsive status events
    _fallbackTimer = setTimeout(() => {
      _fallbackTimer = null;
      doPlay();
    }, 2000);

  } catch {
    // Background music is optional — never crash the story screen
  }
}
