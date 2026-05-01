import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProgressBar } from "@/components/ProgressBar";
import { curriculum, lessonTitle, unitTitle } from "@/constants/curriculum";
import { useApp } from "@/contexts/AppContext";

const UNIT_COLORS: [string, string][] = [
  ["#FF8A4C", "#FF4D00"],
  ["#FF6FB5", "#C2185B"],
  ["#7C3AED", "#4338CA"],
  ["#00B4D8", "#0077B6"],
  ["#10B981", "#065F46"],
  ["#F59E0B", "#D97706"],
  ["#EF4444", "#B91C1C"],
  ["#8B5CF6", "#6D28D9"],
];

function LessonBubble({ lesson, isDone, onPress, indent, unitColor }: {
  lesson: any; isDone: boolean; onPress: () => void; indent: number; unitColor: [string, string];
}) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }], opacity, marginLeft: indent }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <View style={{
          borderRadius: 20,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          overflow: "hidden",
          borderWidth: isDone ? 0 : 2,
          borderColor: isDone ? "transparent" : "rgba(255,255,255,0.15)",
          backgroundColor: isDone ? undefined : "rgba(255,255,255,0.08)",
          shadowColor: "#000",
          shadowOpacity: isDone ? 0.3 : 0.1,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: isDone ? 4 : 2,
        }}>
          {isDone && (
            <LinearGradient
              colors={unitColor}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            />
          )}
          <View style={{
            width: 52, height: 52, borderRadius: 26,
            backgroundColor: isDone ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.12)",
            alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ fontSize: 28 }}>{lesson.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "800", fontSize: 16, color: "#FFF" }}>
              {lessonTitle(lesson)}
            </Text>
            <Text style={{ color: isDone ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>
              {lesson.words.length} words
            </Text>
          </View>
          <View style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: isDone ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
            alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ fontSize: 18 }}>{isDone ? "⭐" : "▶️"}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function AdventureMap() {
  const router = useRouter();
  const { language } = useLocalSearchParams<{ language: string }>();
  const { progress } = useApp();

  const curr = curriculum.english;

  const grouped = useMemo(() => {
    const map = new Map<string, typeof curr>();
    curr.forEach((l) => {
      const arr = map.get(l.unit) ?? [];
      arr.push(l);
      map.set(l.unit, arr);
    });
    return Array.from(map.values());
  }, [curr]);

  const completed = curr.filter((l) => progress.lessonsCompleted.includes(l.id)).length;

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#1A0533", "#0D2D6B", "#0A4A7A"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                width: 42, height: 42, borderRadius: 21,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center", justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </Pressable>
            <Text style={{ fontWeight: "900", fontSize: 24, color: "#FFF", flex: 1 }}>
              🇬🇧 English Adventure
            </Text>
          </View>

          {/* Progress card */}
          <View style={{
            backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 20, padding: 16,
            borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
          }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 15 }}>
                🏆 Your Progress
              </Text>
              <Text style={{ color: "#FDE68A", fontWeight: "900", fontSize: 15 }}>
                {completed}/{curr.length}
              </Text>
            </View>
            <ProgressBar value={completed / curr.length} />
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 6 }}>
              {Math.round((completed / curr.length) * 100)}% complete · {curr.length - completed} lessons left
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {grouped.map((unit, i) => {
            const color = UNIT_COLORS[i % UNIT_COLORS.length]!;
            return (
              <View key={i} style={{ gap: 8 }}>
                {/* Unit header */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: i > 0 ? 6 : 0 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, overflow: "hidden" }}>
                    <LinearGradient colors={color} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 13 }}>{i + 1}</Text>
                    </LinearGradient>
                  </View>
                  <Text style={{ fontWeight: "900", fontSize: 16, color: "#FFF" }}>
                    {unitTitle(unit[0]!)}
                  </Text>
                </View>

                {/* Lessons */}
                {unit.map((lesson, idx) => {
                  const isDone = progress.lessonsCompleted.includes(lesson.id);
                  const indent = idx % 2 === 0 ? 0 : Math.min(60, 30 + (idx % 3) * 15);
                  return (
                    <LessonBubble
                      key={lesson.id}
                      lesson={lesson}
                      isDone={isDone}
                      onPress={() => router.push(`/learn/lesson/${lesson.id}` as any)}
                      indent={indent}
                      unitColor={color}
                    />
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
