import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SoftCard } from "@/components/SoftCard";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useT } from "@/hooks/useT";
import { playChime } from "@/lib/chime";

const games = [
  {
    id: "word-puzzle",
    emoji: "🧩",
    titleKey: "wordPuzzle" as const,
    color: "#FF8A4C",
    desc: { en: "Drag letters to spell the word!", ar: "رتّب الحروف لتكتب الكلمة!" },
  },
  {
    id: "math-blast",
    emoji: "💥",
    titleKey: "mathBlast" as const,
    color: "#4FD1C5",
    desc: { en: "Tap the right answer fast!", ar: "اضغط الجواب الصحيح بسرعة!" },
  },
  {
    id: "letter-match",
    emoji: "🔤",
    titleKey: "letterMatch" as const,
    color: "#FF6FB5",
    desc: { en: "Match letter to its picture!", ar: "طابق الحرف مع صورته!" },
  },
  {
    id: "jigsaw",
    emoji: "🧩",
    titleKey: "jigsaw" as const,
    color: "#A78BFA",
    desc: { en: "Fix the picture and learn!", ar: "أعد تركيب الصورة وتعلّم!" },
  },
  {
    id: "story-builder",
    emoji: "📖",
    titleKey: "wordPuzzle" as const, // reuse key, override title below
    color: "#7C3AED",
    desc: { en: "Choose your adventure & learn science!", ar: "اختر مغامرتك وتعلّم العلوم!" },
    customTitle: { en: "Story Builder", ar: "بنّاء القصص" },
  },
  {
    id: "memory-champion",
    emoji: "🧠",
    titleKey: "mathBlast" as const, // reuse key, override title below
    color: "#0F172A",
    desc: { en: "3 rounds of memory challenges!", ar: "٣ جولات لاختبار ذاكرتك!" },
    customTitle: { en: "Memory Champion", ar: "بطل الذاكرة" },
  },
];

export default function Games() {
  const c = useColors();
  const router = useRouter();
  const t = useT();
  const { progress, profile } = useApp();
  const lang = (profile?.language ?? "en") as "en" | "ar";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }}>
        <Text style={{ fontSize: 26, fontWeight: "800", color: c.text }}>
          🎮 {t("gamesZone")}
        </Text>
        <SoftCard color={c.yellow}>
          <Text style={{ fontWeight: "800", fontSize: 14, color: "#5B3700" }}>
            ⭐ {t("totalStars")}: {progress.starsTotal}  ·  🎮 {progress.gamesPlayed} {lang === "ar" ? "مباراة" : "played"}
          </Text>
          <Text style={{ fontSize: 12, color: "#5B3700", marginTop: 4 }}>
            {t("dailyChallenge")}
          </Text>
        </SoftCard>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {games.map((g) => {
            const customT = (g as any).customTitle;
            const title = customT ? customT[lang] : t(g.titleKey);
            return (
              <Pressable
                key={g.id}
                onPress={() => { playChime("tap"); router.push(`/games/${g.id}` as any); }}
                style={({ pressed }) => ({
                  width: "47%",
                  backgroundColor: g.color,
                  borderRadius: c.radius,
                  padding: 18,
                  opacity: pressed ? 0.85 : 1,
                  minHeight: 160,
                })}
              >
                <Text style={{ fontSize: 36 }}>{g.emoji}</Text>
                <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 15, marginTop: 8 }}>
                  {title}
                </Text>
                <Text style={{ color: "#FFF", opacity: 0.9, marginTop: 6, fontSize: 12, lineHeight: 17 }}>
                  {g.desc[lang]}
                </Text>
                <View style={{ marginTop: 10, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.25)", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 }}>
                  <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 11 }}>▶ {t("playNow")}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
