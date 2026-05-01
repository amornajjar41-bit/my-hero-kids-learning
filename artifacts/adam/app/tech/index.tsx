import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useEffect } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useApp } from "@/contexts/AppContext";
import { playChime } from "@/lib/chime";
import { techLessons, type TechLesson } from "@/constants/techCurriculum";

const { width: SW } = Dimensions.get("window");

// ─── Floating Particle ─────────────────────────────────────────────────────
function Particle({ style }: { style: object }) {
  const a = useRef(new Animated.Value(Math.random() * 0.6 + 0.2)).current;
  const y = useRef(new Animated.Value(0)).current;
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const dur = 2000 + Math.random() * 3000;
    Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 0.9, duration: dur, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0.1, duration: dur, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: -10, duration: dur * 0.9, useNativeDriver: true }),
        Animated.timing(y, { toValue: 4, duration: dur * 1.1, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(x, { toValue: -5, duration: dur * 1.2, useNativeDriver: true }),
        Animated.timing(x, { toValue: 5, duration: dur * 0.8, useNativeDriver: true }),
      ])
    ).start();
  }, [a, y, x]);
  return (
    <Animated.Text
      style={[style, { opacity: a, transform: [{ translateY: y }, { translateX: x }] }]}
    >
      ✦
    </Animated.Text>
  );
}

const PARTICLES = [
  { top: 40, left: 20, fontSize: 10, color: "#60A5FA" },
  { top: 90, right: 30, fontSize: 7, color: "#A78BFA" },
  { top: 160, left: 60, fontSize: 13, color: "#34D399" },
  { top: 240, right: 80, fontSize: 8, color: "#FCD34D" },
  { top: 320, left: 15, fontSize: 9, color: "#F472B6" },
  { top: 420, right: 25, fontSize: 12, color: "#60A5FA" },
  { top: 520, left: 100, fontSize: 7, color: "#A78BFA" },
  { top: 640, right: 50, fontSize: 11, color: "#34D399" },
];

