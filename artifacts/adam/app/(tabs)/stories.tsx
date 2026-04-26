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
import { useApp } from "@/contexts/AppContext";
import { useLang } from "@/hooks/useT";
import { STORIES } from "@/constants/stories-data";
import { getJSON } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/storage";

type Filter = "all" | "ar" | "en" | "young" | "older";

const STARS_COUNT = 40;
const starPositions = Array.from({ length: STARS_COUNT }, (_, i) => ({
  top: `${Math.random() * 90}%`,
  left: `${Math.random() * 100}%`,
  size: Math.random() * 3 + 1,
  opacity: Math.random() * 0.6 + 0.3,
}));

export default function StoriesScreen() {
  const c = useColors();
  const router = useRouter();
  const lang = useLang();
  const { profile } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [listened, setListened] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getJSON<Record<string, boolean>>(STORAGE_KEYS.storiesListened).then(
      (v) => v && setListened(v),
    );
  }, []);

  const filtered = useMemo(() => {
    return STORIES.filter((s) => {
      if (filter === "ar") return s.lang === "ar";
      if (filter === "en") return s.lang === "en";
      if (filter === "young") {
        const minAge = parseInt(s.ageRange.split("-")[0]!);
        return minAge <= 6;
      }
      if (filter === "older") {
        const minAge = parseInt(s.ageRange.split("-")[0]!);
        return minAge >= 6;
      }
      return true;
    });
  }, [filter]);

  const filters: { id: Filter; labelEn: string; labelAr: string }[] = [
    { id: "all", labelEn: "All", labelAr: "الكل" },
    { id: "ar", labelEn: "Arabic", labelAr: "العربية" },
    { id: "en", labelEn: "English", labelAr: "الإنجليزية" },
    { id: "young", labelEn: "3–6 yrs", labelAr: "٣–٦ سنوات" },
    { id: "older", labelEn: "7–10 yrs", labelAr: "٧–١٠ سنوات" },
  ];

  return (
    <LinearGradient
      colors={["#0d1b4b", "#1a1040", "#0f0c29"]}
      style={{ flex: 1 }}
    >
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
          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              color: "#FFF",
              textAlign: "center",
              letterSpacing: 0.5,
            }}
          >
            {lang === "ar" ? "🌙 قصص قبل النوم" : "🌙 Bedtime Stories"}
          </Text>
          <Text
            style={{
              color: "#a78bfa",
              textAlign: "center",
              fontSize: 14,
              marginTop: 4,
            }}
          >
            {lang === "ar" ? "أضوئي الغرفة وانطي أذنك 🌟" : "Dim the lights and listen 🌟"}
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
                  {lang === "ar" ? f.labelAr : f.labelEn}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Story cards */}
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
          {filtered.map((story) => (
            <Pressable
              key={story.id}
              onPress={() => router.push(`/stories/${story.id}`)}
              style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
            >
              <LinearGradient
                colors={[...story.cardBg, story.cardBg[1]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 20,
                  padding: 18,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <Text style={{ fontSize: 52 }}>{story.cardEmoji}</Text>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                    <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 16, flex: 1 }}>
                      {lang === "ar" ? story.titleAr : story.titleEn}
                    </Text>
                    {listened[story.id] && (
                      <View style={{ backgroundColor: "#10b981", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "700" }}>✓</Text>
                      </View>
                    )}
                  </View>
                  {lang === "ar" && (
                    <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                      {story.titleEn}
                    </Text>
                  )}
                  <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
                    <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                      ⏱ {story.durationMin} {lang === "ar" ? "دقائق" : "min"}
                    </Text>
                    <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                      👶 {story.ageRange} {lang === "ar" ? "سنوات" : "yrs"}
                    </Text>
                    <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                      {story.lang === "ar" ? "🇸🇦 عربي" : "🇬🇧 English"}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 20 }}>▶️</Text>
                </View>
              </LinearGradient>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
