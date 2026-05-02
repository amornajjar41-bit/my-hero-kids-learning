/**
 * 4C – First-time interactive tour.
 * Shows once after registration. Uses API TTS (echo/nova) for audio.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";

import { AdamCharacter } from "@/components/AdamCharacter";
import { Confetti } from "@/components/Confetti";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { speak, stop } from "@/lib/audio";
import { getJSON, setJSON, STORAGE_KEYS } from "@/lib/storage";

const { width } = Dimensions.get("window");

type TourStep = {
  icon: string;
  title: string;
  desc: string;
  speech: string;
  bg: string;
};

const STEPS: TourStep[] = [
  {
    icon: "🎒",
    title: "Homework Helper",
    desc: "I help with ANY homework! Maths, science, English — just ask!",
    speech: "I help with any homework! Maths, science, English! Just ask me anything!",
    bg: "#7C3AED",
  },
  {
    icon: "🎮",
    title: "Learning Games",
    desc: "Amazing learning games that make school super fun!",
    speech: "Amazing learning games that make school super fun!",
    bg: "#DB2777",
  },
  {
    icon: "📚",
    title: "English Lessons",
    desc: "Learn English from zero — step by step, lesson by lesson!",
    speech: "Learn English from zero, step by step, lesson by lesson!",
    bg: "#0891B2",
  },
  {
    icon: "🌙",
    title: "Bedtime Stories",
    desc: "Cozy bedtime stories every night — narrated with a warm AI voice!",
    speech: "Cozy bedtime stories every night. Sweet dreams!",
    bg: "#7C3AED",
  },
  {
    icon: "🏆",
    title: "Rewards & Badges",
    desc: "Earn points and badges as you learn — become a true champion!",
    speech: "Earn points and badges as you learn. Become a true champion!",
    bg: "#D97706",
  },
];

type Props = {
  visible: boolean;
  onDone: () => void;
};

export function Tour({ visible, onDone }: Props) {
  const c = useColors();
  const { profile } = useApp();
  const hero = profile?.hero ?? "boy";
  const voice = hero === "girl" ? "nova" : "echo";

  const [phase, setPhase] = useState<"welcome" | "steps" | "done">("welcome");
  const [step, setStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
    ]).start();
  }, [visible]);

  const speakStep = useCallback((s: TourStep) => {
    stop();
    speak(s.speech, voice).catch(() => {});
  }, [voice]);

  const speakWelcome = useCallback(() => {
    stop();
    speak(`Welcome to My Hero, ${profile?.childName ?? "hero"}! Want a quick tour?`, voice).catch(() => {});
  }, [voice, profile]);

  useEffect(() => {
    if (visible && phase === "welcome") {
      const t = setTimeout(speakWelcome, 600);
      return () => clearTimeout(t);
    }
  }, [visible, phase]);

  useEffect(() => {
    if (phase === "steps") {
      speakStep(STEPS[step]!);
    }
  }, [phase, step]);

  const handleStart = () => setPhase("steps");

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    stop();
    speak("Let's start your adventure! You are a true hero!", voice).catch(() => {});
    setShowConfetti(true);
    setPhase("done");
    setTimeout(() => {
      setShowConfetti(false);
      onDone();
    }, 3500);
  };

  const handleSkip = () => {
    stop();
    onDone();
  };

  if (!visible) return null;

  const current = STEPS[step]!;

  return (
    <Modal transparent animationType="none" visible={visible} statusBarTranslucent>
      {showConfetti && <Confetti count={100} />}

      <Animated.View style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.75)",
        justifyContent: "flex-end",
        transform: [
          { translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) },
        ],
      }}>
        <View style={{
          backgroundColor: c.background,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          padding: 28,
          paddingBottom: 44,
          minHeight: "75%",
        }}>

          {/* ── Welcome phase ── */}
          {phase === "welcome" && (
            <View style={{ alignItems: "center", gap: 16 }}>
              <Text style={{ fontSize: 36 }}>👋</Text>
              <View style={{ flexDirection: "row", justifyContent: "center", gap: 12 }}>
                <AdamCharacter hero="boy" size={105} pose="happy" bobbing />
                <AdamCharacter hero="girl" size={105} pose="happy" bobbing />
              </View>
              <Text style={{ fontWeight: "900", fontSize: 24, color: c.text, textAlign: "center" }}>
                Welcome to My Hero!
              </Text>
              <Text style={{ color: c.mutedForeground, fontSize: 16, textAlign: "center" }}>
                Want a quick tour?
              </Text>
              <View style={{ flexDirection: "row", gap: 12, width: "100%", marginTop: 8 }}>
                <Pressable
                  onPress={handleSkip}
                  style={({ pressed }) => ({
                    flex: 1, paddingVertical: 16, borderRadius: 18,
                    backgroundColor: c.muted, alignItems: "center", opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ fontWeight: "700", color: c.mutedForeground, fontSize: 16 }}>
                    Skip
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleStart}
                  style={({ pressed }) => ({
                    flex: 2, paddingVertical: 16, borderRadius: 18,
                    backgroundColor: c.primary, alignItems: "center", opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ fontWeight: "800", color: "#FFF", fontSize: 16 }}>
                    Let's go! 🎉
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ── Step phase ── */}
          {phase === "steps" && (
            <View style={{ gap: 16 }}>
              <View style={{ flexDirection: "row", gap: 6, justifyContent: "center" }}>
                {STEPS.map((_, i) => (
                  <View key={i} style={{
                    width: i === step ? 24 : 8, height: 8, borderRadius: 4,
                    backgroundColor: i === step ? c.primary : c.muted,
                  }} />
                ))}
              </View>

              <View style={{
                backgroundColor: current.bg, borderRadius: 28, padding: 28, alignItems: "center",
                shadowColor: current.bg, shadowOpacity: 0.4, shadowRadius: 20,
                shadowOffset: { width: 0, height: 8 }, elevation: 10,
              }}>
                <Text style={{ fontSize: 64, marginBottom: 8 }}>{current.icon}</Text>
                <AdamCharacter hero={hero} size={80} pose="excited" />
              </View>

              <Text style={{ fontWeight: "900", fontSize: 24, color: c.text, textAlign: "center" }}>
                {current.title}
              </Text>

              <Text style={{ color: c.mutedForeground, fontSize: 16, textAlign: "center", lineHeight: 24 }}>
                {current.desc}
              </Text>

              <Text style={{ textAlign: "center", color: c.mutedForeground, fontSize: 12 }}>
                {step + 1} of {STEPS.length}
              </Text>

              <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
                <Pressable
                  onPress={handleSkip}
                  style={({ pressed }) => ({
                    flex: 1, paddingVertical: 16, borderRadius: 18,
                    backgroundColor: c.muted, alignItems: "center", opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ fontWeight: "700", color: c.mutedForeground, fontSize: 15 }}>
                    Skip
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleNext}
                  style={({ pressed }) => ({
                    flex: 2, paddingVertical: 16, borderRadius: 18,
                    backgroundColor: c.primary, alignItems: "center", opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ fontWeight: "800", color: "#FFF", fontSize: 15 }}>
                    {step < STEPS.length - 1 ? "Next →" : "Let's start! 🚀"}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ── Done phase ── */}
          {phase === "done" && (
            <View style={{ alignItems: "center", gap: 16, paddingVertical: 20 }}>
              <Text style={{ fontSize: 64 }}>🚀</Text>
              <View style={{ flexDirection: "row", justifyContent: "center", gap: 12 }}>
                <AdamCharacter hero="boy" size={95} pose="excited" bobbing />
                <AdamCharacter hero="girl" size={95} pose="excited" bobbing />
              </View>
              <Text style={{ fontWeight: "900", fontSize: 26, color: c.text, textAlign: "center" }}>
                Let's start your adventure! 🚀
              </Text>
              <Text style={{ color: c.mutedForeground, fontSize: 16, textAlign: "center" }}>
                You're ready to become a true hero!
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

export function useTour() {
  const [showTour, setShowTour] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    (async () => {
      const done = await getJSON<boolean>(STORAGE_KEYS.tourDone);
      if (!done) setShowTour(true);
      setChecked(true);
    })();
  }, []);

  const completeTour = useCallback(async () => {
    await setJSON(STORAGE_KEYS.tourDone, true);
    setShowTour(false);
  }, []);

  return { showTour: checked && showTour, completeTour };
}
