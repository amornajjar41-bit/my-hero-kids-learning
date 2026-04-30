import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProgressBar } from "@/components/ProgressBar";
import { SoftCard } from "@/components/SoftCard";
import { curriculum, lessonTitle, unitTitle } from "@/constants/curriculum";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";

export default function AdventureMap() {
  const c = useColors();
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

  const completed = curr.filter((l) =>
    progress.lessonsCompleted.includes(l.id),
  ).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: c.card,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="chevron-back" size={20} color={c.text} />
          </Pressable>
          <Text style={{ fontWeight: "800", fontSize: 22, color: c.text, flex: 1 }}>
            🇬🇧 English Adventure
          </Text>
        </View>

        <SoftCard>
          <Text style={{ fontWeight: "700", color: c.text }}>
            Completed {completed} of {curr.length} lessons
          </Text>
          <View style={{ marginTop: 8 }}>
            <ProgressBar value={completed / curr.length} />
          </View>
        </SoftCard>

        {grouped.map((unit, i) => (
          <View key={i} style={{ gap: 10 }}>
            <Text
              style={{
                fontWeight: "800",
                fontSize: 16,
                color: c.mutedForeground,
                marginTop: 8,
              }}
            >
              Unit {i + 1}: {unitTitle(unit[0]!)}
            </Text>
            {unit.map((lesson, idx) => {
              const isDone = progress.lessonsCompleted.includes(lesson.id);
              const indent =
                idx % 2 === 0 ? 0 : Math.min(80, 40 + (idx % 3) * 20);
              return (
                <Pressable
                  key={lesson.id}
                  onPress={() =>
                    router.push(`/learn/lesson/${lesson.id}` as any)
                  }
                  style={({ pressed }) => ({
                    marginLeft: indent,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <View
                    style={{
                      backgroundColor: isDone ? c.green : c.card,
                      borderRadius: c.radius,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 14,
                      shadowColor: "#000",
                      shadowOpacity: 0.06,
                      shadowRadius: 6,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 2,
                    }}
                  >
                    <Text style={{ fontSize: 38 }}>{lesson.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontWeight: "800",
                          fontSize: 16,
                          color: isDone ? "#FFF" : c.text,
                        }}
                      >
                        {lessonTitle(lesson)}
                      </Text>
                      <Text
                        style={{
                          color: isDone ? "#FFF" : c.mutedForeground,
                          opacity: isDone ? 0.85 : 1,
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        {lesson.words.length} words
                      </Text>
                    </View>
                    <Text style={{ fontSize: 24 }}>{isDone ? "⭐" : "▶️"}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