// ─── Lesson Card ───────────────────────────────────────────────────────────
function LessonCard({
  lesson,
  index,
  completedIds,
  onPress,
}: {
  lesson: TechLesson;
  index: number;
  completedIds: string[];
  onPress: () => void;
}) {
  const side = index % 2 === 0 ? "left" : "right";
  const scale = useRef(new Animated.Value(1)).current;
  const float = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const isCompleted = completedIds.includes(lesson.id);

  useEffect(() => {
    const delay = index * 80;
    setTimeout(() => {
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, delay);

    const floatDelay = Math.random() * 1000;
    const dur = 2000 + Math.random() * 1500;
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(float, { toValue: -8, duration: dur, useNativeDriver: true }),
          Animated.timing(float, { toValue: 0, duration: dur, useNativeDriver: true }),
        ])
      ).start();
    }, floatDelay);
  }, [fadeIn, float, index]);

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: fadeIn,
        transform: [{ translateY: float }, { scale }],
        marginBottom: 16,
        alignSelf: side === "left" ? "flex-start" : "flex-end",
        width: SW * 0.78,
      }}
    >
      <Pressable
        onPress={() => { playChime("tap"); onPress(); }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={{ borderRadius: 24, overflow: "hidden" }}
      >
        <LinearGradient
          colors={lesson.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24, padding: 20 }}
        >
          {/* Top row */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={{ fontSize: 42 }}>{lesson.emoji}</Text>
            <View style={{ alignItems: "flex-end", gap: 6 }}>
              {/* Age badge */}
              <View style={{
                backgroundColor: "rgba(0,0,0,0.3)",
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}>
                <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "700" }}>
                  +{lesson.ageMin} years
                </Text>
              </View>
              {/* Completed badge */}
              {isCompleted && (
                <View style={{
                  backgroundColor: "rgba(0,0,0,0.3)",
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}>
                  <Ionicons name="checkmark-circle" size={12} color="#6EE7B7" />
                  <Text style={{ color: "#6EE7B7", fontSize: 11, fontWeight: "700" }}>Done!</Text>
                </View>
              )}
            </View>
          </View>

          {/* Title & tagline */}
          <Text style={{ color: "#FFF", fontSize: 20, fontWeight: "900", marginBottom: 4 }}>
            {lesson.title}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 14, fontStyle: "italic" }}>
            {lesson.tagline}
          </Text>

          {/* Slide count + CTA */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="layers-outline" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                {lesson.slides.length} slides
              </Text>
            </View>
            <View style={{
              backgroundColor: "rgba(255,255,255,0.25)",
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}>
              <Text style={{ color: "#FFF", fontSize: 13, fontWeight: "800" }}>
                {isCompleted ? "Review" : "Start"}
              </Text>
              <Ionicons name="arrow-forward" size={13} color="#FFF" />
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function TechZone() {
  const router = useRouter();
  const { profile, progress } = useApp();

  const completedIds: string[] = (progress as any).techLessons ?? [];
  const ageGroupMin: Record<string, number> = { "4-6": 4, "7-9": 7, "10-12": 10, "13-14": 13 };
  const childAge = ageGroupMin[profile?.ageGroup ?? "4-6"] ?? 4;

  const heroLabel = profile?.hero === "girl" ? "Sara" : "Adam";
  const heroEmoji = profile?.hero === "girl" ? "🦸‍♀️" : "🦸‍♂️";

  const sortedLessons = [...techLessons].sort((a, b) => a.ageMin - b.ageMin);

  return (
    <View style={{ flex: 1 }}>
      {/* Dark gradient background */}
      <LinearGradient
        colors={["#050B1A", "#0A1628", "#0D1F40", "#0A1628"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Glowing orbs */}
      <View style={{ position: "absolute", top: -60, left: -40, width: 250, height: 250, borderRadius: 125, backgroundColor: "#3B82F6", opacity: 0.08 }} />
      <View style={{ position: "absolute", top: 300, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: "#8B5CF6", opacity: 0.07 }} />
      <View style={{ position: "absolute", bottom: 150, left: -30, width: 180, height: 180, borderRadius: 90, backgroundColor: "#06B6D4", opacity: 0.06 }} />
      <View style={{ position: "absolute", bottom: 400, right: 20, width: 120, height: 120, borderRadius: 60, backgroundColor: "#10B981", opacity: 0.05 }} />

      {/* Particles */}
      {PARTICLES.map((p, i) => (
        <Particle key={i} style={{ position: "absolute", ...p }} />
      ))}

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4, flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.08)",
              alignItems: "center", justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </Pressable>
          <View style={{ flex: 1 }} />
          <Text style={{ fontSize: 22 }}>{heroEmoji}</Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero section */}
          <View style={{ alignItems: "center", paddingVertical: 24 }}>
            <View style={{
              backgroundColor: "rgba(59,130,246,0.15)",
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: "rgba(59,130,246,0.3)",
            }}>
              <Text style={{ color: "#60A5FA", fontSize: 13, fontWeight: "700", letterSpacing: 1 }}>
                🤖 TECHNOLOGY & AI
              </Text>
            </View>
            <Text style={{ color: "#FFF", fontSize: 28, fontWeight: "900", textAlign: "center", marginBottom: 8 }}>
              Explore the Future
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, textAlign: "center", lineHeight: 22, maxWidth: 300 }}>
              {heroLabel} will guide you through {techLessons.length} amazing lessons about computers, AI, robots & the future! 🚀
            </Text>

            {/* Progress pill */}
            <View style={{
              marginTop: 16,
              backgroundColor: "rgba(255,255,255,0.06)",
              borderRadius: 30,
              paddingHorizontal: 20,
              paddingVertical: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}>
              <Ionicons name="trophy-outline" size={16} color="#FCD34D" />
              <Text style={{ color: "#FFF", fontSize: 14, fontWeight: "700" }}>
                {completedIds.length} / {techLessons.length} completed
              </Text>
              <View style={{
                width: 80,
                height: 6,
                backgroundColor: "rgba(255,255,255,0.15)",
                borderRadius: 3,
                overflow: "hidden",
              }}>
                <View style={{
                  width: `${(completedIds.length / techLessons.length) * 100}%`,
                  height: "100%",
                  backgroundColor: "#60A5FA",
                  borderRadius: 3,
                }} />
              </View>
            </View>
          </View>

          {/* Lessons */}
          <View style={{ marginTop: 8 }}>
            {sortedLessons.map((lesson, i) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                index={i}
                completedIds={completedIds}
                onPress={() => router.push(`/tech/${lesson.id}` as any)}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
