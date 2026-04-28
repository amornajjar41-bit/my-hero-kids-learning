import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Confetti } from "@/components/Confetti";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ProgressBar } from "@/components/ProgressBar";
import { SoftCard } from "@/components/SoftCard";
import { SpeakButton } from "@/components/SpeakButton";
import { curriculum, lessonTitle } from "@/constants/curriculum";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useLang, useT } from "@/hooks/useT";
import { speak, stopAll } from "@/lib/audio";
import {
  preloadLesson,
  wordPath,
  playPreloaded,
  stopPreloaded,
} from "@/lib/lessonAudio";

type StepType = "hook" | "introduce" | "repeat" | "see" | "challenge" | "celebrate";

export default function LessonPlayer() {
  const c = useColors();
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, progress, saveProgress } = useApp();

  const lesson = useMemo(
    () =>
      curriculum.english.find((l) => l.id === id) ??
      curriculum.arabic.find((l) => l.id === id) ??
      curriculum.english[0],
    [id],
  );

  const isArabicLesson = lesson.id.startsWith("ar-");
  const voice = profile?.hero === "girl" ? "nova" : "echo";
  const lessonLang: "en" | "ar" = isArabicLesson ? "ar" : "en";

  // Build step list
  const steps: { type: StepType; data?: any }[] = useMemo(() => {
    const arr: { type: StepType; data?: any }[] = [{ type: "hook" }];
    lesson.words.forEach((w) => arr.push({ type: "introduce", data: w }));
    arr.push({ type: "see" });
    const shuffled = [...lesson.words].sort(() => Math.random() - 0.5).slice(0, 3);
    shuffled.forEach((correct) => {
      const distractors = lesson.words
        .filter((w) => w.en !== correct.en)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const options = [...distractors, correct].sort(() => Math.random() - 0.5);
      arr.push({ type: "challenge", data: { correct, options } });
    });
    arr.push({ type: "celebrate" });
    return arr;
  }, [lesson]);

  const [stepIdx, setStepIdx] = useState(0);
  const [stars, setStars] = useState(0);
  const [feedback, setFeedback] = useState<"" | "ok" | "no">("");

  // Preload all lesson audio on mount
  useEffect(() => {
    preloadLesson(lesson.id, lesson.words.length, lessonLang);
    return () => {
      stopPreloaded();
      stopAll();
    };
  }, [lesson.id, lesson.words.length, lessonLang]);

  // Auto-play pronunciation when entering an "introduce" step
  const step = steps[stepIdx];
  useEffect(() => {
    if (step?.type === "introduce" && step.data) {
      const wordIdx = lesson.words.findIndex((w) => w.en === step.data.en || w.ar === step.data.ar);
      const realIdx = wordIdx >= 0 ? wordIdx : 0;
      const path = wordPath(lesson.id, realIdx, "pronunciation", lessonLang);
      const fallbackText = isArabicLesson ? step.data.ar : step.data.en;
      playPreloaded(path, () => speak(fallbackText, voice));
    }
  }, [stepIdx]);

  // Auto-play hint when entering a "challenge" step
  useEffect(() => {
    if (step?.type === "challenge" && step.data) {
      const wordIdx = lesson.words.findIndex((w) => w.en === step.data.correct.en);
      const realIdx = wordIdx >= 0 ? wordIdx : 0;
      const path = wordPath(lesson.id, realIdx, "hint", lessonLang);
      const fallbackText = lang === "ar"
        ? `هل يمكنك إيجاد ${step.data.correct.ar}؟`
        : `Can you find ${step.data.correct.en}?`;
      playPreloaded(path, () => speak(fallbackText, voice));
    }
  }, [stepIdx]);

  const step2 = steps[stepIdx];
  const progressVal = stepIdx / (steps.length - 1);

  const onAnswer = (chosenIdx: number, correctIdx: number) => {
    if (chosenIdx === correctIdx) {
      setFeedback("ok");
      setStars((s) => s + 1);
      // Play reveal audio for the correct word
      if (step2?.type === "challenge" && step2.data) {
        const wordIdx = lesson.words.findIndex((w) => w.en === step2.data.correct.en);
        const realIdx = wordIdx >= 0 ? wordIdx : 0;
        const path = wordPath(lesson.id, realIdx, "reveal", lessonLang);
        const fallbackText = lang === "ar" ? "رائع! أحسنت!" : "Excellent! Great job!";
        playPreloaded(path, () => speak(fallbackText, voice));
      }
      setTimeout(() => {
        setFeedback("");
        setStepIdx((i) => i + 1);
      }, 1100);
    } else {
      setFeedback("no");
      setTimeout(() => setFeedback(""), 900);
    }
  };

  const finish = () => {
    saveProgress((p) => {
      const alreadyDone = p.lessonsCompleted.includes(lesson.id);
      const lessonsCompleted = alreadyDone ? p.lessonsCompleted : [...p.lessonsCompleted, lesson.id];
      return {
        ...p,
        lessonsCompleted,
        starsTotal: p.starsTotal + stars,
        wordsLearned: p.wordsLearned + lesson.words.length,
        englishLessons: isArabicLesson || alreadyDone ? p.englishLessons : p.englishLessons + 1,
        arabicLessons: !isArabicLesson || alreadyDone ? p.arabicLessons : p.arabicLessons + 1,
        weekly: p.weekly.map((v, i) => i === new Date().getDay() ? v + 1 : v),
      };
    });
    router.replace(`/learn/${isArabicLesson ? "arabic" : "english"}` as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      <View style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: c.card, alignItems: "center", justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="close" size={20} color={c.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <ProgressBar value={progressVal} />
        </View>
        <Text style={{ fontWeight: "800", color: c.text, fontSize: 14 }}>⭐ {stars}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, gap: 14, flexGrow: 1 }}>
        <Text style={{ fontSize: 12, fontWeight: "700", color: c.mutedForeground, letterSpacing: 1 }}>
          {lessonTitle(lesson, lang).toUpperCase()} · {t("step")} {stepIdx + 1} {t("of")} {steps.length}
        </Text>

        <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(150)} key={stepIdx}>
          {step2?.type === "hook" && (
            <SoftCard color={c.yellow}>
              <Text style={{ fontWeight: "800", fontSize: 13, color: "#5B3700" }}>✨ {t("funFact")}</Text>
              <Text style={{ fontSize: 22, fontWeight: "800", color: "#5B3700", marginTop: 8 }}>
                {lang === "ar" ? lesson.funFactAr : lesson.funFactEn}
              </Text>
              <View style={{ marginTop: 12 }}>
                <SpeakButton text={lang === "ar" ? lesson.funFactAr : lesson.funFactEn} voice={voice} />
              </View>
            </SoftCard>
          )}

          {step2?.type === "introduce" && step2.data && (
            <SoftCard>
              <Text style={{ color: c.mutedForeground, fontWeight: "700", fontSize: 12 }}>{t("repeatAfterMe")}</Text>
              <View style={{ alignItems: "center", paddingVertical: 18, gap: 10 }}>
                <Text style={{ fontSize: 100 }}>{step2.data.emoji}</Text>
                <Text style={{ fontSize: 36, fontWeight: "800", color: c.primary }}>
                  {isArabicLesson ? step2.data.ar : step2.data.en}
                </Text>
                <Text style={{ fontSize: 16, color: c.mutedForeground }}>
                  {isArabicLesson ? step2.data.en : step2.data.ar}
                </Text>
                <SpeakButton
                  text={isArabicLesson ? step2.data.ar : step2.data.en}
                  voice={voice}
                  size={56}
                />
              </View>
            </SoftCard>
          )}

          {step2?.type === "see" && (
            <SoftCard>
              <Text style={{ fontWeight: "800", fontSize: 16, color: c.text }}>
                👀 {lang === "ar" ? "كل الكلمات اللي تعلمناها!" : "All the words we learned!"}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
                {lesson.words.map((w, idx) => (
                  <Pressable
                    key={w.en}
                    onPress={() => {
                      const path = wordPath(lesson.id, idx, "pronunciation", lessonLang);
                      playPreloaded(path, () => speak(isArabicLesson ? w.ar : w.en, voice));
                    }}
                    style={({ pressed }) => ({
                      width: 90, backgroundColor: c.muted, borderRadius: 14,
                      padding: 8, alignItems: "center", opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 36 }}>{w.emoji}</Text>
                    <Text style={{ fontWeight: "700", color: c.text, fontSize: 12, marginTop: 4, textAlign: "center" }}>
                      {isArabicLesson ? w.ar : w.en}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </SoftCard>
          )}

          {step2?.type === "challenge" && step2.data && (
            <SoftCard>
              <Text style={{ color: c.mutedForeground, fontWeight: "700", fontSize: 12 }}>🎯 {t("miniChallenge")}</Text>
              <Text style={{ fontSize: 22, fontWeight: "800", color: c.text, marginTop: 8, textAlign: "center" }}>
                {lang === "ar" ? "وين" : "Find"}{" "}
                <Text style={{ color: c.primary }}>
                  {isArabicLesson ? step2.data.correct.ar : step2.data.correct.en}
                </Text>
                {lang === "ar" ? "؟" : "?"}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 16 }}>
                {step2.data.options.map((opt: any, idx: number) => (
                  <Pressable
                    key={opt.en + idx}
                    onPress={() => onAnswer(idx, step2.data.options.indexOf(step2.data.correct))}
                    style={({ pressed }) => ({
                      width: 110, height: 110, backgroundColor: c.muted,
                      borderRadius: 16, alignItems: "center", justifyContent: "center",
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 56 }}>{opt.emoji}</Text>
                  </Pressable>
                ))}
              </View>
              {feedback === "ok" && (
                <Text style={{ textAlign: "center", color: c.green, fontWeight: "800", marginTop: 14, fontSize: 18 }}>
                  🎉 {t("greatJob")}
                </Text>
              )}
              {feedback === "no" && (
                <Text style={{ textAlign: "center", color: c.destructive, fontWeight: "800", marginTop: 14, fontSize: 16 }}>
                  {t("tryAgain")}
                </Text>
              )}
            </SoftCard>
          )}

          {step2?.type === "celebrate" && (
            <View>
              <Confetti count={70} />
              <SoftCard color={c.primary}>
                <Text style={{ fontSize: 60, textAlign: "center" }}>🎉🏆</Text>
                <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 24, textAlign: "center", marginTop: 6 }}>
                  {t("lessonComplete")}
                </Text>
                <Text style={{ color: "#FFF", opacity: 0.9, fontWeight: "700", textAlign: "center", marginTop: 6 }}>
                  ⭐ {stars} {t("starsEarned")}
                </Text>
              </SoftCard>
            </View>
          )}
        </Animated.View>

        <View style={{ marginTop: "auto", paddingTop: 24 }}>
          {step2?.type === "celebrate" ? (
            <PrimaryButton title={t("done")} fullWidth onPress={finish} />
          ) : step2?.type === "challenge" ? null : (
            <PrimaryButton
              title={t("next")}
              fullWidth
              onPress={() => setStepIdx((i) => Math.min(steps.length - 1, i + 1))}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
