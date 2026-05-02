import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Confetti } from "@/components/Confetti";
import { useApp } from "@/contexts/AppContext";
import { playChime } from "@/lib/chime";
import { speak, stopAll } from "@/lib/audio";
import { techLessons, type TechSlide } from "@/constants/techCurriculum";
import { preloadTechLesson, techSlidePath, playPreloaded } from "@/lib/lessonAudio";

const { width: SW, height: SH } = Dimensions.get("window");

// ─── Character speaking pulse ──────────────────────────────────────────────
function SpeakRing({ speaking }: { speaking: boolean }) {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (speaking) {
      Animated.loop(
        Animated.stagger(300, [
          Animated.sequence([
            Animated.timing(ring1, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.timing(ring1, { toValue: 0, duration: 700, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(ring2, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.timing(ring2, { toValue: 0, duration: 700, useNativeDriver: true }),
          ]),
        ])
      ).start();
    } else {
      ring1.setValue(0);
      ring2.setValue(0);
    }
    return () => {
      ring1.stopAnimation();
      ring2.stopAnimation();
    };
  }, [speaking, ring1, ring2]);

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 100, height: 100,
          borderRadius: 50,
          borderWidth: 2,
          borderColor: "rgba(96,165,250,0.6)",
          opacity: ring1,
          transform: [{ scale: ring1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
        }}
      />
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 100, height: 100,
          borderRadius: 50,
          borderWidth: 2,
          borderColor: "rgba(167,139,250,0.4)",
          opacity: ring2,
          transform: [{ scale: ring2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) }],
        }}
      />
    </>
  );
}

// ─── Slide renderers ───────────────────────────────────────────────────────
function HookSlide({ slide }: { slide: Extract<TechSlide, { kind: "hook" }> }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const visualScale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.spring(visualScale, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
    ]).start();
  }, [fadeAnim, slideUp, visualScale]);

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideUp }], alignItems: "center", padding: 24, width: "100%" }}
    >
      <Animated.Text
        style={{ fontSize: 80, marginBottom: 20, transform: [{ scale: visualScale }] }}
      >
        {slide.visual}
      </Animated.Text>
      <Text style={{ color: "#FFF", fontSize: 24, fontWeight: "900", textAlign: "center", marginBottom: 16, lineHeight: 32, width: "100%" }}>
        {slide.title}
      </Text>
      <View style={{
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        width: "100%",
      }}>
        <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 16, textAlign: "center", lineHeight: 26 }}>
          {slide.body}
        </Text>
      </View>
    </Animated.View>
  );
}

function StorySlide({ slide }: { slide: Extract<TechSlide, { kind: "story" }> }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideRight = useRef(new Animated.Value(-30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideRight, { toValue: 0, useNativeDriver: true, tension: 60, friction: 9 }),
    ]).start();
  }, [fadeAnim, slideRight]);

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateX: slideRight }], padding: 24, width: "100%" }}
    >
      {/* Visual emoji cluster */}
      <View style={{
        alignItems: "center",
        marginBottom: 20,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 24,
        paddingVertical: 20,
        width: "100%",
      }}>
        <Text style={{ fontSize: 56, letterSpacing: 8 }}>{slide.visual}</Text>
      </View>

      {/* Heading */}
      <Text style={{
        color: "#60A5FA",
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 1.5,
        marginBottom: 8,
        textTransform: "uppercase",
        width: "100%",
      }}>
        {slide.heading}
      </Text>

      {/* Body */}
      <View style={{
        backgroundColor: "rgba(255,255,255,0.07)",
        borderRadius: 20,
        padding: 20,
        borderLeftWidth: 4,
        borderLeftColor: "#60A5FA",
        width: "100%",
      }}>
        <Text style={{ color: "#E2E8F0", fontSize: 16, lineHeight: 28 }}>
          {slide.body}
        </Text>
      </View>
    </Animated.View>
  );
}

