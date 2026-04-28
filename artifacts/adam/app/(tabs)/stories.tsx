import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextStyle,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { STORIES, type Story } from "@/constants/stories";
import { setCurrentStoryId } from "@/lib/storyStore";
import { getJSON, STORAGE_KEYS } from "@/lib/storage";

type Filter = "all" | "young" | "older";

const CARD_BG: Record<string, [string, string]> = {
  "1":  ["#7C3AED", "#4C1D95"],
  "2":  ["#047857", "#064E3B"],
  "3":  ["#1D4ED8", "#1E3A8A"],
  "4":  ["#6D28D9", "#3B0764"],
  "5":  ["#D97706", "#92400E"],
  "6":  ["#059669", "#065F46"],
  "7":  ["#D97706", "#064E3B"],
  "8":  ["#0369A1", "#0C4A6E"],
  "9":  ["#E11D48", "#9F1239"],
  "10": ["#4338CA", "#312E81"],
};

const STORY_DISPLAY: Record<string, { durationMin: number; ageRange: string }> = {
  "1":  { durationMin: 4, ageRange: "6-10" },
  "2":  { durationMin: 3, ageRange: "5-9"  },
  "3":  { durationMin: 3, ageRange: "5-9"  },
  "4":  { durationMin: 4, ageRange: "6-10" },
  "5":  { durationMin: 4, ageRange: "5-10" },
  "6":  { durationMin: 3, ageRange: "5-9"  },
  "7":  { durationMin: 3, ageRange: "4-8"  },
  "8":  { durationMin: 4, ageRange: "6-10" },
  "9":  { durationMin: 4, ageRange: "6-10" },
  "10": { durationMin: 4, ageRange: "6-10" },
};

const STARS_COUNT = 40;
const starPositions = Array.from({ length: STARS_COUNT }, (_, i) => ({
  top: `${(i * 2.4) % 90}%`,
  left: `${(i * 7.3) % 100}%`,
  size: (i % 3) + 1,
  opacity: 0.3 + (i % 5) * 0.1,
}));

export default function StoriesScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [listened, setListened] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getJSON<Record<string, boolean>>(STORAGE_KEYS.storiesListened).then(
      (v) => v && setListened(v),
    );
  }, []);

  const filtered = useMemo(() => {
    return STORIES.filter((s) => {
      if (filter === "young") {
        const minAge = parseInt((STORY_DISPLAY[s.id]?.ageRange ?? "5-9").split("-")[0]!);
        return minAge <= 5;
      }
      if (filter === "older") {
        const minAge = parseInt((STORY_DISPLAY[s.id]?.ageRange ?? "5-9").split("-")[0]!);
        return minAge >= 6;
      }
      return true;
    });
  }, [filter]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all",   label: "All Stories" },
    { id: "young", label: "Ages 4–6"    },
    { id: "older", label: "Ages 6–10"   },
  ];

  function handleStoryPress(story: Story) {
    setCurrentStoryId(story.id);
    router.push({ pathname: "/stories/[id]", params: { id: story.id } } as any);
  }

  return (
    <LinearGradient colors={["#0d1b4b", "#1a1040", "#0f0c29"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>

        {/* Stars background */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none" }}>
          {starPositions.map((s, i) => (
            <View
              key={i}
              style={{
                position: "absolute",
                top: s.top as TextStyle["fontSize"],
                left: s.left as TextStyle["fontSize"],
                width: s.size,
                height: s.size,
                borderRadius: s.size,
                backgroundColor: "#FFF",
                opacity: s.opacity,
              }}
            />
          ))}
        </View>

        <View style={{ padding: 20, paddingTop: 10 }}>
          <Text style={{ fontSize: 28, fontWeight: "800", color: "#FFF", textAlign: "center", letterSpacing: 0.5 }}>
            🌙 Bedtime Stories
          </Text>
          <Text style={{ color: "#a78bfa", textAlign: "center", fontSize: 14, marginTop: 4 }}>
            Dim the lights and listen 🌟
          </Text>
        </View>

        {/* Filter bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 10 }}
        >
          {filters.map((f) => {
            const active = filter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: active ? "#7c3aed" : "rgba(255,255,255,0.1)",
                  borderWidth: 1,
                  borderColor: active ? "#a78bfa" : "rgba(255,255,255,0.15)",
                }}
              >
                <Text style={{ color: active ? "#FFF" : "#c4b5fd", fontWeight: "700", fontSize: 13 }}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Story cards */}
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
          {filtered.map((story) => {
            const bg = CARD_BG[story.id] ?? (["#7C3AED", "#4C1D95"] as [string, string]);
            const display = STORY_DISPLAY[story.id] ?? { durationMin: 3, ageRange: "5-9" };
            return (
              <Pressable
                key={story.id}
                onPress={() => handleStoryPress(story)}
                style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
              >
                <LinearGradient
                  colors={[...bg, bg[1]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 20, padding: 18, flexDirection: "row", alignItems: "center", gap: 14 }}
                >
                  <Text style={{ fontSize: 52 }}>{story.emoji}</Text>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                      <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 16, flex: 1 }}>
                        {story.titleEn}
                      </Text>
                      {listened[story.id] && (
                        <View style={{ backgroundColor: "#10b981", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}>
                          <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "700" }}>✓</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
                      <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                        ⏱ {display.durationMin} min
                      </Text>
                      <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                        👶 {display.ageRange} yrs
                      </Text>
                      <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                        🇬🇧 English
                      </Text>
                    </View>
                  </View>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 20 }}>▶️</Text>
                  </View>
                </LinearGradient>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
