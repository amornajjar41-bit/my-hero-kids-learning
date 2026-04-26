/**
 * Sound effects library using Web Audio API (web) or Haptics (native).
 * Zero API calls — all sounds are synthesized instantly in-browser.
 */
import { Platform } from "react-native";

export type ChimeType =
  | "tap"       // soft pop — navigation buttons
  | "pop"       // same as tap (alias)
  | "success"   // ascending chime — correct answers
  | "unlock"    // 4-note fanfare — achievements/unlocks
  | "sparkle"   // sparkle glitter — earning badges/stars
  | "whoosh"    // sweep — page transitions
  | "bell"      // clear bell — completing a lesson or game
  | "wrong"     // gentle thud — wrong answer (non-punishing)
  | "celebration"; // full fanfare — game complete

type Note = { freq: number; delay: number; dur: number; type?: OscillatorType; gain?: number };

const sequences: Record<ChimeType, Note[]> = {
  tap: [
    { freq: 880, delay: 0, dur: 0.1, type: "sine", gain: 0.12 },
  ],
  pop: [
    { freq: 880, delay: 0, dur: 0.1, type: "sine", gain: 0.12 },
  ],
  success: [
    { freq: 523.25, delay: 0,    dur: 0.14, type: "sine", gain: 0.13 }, // C5
    { freq: 659.25, delay: 0.10, dur: 0.14, type: "sine", gain: 0.13 }, // E5
    { freq: 783.99, delay: 0.20, dur: 0.22, type: "sine", gain: 0.14 }, // G5
  ],
  unlock: [
    { freq: 392.00, delay: 0,    dur: 0.12, type: "sine", gain: 0.12 }, // G4
    { freq: 523.25, delay: 0.10, dur: 0.12, type: "sine", gain: 0.12 }, // C5
    { freq: 659.25, delay: 0.20, dur: 0.12, type: "sine", gain: 0.12 }, // E5
    { freq: 783.99, delay: 0.30, dur: 0.28, type: "sine", gain: 0.14 }, // G5
  ],
  sparkle: [
    { freq: 1046.5, delay: 0,    dur: 0.08, type: "sine", gain: 0.11 },
    { freq: 1318.5, delay: 0.06, dur: 0.08, type: "sine", gain: 0.11 },
    { freq: 1567.9, delay: 0.12, dur: 0.08, type: "sine", gain: 0.10 },
    { freq: 2093.0, delay: 0.18, dur: 0.15, type: "sine", gain: 0.09 },
    { freq: 1567.9, delay: 0.24, dur: 0.08, type: "sine", gain: 0.08 },
    { freq: 1318.5, delay: 0.30, dur: 0.08, type: "sine", gain: 0.07 },
  ],
  whoosh: [
    { freq: 200, delay: 0,    dur: 0.06, type: "sawtooth", gain: 0.04 },
    { freq: 400, delay: 0.04, dur: 0.06, type: "sawtooth", gain: 0.05 },
    { freq: 700, delay: 0.08, dur: 0.06, type: "sawtooth", gain: 0.04 },
    { freq: 1000,delay: 0.12, dur: 0.07, type: "sawtooth", gain: 0.03 },
  ],
  bell: [
    { freq: 1046.5, delay: 0,    dur: 0.5, type: "sine", gain: 0.15 },
    { freq: 1318.5, delay: 0.12, dur: 0.4, type: "sine", gain: 0.10 },
    { freq: 1567.9, delay: 0.24, dur: 0.3, type: "sine", gain: 0.08 },
  ],
  wrong: [
    { freq: 220, delay: 0,    dur: 0.15, type: "sine", gain: 0.08 },
    { freq: 196, delay: 0.12, dur: 0.20, type: "sine", gain: 0.07 },
  ],
  celebration: [
    { freq: 523.25, delay: 0,    dur: 0.12, type: "sine", gain: 0.13 },
    { freq: 659.25, delay: 0.09, dur: 0.12, type: "sine", gain: 0.13 },
    { freq: 783.99, delay: 0.18, dur: 0.12, type: "sine", gain: 0.13 },
    { freq: 1046.5, delay: 0.27, dur: 0.20, type: "sine", gain: 0.14 },
    { freq: 783.99, delay: 0.40, dur: 0.10, type: "sine", gain: 0.11 },
    { freq: 1046.5, delay: 0.50, dur: 0.35, type: "sine", gain: 0.14 },
  ],
};

export function playChime(type: ChimeType = "tap") {
  if (Platform.OS !== "web") {
    import("expo-haptics")
      .then(({ impactAsync, ImpactFeedbackStyle }) =>
        impactAsync(
          type === "success" || type === "sparkle" || type === "bell" || type === "celebration"
            ? ImpactFeedbackStyle.Medium
            : ImpactFeedbackStyle.Light,
        ),
      )
      .catch(() => {});
    return;
  }

  try {
    // @ts-ignore
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = sequences[type] ?? sequences.tap;

    notes.forEach(({ freq, delay, dur, type: oscType = "sine", gain: gainAmt = 0.12 }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = oscType;
      osc.frequency.value = freq;
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(gainAmt, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    });

    const totalDur = Math.max(...notes.map((n) => n.delay + n.dur));
    setTimeout(() => ctx.close().catch(() => {}), (totalDur + 0.5) * 1000);
  } catch {
    // AudioContext not available — ignore
  }
}
