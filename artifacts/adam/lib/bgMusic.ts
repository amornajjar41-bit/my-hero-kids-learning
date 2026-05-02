/**
 * Background music player — calm looping ambient for the Stories screen.
 *
 * Runs in a completely separate player from the voice-over so both can
 * play simultaneously. Uses mixWithOthers so the narrator is never interrupted.
 *
 * Strategy: attempt play() immediately on creation (works on most devices),
 * then also hook into playbackStatusUpdate for devices that require
 * the audio to finish loading before play() is accepted. A 3-second
 * fallback timer covers rare cases where neither fires.
 */
import { Platform } from "react-native";
import { createAudioPlayer, AudioModule } from "expo-audio";

const BG_MUSIC_URL =
  "https://ptkncbdsrnzkmuagygom.supabase.co/storage/v1/object/public/game-audio/bg-music.mp3";

const VOLUME = 0.35;

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

    // Set audio mode FIRST — mixWithOthers lets music + narrator co-exist
    await AudioModule.setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "mixWithOthers",
    }).catch(() => {});

    const player = createAudioPlayer({ uri: BG_MUSIC_URL });
    _bgPlayer = player;

    // Apply volume + loop immediately (some devices accept these before loading)
    try { player.volume = VOLUME; } catch { }
    try { (player as any).loop = true; } catch { }

    // ── Attempt 1: play immediately right after creation ──────────────────
    // Works on most Android/iOS devices where createAudioPlayer auto-prepares.
    const tryPlay = () => {
      if (!_active || _bgPlayer !== player || _hasStarted) return;
      _hasStarted = true;
      try { player.volume = VOLUME; } catch { }
      try { player.play(); } catch { }
    };

    tryPlay();

    // ── Attempt 2: listen for isLoaded (devices that need buffering time) ─
    player.addListener("playbackStatusUpdate", (status: any) => {
      if (!_active || _bgPlayer !== player) return;

      // Play as soon as loaded if immediate attempt didn't work
      if (status.isLoaded && !_hasStarted) {
        tryPlay();
      }

      // Manual loop: restart when track ends
      if (_hasStarted && (status.didJustFinish || status.playbackState === "ended")) {
        try { player.seekTo(0); player.play(); } catch { }
      }
    });

    // ── Attempt 3: hard fallback after 3 s (covers edge cases) ──────────
    _fallbackTimer = setTimeout(() => {
      _fallbackTimer = null;
      if (!_hasStarted) tryPlay();
    }, 3000);

  } catch {
    // Background music is optional — never crash the story screen
  }
}
