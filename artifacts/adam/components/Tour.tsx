/**
 * 4C – First-time interactive tour.
 * Shows once after registration. Uses expo-speech for local audio (zero API calls).
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
import * as Speech from "expo-speech";

import { AdamCharacter } from "@/components/AdamCharacter";
import { Confetti } from "@/components/Confetti";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { getJSON, setJSON, STORAGE_KEYS } from "@/lib/storage";

const { width } = Dimensions.get("window");

type TourStep = {
  icon: string;
  title_en: string;
  title_ar: string;
  desc_en: string;
  desc_ar: string;
  speech_en: string;
  speech_ar: string;
  bg: string;
};

const STEPS: TourStep[] = [
  {
    icon: "🎒",
    title_en: "Homework Helper",
    title_ar: "مساعد الواجبات",
    desc_en: "I help with ANY homework! Math, English, Arabic — just ask!",
    desc_ar: "بساعدك بأي واجب! رياضيات، إنجليزي، عربي — بس اسأل!",
    speech_en: "I help with any homework! Math, English, Arabic! Just ask me anything!",
    speech_ar: "أنا بساعدك بأي واجب! رياضيات وإنجليزي وعربي! بس اسأل!",
    bg: "#7C3AED",
  },
  {
    icon: "🎮",
    title_en: "Learning Games",
    title_ar: "ألعاب تعليمية",
    desc_en: "Amazing learning games that make school super fun!",
    desc_ar: "ألعاب تعليمية رائعة تخلي المدرسة ممتعة جداً!",
    speech_en: "Amazing learning games that make school super fun!",
    speech_ar: "ألعاب تعليمية رائعة تخلي المدرسة ممتعة جداً!",
    bg: "#DB2777",
  },
  {
    icon: "📚",
    title_en: "Language Lessons",
    title_ar: "دروس اللغة",
    desc_en: "Learn English and Arabic from zero — step by step!",
    desc_ar: "تعلم الإنجليزي والعربي من الصفر — خطوة بخطوة!",
    speech_en: "Learn English and Arabic from zero, step by step!",
    speech_ar: "تعلم الإنجليزي والعربي من الصفر، خطوة بخطوة!",
    bg: "#0891B2",
  },
  {
    icon: "🌙",
    title_en: "Bedtime Stories",
    title_ar: "قصص قبل النوم",
    desc_en: "Cozy bedtime stories in English and Arabic — sweet dreams!",
    desc_ar: "قصص دافئة قبل النوم بالإنجليزي والعربي — أحلام سعيدة!",
    speech_en: "Cozy bedtime stories in English and Arabic. Sweet dreams!",
    speech_ar: "قصص دافئة قبل النوم. أحلام سعيدة!",
    bg: "#7C3AED",
  },
  {
    icon: "🏆",
    title_en: "Rewards & Badges",
    title_ar: "مكافآت وشارات",
    desc_en: "Earn points and badges as you learn — become a true champion!",
    desc_ar: "اكسب نقاط وشارات وأنت تتعلم — كن بطلاً حقيقياً!",
    speech_en: "Earn points and badges as you learn. Become a true champion!",
    speech_ar: "اكسب نقاط وشارات وأنت تتعلم. كن بطلاً حقيقياً!",
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
  const lang = profile?.language ?? "en";
  const hero = profile?.hero ?? "boy";

  const [phase, setPhase] = useState<"welcome" | "steps" | "done">("welcome");
  const [step, setStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Entrance animation
  useEffect(() => {
    if (!visible) return;
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
    ]).start();
  }, [visible]);

  const speakStep = useCallback((s: TourStep) => {
    Speech.stop();
    const text = lang === "ar" ? s.speech_ar : s.speech_en;
    Speech.speak(text, {
      language: lang === "ar" ? "ar" : "en-US",
      rate: 0.9,
      pitch: hero === "girl" ? 1.2 : 0.9,
    });
  }, [lang, hero]);

  const speakWelcome = useCallback(() => {
    Speech.stop();
    const text = lang === "ar"
      ? `مرحباً يا ${profile?.childName ?? "بطل"}! هل تريد جولة سريعة؟`
      : `Welcome to My Hero, ${profile?.childName ?? "hero"}! Want a quick tour?`;
    Speech.speak(text, {
      language: lang === "ar" ? "ar" : "en-US",
      rate: 0.9,
      pitch: hero === "girl" ? 1.2 : 0.9,
    });
  }, [lang, hero, profile]);

  useEffect(() => {
    if (visible && phase === "welcome") {
      const t = setTimeout(speakWelcome, 600);
      return () => clearTimeout(t);
    }
  }, [visible, phase]);

  useEffect(() => {
    if (phase === "steps") {
      speakStep(STEPS[step]);
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
    Speech.stop();
    Speech.speak(
      lang === "ar"
        ? "يلا نبدأ مغامرتك! أنت بطل حقيقي!"
        : "Let's start your adventure! You are a true hero!",
      { language: lang === "ar" ? "ar" : "en-US", rate: 0.9 },
    );
    setShowConfetti(true);
    setPhase("done");
    setTimeout(() => {
      setShowConfetti(false);
      onDone();
    }, 3500);
  };

  const handleSkip = () => {
    Speech.stop();
    onDone();
  };

  if (!visible) return null;

  const current = STEPS[step];

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
              <AdamCharacter hero={hero} size={130} pose="wave" />
              <Text style={{ fontWeight: "900", fontSize: 24, color: c.text, textAlign: "center" }}>
                {lang === "ar"
                  ? `مرحباً يا ${profile?.childName ?? "بطل"}!`
                  : `Welcome to My Hero!`}
              </Text>
              <Text style={{ color: c.mutedForeground, fontSize: 16, textAlign: "center" }}>
                {lang === "ar" ? "تريد جولة سريعة؟" : "Want a quick tour?"}
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
                    {lang === "ar" ? "تخطي" : "Skip"}
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
                    {lang === "ar" ? "يلا نبدأ! 🎉" : "Let's go! 🎉"}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ── Step phase ── */}
          {phase === "steps" && (
            <View style={{ gap: 16 }}>
              {/* Progress dots */}
              <View style={{ flexDirection: "row", gap: 6, justifyContent: "center" }}>
                {STEPS.map((_, i) => (
                  <View key={i} style={{
                    width: i === step ? 24 : 8, height: 8, borderRadius: 4,
                    backgroundColor: i === step ? c.primary : c.muted,
                  }} />
                ))}
              </View>

              {/* Icon card */}
              <View style={{
                backgroundColor: current.bg,
                borderRadius: 28,
                padding: 28,
                alignItems: "center",
                shadowColor: current.bg,
                shadowOpacity: 0.4,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 8 },
                elevation: 10,
              }}>
                <Text style={{ fontSize: 64, marginBottom: 8 }}>{current.icon}</Text>
                <AdamCharacter hero={hero} size={80} pose="wave" />
              </View>

              {/* Title */}
              <Text style={{ fontWeight: "900", fontSize: 24, color: c.text, textAlign: "center" }}>
                {lang === "ar" ? current.title_ar : current.title_en}
              </Text>

              {/* Description */}
              <Text style={{ color: c.mutedForeground, fontSize: 16, textAlign: "center", lineHeight: 24 }}>
                {lang === "ar" ? current.desc_ar : current.desc_en}
              </Text>

              {/* Step counter */}
              <Text style={{ textAlign: "center", color: c.mutedForeground, fontSize: 12 }}>
                {lang === "ar"
                  ? `${step + 1} من ${STEPS.length}`
                  : `${step + 1} of ${STEPS.length}`}
              </Text>

              {/* Buttons */}
              <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
                <Pressable
                  onPress={handleSkip}
                  style={({ pressed }) => ({
                    flex: 1, paddingVertical: 16, borderRadius: 18,
                    backgroundColor: c.muted, alignItems: "center", opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ fontWeight: "700", color: c.mutedForeground, fontSize: 15 }}>
                    {lang === "ar" ? "تخطي" : "Skip"}
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
                    {step < STEPS.length - 1
                      ? (lang === "ar" ? "التالي →" : "Next →")
                      : (lang === "ar" ? "انطلق! 🚀" : "Let's start! 🚀")}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ── Done phase ── */}
          {phase === "done" && (
            <View style={{ alignItems: "center", gap: 16, paddingVertical: 20 }}>
              <Text style={{ fontSize: 64 }}>🚀</Text>
              <AdamCharacter hero={hero} size={120} pose="wave" />
              <Text style={{ fontWeight: "900", fontSize: 26, color: c.text, textAlign: "center" }}>
                {lang === "ar" ? "يلا نبدأ المغامرة! 🚀" : "Let's start your adventure! 🚀"}
              </Text>
              <Text style={{ color: c.mutedForeground, fontSize: 16, textAlign: "center" }}>
                {lang === "ar"
                  ? "أنت جاهز تكون بطلاً حقيقياً!"
                  : "You're ready to become a true hero!"}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

// Hook to manage tour state
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