function FactSlide({ slide }: { slide: Extract<TechSlide, { kind: "fact" }> }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.96, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim, pulse]);

  return (
    <Animated.View style={{ opacity: fadeAnim, padding: 24 }}>
      {/* Visual */}
      <Animated.View style={{
        alignItems: "center",
        marginBottom: 20,
        transform: [{ scale: pulse }],
      }}>
        <Text style={{ fontSize: 64, letterSpacing: 6 }}>{slide.visual}</Text>
      </Animated.View>

      {/* Fact card */}
      <LinearGradient
        colors={["#F59E0B20", "#F97316" + "20"]}
        style={{
          borderRadius: 24,
          padding: 4,
        }}
      >
        <View style={{
          backgroundColor: "rgba(15,10,30,0.9)",
          borderRadius: 20,
          padding: 20,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Text style={{ fontSize: 20 }}>💥</Text>
            <Text style={{ color: "#FCD34D", fontSize: 13, fontWeight: "800", letterSpacing: 1 }}>
              {slide.label.toUpperCase()}
            </Text>
          </View>
          <Text style={{ color: "#E2E8F0", fontSize: 17, lineHeight: 28, fontWeight: "600" }}>
            {slide.fact}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function QuizSlide({
  slide,
  onAnswer,
}: {
  slide: Extract<TechSlide, { kind: "quiz" }>;
  onAnswer: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    setSelected(null);
    setRevealed(false);
  }, [slide.question, fadeAnim]);

  const handleAnswer = useCallback(
    (idx: number) => {
      if (revealed) return;
      setSelected(idx);
      setRevealed(true);
      const correct = idx === slide.correctIndex;
      playChime(correct ? "success" : "wrong");
      setTimeout(() => onAnswer(correct), 1800);
    },
    [revealed, slide.correctIndex, onAnswer]
  );

  return (
    <Animated.View style={{ opacity: fadeAnim, padding: 24, width: "100%" }}>
      {/* Question */}
      <View style={{
        backgroundColor: "rgba(255,255,255,0.07)",
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        width: "100%",
      }}>
        <Text style={{ fontSize: 28, marginBottom: 12 }}>🤔</Text>
        <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "800", textAlign: "center", lineHeight: 28, width: "100%" }}>
          {slide.question}
        </Text>
      </View>

      {/* Options */}
      <View style={{ gap: 10 }}>
        {slide.options.map((opt, idx) => {
          let bg = "rgba(255,255,255,0.07)";
          let border = "rgba(255,255,255,0.12)";
          let textColor = "#E2E8F0";

          if (revealed) {
            if (idx === slide.correctIndex) {
              bg = "rgba(16,185,129,0.25)";
              border = "#10B981";
              textColor = "#6EE7B7";
            } else if (idx === selected && idx !== slide.correctIndex) {
              bg = "rgba(239,68,68,0.25)";
              border = "#EF4444";
              textColor = "#FCA5A5";
            }
          } else if (selected === idx) {
            bg = "rgba(96,165,250,0.2)";
            border = "#60A5FA";
          }

          return (
            <Pressable
              key={idx}
              onPress={() => handleAnswer(idx)}
              style={({ pressed }) => ({
                backgroundColor: bg,
                borderRadius: 16,
                paddingHorizontal: 18,
                paddingVertical: 16,
                borderWidth: 1.5,
                borderColor: border,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Text style={{ color: textColor, fontSize: 15, flex: 1, lineHeight: 22 }}>
                  {opt}
                </Text>
                {revealed && idx === slide.correctIndex && (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                )}
                {revealed && idx === selected && idx !== slide.correctIndex && (
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Explanation */}
      {revealed && (
        <Animated.View style={{
          marginTop: 16,
          backgroundColor: "rgba(96,165,250,0.12)",
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: "rgba(96,165,250,0.3)",
        }}>
          <Text style={{ color: "#93C5FD", fontSize: 14, lineHeight: 22 }}>
            💡 {slide.explanation}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

function CelebSlide({ message }: { message: string }) {
  const scale = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [scale, fadeAnim]);

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ scale }], padding: 24, alignItems: "center" }}
    >
      <Text style={{ fontSize: 80, marginBottom: 20 }}>🏆</Text>
      <Text style={{ color: "#FCD34D", fontSize: 28, fontWeight: "900", textAlign: "center", marginBottom: 16 }}>
        Lesson Complete!
      </Text>
      <View style={{
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
      }}>
        <Text style={{ color: "#E2E8F0", fontSize: 17, textAlign: "center", lineHeight: 28 }}>
          {message}
        </Text>
      </View>
      <Text style={{ fontSize: 40, marginTop: 20, letterSpacing: 10 }}>⭐🌟✨</Text>
    </Animated.View>
  );
}

// ─── Main Player ───────────────────────────────────────────────────────────
export default function TechLessonPlayer() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, progress, saveProgress, addPoints } = useApp();

  const lesson = useMemo(
    () => techLessons.find((l) => l.id === id) ?? techLessons[0]!,
    [id]
  );

  const isGirl = profile?.hero === "girl";
  const voice = isGirl ? "nova" : "echo";
  const charImg = isGirl
    ? require("../../assets/images/lulu-girl.png")
    : require("../../assets/images/adam-boy.png");

  const [slideIdx, setSlideIdx] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [awaitingNext, setAwaitingNext] = useState(false);

  const charBob = useRef(new Animated.Value(0)).current;
  const slideTranslate = useRef(new Animated.Value(0)).current;

  // Character bobbing animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(charBob, { toValue: -8, duration: 1600, useNativeDriver: true }),
        Animated.timing(charBob, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, [charBob]);

  const slide = lesson.slides[slideIdx];
  const totalSlides = lesson.slides.length;
  const isLastSlide = slideIdx === totalSlides - 1;

  // Preload all slide audio for this lesson on mount
  useEffect(() => {
    preloadTechLesson(lesson.id, totalSlides);
  }, [lesson.id, totalSlides]);

  // Speak text for current slide — always uses the user's selected voice (echo/nova)
  // so Adam users always hear Adam and Sara users always hear Sara.
  const speakSlide = useCallback(
    (s: TechSlide, _idx: number) => {
      if (!s) return;
      let text = "";
      if (s.kind === "hook") text = `${s.title}. ${s.body}`;
      else if (s.kind === "story") text = `${s.heading}. ${s.body}`;
      else if (s.kind === "fact") text = `${s.label}! ${s.fact}`;
      else if (s.kind === "quiz") text = s.question;
      else if (s.kind === "celebrate") text = s.message;

      // Cap at ~100 words
      const words = text.split(" ");
      const capped = words.length > 100 ? words.slice(0, 100).join(" ") + "..." : text;

      setSpeaking(true);
      speak(capped, voice, 1.0).finally(() => setSpeaking(false));
    },
    [voice]
  );

  // Animate slide transition and auto-speak
  useEffect(() => {
    stopAll();
    setSpeaking(false);
    setAwaitingNext(false);

    // Slide in from right
    slideTranslate.setValue(60);
    Animated.spring(slideTranslate, {
      toValue: 0, useNativeDriver: true, tension: 70, friction: 10,
    }).start();

    if (!slide) return;
    if (slide.kind === "celebrate") {
      setShowConfetti(true);
      playChime("celebration");
    }

    const t = setTimeout(() => speakSlide(slide, slideIdx), 400);
    return () => {
      clearTimeout(t);
      stopAll();
    };
  }, [slideIdx]);

  const goNext = useCallback(() => {
    if (isLastSlide) {
      // Mark completed
      saveProgress((prev) => ({
        ...prev,
        techLessons: prev.techLessons?.includes(lesson.id)
          ? prev.techLessons
          : [...(prev.techLessons ?? []), lesson.id],
      }));
      addPoints(50);
      router.back();
    } else {
      playChime("tap");
      setSlideIdx((i) => i + 1);
    }
  }, [isLastSlide, lesson.id, router, saveProgress, addPoints]);

  const goPrev = useCallback(() => {
    if (slideIdx > 0) {
      playChime("tap");
      setSlideIdx((i) => i - 1);
    }
  }, [slideIdx]);

  const handleQuizAnswer = useCallback(
    (_correct: boolean) => {
      setAwaitingNext(true);
    },
    []
  );

  if (!slide) return null;

  const progressPct = ((slideIdx + 1) / totalSlides) * 100;

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#050B1A", "#0A1628", "#0D1F40"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {/* Lesson color tint overlay from lesson gradient */}
      <View
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 300,
          opacity: 0.06,
          backgroundColor: lesson.colors[0],
        }}
      />

      {showConfetti && <Confetti />}

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* Top bar */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable
            onPress={() => { stopAll(); router.back(); }}
            style={({ pressed }) => ({
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: "rgba(255,255,255,0.08)",
              alignItems: "center", justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="close" size={18} color="#FFF" />
          </Pressable>

          {/* Progress bar */}
          <View style={{ flex: 1, height: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
            <Animated.View
              style={{
                height: "100%",
                width: `${progressPct}%`,
                backgroundColor: lesson.colors[0],
                borderRadius: 3,
              }}
            />
          </View>

          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600", minWidth: 40, textAlign: "right" }}>
            {slideIdx + 1}/{totalSlides}
          </Text>
        </View>

        {/* Character + speak button */}
        <View style={{ alignItems: "center", paddingTop: 16 }}>
          <Animated.View style={{ transform: [{ translateY: charBob }], position: "relative", alignItems: "center", justifyContent: "center" }}>
            <SpeakRing speaking={speaking} />
            <Pressable
              onPress={() => speakSlide(slide, slideIdx)}
              style={{
                width: 90, height: 90, borderRadius: 45,
                backgroundColor: "rgba(255,255,255,0.06)",
                alignItems: "center", justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <Image
                source={charImg}
                style={{ width: 90, height: 90 }}
                contentFit="contain"
              />
            </Pressable>
          </Animated.View>

          {/* Lesson title pill */}
          <View style={{
            marginTop: 10,
            backgroundColor: lesson.colors[0] + "30",
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 5,
            borderWidth: 1,
            borderColor: lesson.colors[0] + "60",
          }}>
            <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700" }}>
              {lesson.emoji} {lesson.title}
            </Text>
          </View>
        </View>

        {/* Slide content — overflow:hidden clips the slide-in animation */}
        <View style={{ flex: 1, overflow: "hidden" }}>
          <Animated.View style={{ flex: 1, transform: [{ translateX: slideTranslate }] }}>
            <ScrollView
              contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
            >
              {slide.kind === "hook" && <HookSlide slide={slide} />}
              {slide.kind === "story" && <StorySlide slide={slide} />}
              {slide.kind === "fact" && <FactSlide slide={slide} />}
              {slide.kind === "quiz" && (
                <QuizSlide slide={slide} onAnswer={handleQuizAnswer} />
              )}
              {slide.kind === "celebrate" && <CelebSlide message={slide.message} />}
            </ScrollView>
          </Animated.View>
        </View>

        {/* Navigation bar */}
        <View style={{
          flexDirection: "row",
          paddingHorizontal: 24,
          paddingBottom: 20,
          paddingTop: 12,
          gap: 12,
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.06)",
        }}>
          {/* Back */}
          {slideIdx > 0 && (
            <Pressable
              onPress={goPrev}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.07)",
                borderRadius: 20,
                paddingVertical: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.7)" />
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, fontWeight: "700" }}>Back</Text>
            </Pressable>
          )}

          {/* Next / Finish — hidden for quiz until answered */}
          {(slide.kind !== "quiz" || awaitingNext) && (
            <Pressable
              onPress={goNext}
              style={({ pressed }) => ({
                flex: 2,
                borderRadius: 20,
                overflow: "hidden",
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <LinearGradient
                colors={lesson.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 16,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Text style={{ color: "#FFF", fontSize: 17, fontWeight: "900" }}>
                  {isLastSlide ? "Finish 🏆" : "Next →"}
                </Text>
              </LinearGradient>
            </Pressable>
          )}

          {/* Quiz waiting hint */}
          {slide.kind === "quiz" && !awaitingNext && (
            <View style={{
              flex: 2,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.04)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
              borderStyle: "dashed",
              paddingVertical: 16,
              alignItems: "center",
            }}>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
                Choose an answer above ☝️
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
