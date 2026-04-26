/**
 * Plays a pleasant two-note chime using Web Audio API (no API call, instant).
 * Falls back to Haptics on native where AudioContext is unavailable.
 */
import { Platform } from "react-native";

export function playChime(type: "tap" | "success" | "unlock" = "tap") {
  if (Platform.OS !== "web") {
    // Native: haptic pulse
    import("expo-haptics")
      .then(({ impactAsync, ImpactFeedbackStyle }) =>
        impactAsync(ImpactFeedbackStyle.Light),
      )
      .catch(() => {});
    return;
  }

  try {
    // @ts-ignore
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const sequences: Record<string, { freq: number; delay: number; dur: number }[]> = {
      tap: [
        { freq: 523.25, delay: 0,    dur: 0.18 }, // C5
        { freq: 659.25, delay: 0.08, dur: 0.22 }, // E5
      ],
      success: [
        { freq: 523.25, delay: 0,    dur: 0.15 },
        { freq: 659.25, delay: 0.1,  dur: 0.15 },
        { freq: 783.99, delay: 0.2,  dur: 0.28 }, // G5
      ],
      unlock: [
        { freq: 392.00, delay: 0,    dur: 0.12 },
        { freq: 523.25, delay: 0.1,  dur: 0.12 },
        { freq: 659.25, delay: 0.2,  dur: 0.12 },
        { freq: 783.99, delay: 0.3,  dur: 0.25 },
      ],
    };

    (sequences[type] ?? sequences.tap).forEach(({ freq, delay, dur }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.14, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    });

    // Close context after sounds finish
    setTimeout(() => ctx.close().catch(() => {}), 1200);
  } catch {
    // ignore – AudioContext blocked or not supported
  }
}
