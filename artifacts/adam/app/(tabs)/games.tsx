import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useEffect } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useT } from "@/hooks/useT";
import { playChime } from "@/lib/chime";

type GameDef = {
  id: string;
  emoji: string;
  title: { en: string; ar: string };
  desc: { en: string; ar: string };
  colors: [string, string];
  side: "left" | "right";
  comingSoon?: boolean;
  badge?: string;
};

const GAMES: GameDef[] = [
  {
    id: "word-puzzle",
    emoji: "🧩",
    title: { en: "Word Puzzle", ar: "لغز الكلمات" },
    desc: { en: "Drag letters to spell the word!", ar: "رتّب الحروف لتكتب الكلمة!" },
    colors: ["#FF8A4C", "#E8612A"],
    side: "left",
    badge: "HOT 🔥",
  },
  {
    id: "math-blast",
    emoji: "💥",
    title: { en: "Math Blast", ar: "انفجار الأرقام" },
    desc: { en: "Tap the right answer fast!", ar: "اضغط الجواب الصحيح بسرعة!" },
    colors: ["#4ECDC4", "#26A69A"],
    side: "right",
  },
  {
    id: "letter-match",
    emoji: "🔤",
    title: { en: "Letter Match", ar: "مطابقة الحروف" },
    desc: { en: "Match letter to its picture!", ar: "طابق الحرف مع صورته!" },
    colors: ["#FF6FB5", "#D63D8A"],
    side: "left",
  },
  {
    id: "emoji-quiz",
    emoji: "🤩",
    title: { en: "Emoji Quiz", ar: "مسابقة الرموز" },
    desc: { en: "Guess what the emoji means!", ar: "خمّن معنى الرمز!" },
    colors: ["#FCD34D", "#F59E0B"],
    side: "right",
    badge: "NEW ✨",
  },
  {
    id: "color-burst",
    emoji: "🎨",
    title: { en: "Color Burst", ar: "انفجار الألوان" },
    desc: { en: "Tap the right color fast!", ar: "اضغط اللون الصحيح بسرعة!" },
    colors: ["#A78BFA", "#7C3AED"],
    side: "left",
    badge: "NEW ✨",
  },
  {
    id: "number-hunt",
    emoji: "🔢",
    title: { en: "Number Hunt", ar: "صيد الأرقام" },
    desc: { en: "Count and tap the right number!", ar: "عدّ واضغط الرقم الصحيح!" },
    colors: ["#6EE7B7", "#10B981"],
    side: "right",
    badge: "NEW ✨",
  },
  {
    id: "spell-race",
    emoji: "⚡",
    title: { en: "Spell Race", ar: "سباق الهجاء" },
    desc: { en: "Hear the word, type it fast!", ar: "اسمع الكلمة واكتبها بسرعة!" },
    colors: ["#F97316", "#DC2626"],
    side: "left",
    badge: "NEW ✨",
  },
  {
    id: "memory-champion",
    emoji: "🧠",
    title: { en: "Memory Champion", ar: "بطل الذاكرة" },
    desc: { en: "3 rounds of memory challenges!", ar: "٣ جولات لاختبار ذاكرتك!" },
    colors: ["#0F172A", "#1E293B"],
    side: "right",
    badge: "SOON 🔒",
    comingSoon: true,
  },
  {
    id: "story-builder",
    emoji: "📖",
    title: { en: "Story Builder", ar: "بنّاء القصص" },
    desc: { en: "Choose your adventure & learn!", ar: "اختر مغامرتك وتعلّم!" },
    colors: ["#4F46E5", "#7C3AED"],
    side: "left",
    badge: "SOON 🔒",
    comingSoon: true,
  },
];

function PulseDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.3, duration: 900, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.4, duration: 900, useNativeDriver: true }),
        ]),
      ]),
    ).start();
  }, [scale, opacity]);
  return (
    <Animated.View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#FDE68A", transform: [{ scale }], opacity }} />
  );
}

function GameCard({ game, lang, onPress }: { game: GameDef; lang: "en" | "ar"; onPress: () => void }) {
  const isLeft = game.side === "left";
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = GAMES.indexOf(game) * 120;
    const timer = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounce, { toValue: -4, duration: 1600, useNativeDriver: true }),
          Animated.timing(bounce, { toValue: 0, duration: 1600, useNativeDriver: true }),
        ]),
      ).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [bounce, game]);

  return (
    <View style={{
      flexDirection: "row",
      justifyContent: isLeft ? "flex-start" : "flex-end",
      paddingHorizontal: 16,
      marginBottom: 4,
    }}>
      <Animated.View style={{ transform: [{ translateY: bounce }], width: "72%" }}>
        <Pressable
          onPress={game.comingSoon ? undefined : onPress}
          style={({ pressed }) => ({
            borderRadius: 24, overflow: "hidden",
            opacity: game.comingSoon ? 0.55 : pressed ? 0.88 : 1,
            shadowColor: game.colors[0],
            shadowOpacity: game.comingSoon ? 0 : 0.35,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: game.comingSoon ? 0 : 6,
          })}
        >
          <LinearGradient colors={game.colors} style={{ padding: 18 }}>
            {game.badge && (
              <View style={{
                position: "absolute", top: 10, right: 12,
                backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 10,
                paddingHorizontal: 8, paddingVertical: 3,
              }}>
                <Text style={{ color: "#FFF", fontSize: 9, fontWeight: "900" }}>{game.badge}</Text>
              </View>
            )}
            <Text style={{ fontSize: 42, marginBottom: 6 }}>{game.emoji}</Text>
            <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 17, marginBottom: 4 }}>
              {game.title[lang]}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, lineHeight: 17, marginBottom: 12 }}>
              {game.desc[lang]}
            </Text>
            {!game.comingSoon && (
              <View style={{ alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.22)", paddingVertical: 6, paddingHorizontal: 14, borderRadius: 14 }}>
                <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 12 }}>
                  {lang === "ar" ? "▶ العب الآن" : "▶ Play Now"}
                </Text>
              </View>
            )}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// Winding path connector between cards
function PathConnector({ side }: { side: "left" | "right" }) {
  return (
    <View style={{ alignItems: "center", height: 44, justifyContent: "center" }}>
      <View style={{
        width: 2,
        height: 32,
        borderStyle: "dashed",
        borderLeftWidth: 2,
        borderColor: "rgba(167,139,250,0.4)",
        marginLeft: side === "right" ? 60 : -60,
      }} />
      <PulseDot />
    </View>
  );
}

export default function Games() {
  const router = useRouter();
  const t = useT();
  const { progress, profile } = useApp();
  const lang = (profile?.language ?? "en") as "en" | "ar";

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#1A0A3F", "#2D1B69", "#1E0D4A"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {/* Ambient glows */}
      <View style={{ position: "absolute", top: -40, left: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: "#7C3AED", opacity: 0.12 }} />
      <View style={{ position: "absolute", bottom: 100, right: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: "#FF8A4C", opacity: 0.08 }} />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 8 }}>
            <Text style={{ fontSize: 28, fontWeight: "900", color: "#FFF" }}>
              🎮 {t("gamesZone")}
            </Text>
            <Text style={{ color: "rgba(167,139,250,0.8)", fontSize: 13, marginTop: 4 }}>
              {lang === "ar" ? "اختر لعبتك المفضلة!" : "Pick your adventure!"}
            </Text>
          </View>

          {/* Stats pill */}
          <View style={{ marginHorizontal: 18, marginBottom: 20 }}>
            <View style={{
              backgroundColor: "rgba(245,158,11,0.15)",
              borderRadius: 18, padding: 14,
              flexDirection: "row", alignItems: "center", gap: 12,
              borderWidth: 1, borderColor: "rgba(245,158,11,0.3)",
            }}>
              <Text style={{ fontSize: 24 }}>⭐</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#FDE68A", fontWeight: "800", fontSize: 14 }}>
                  {progress.starsTotal} {lang === "ar" ? "نجمة" : "stars"} · {progress.gamesPlayed} {lang === "ar" ? "مباراة" : "games played"}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 2 }}>
                  {t("dailyChallenge")}
                </Text>
              </View>
              <Text style={{ fontSize: 22 }}>🏆</Text>
            </View>
          </View>

          {/* Game cards — winding path layout */}
          {GAMES.map((game, index) => (
            <View key={game.id}>
              <GameCard
                game={game}
                lang={lang}
                onPress={() => {
                  playChime("tap");
                  router.push(`/games/${game.id}` as any);
                }}
              />
              {index < GAMES.length - 1 && (
                <PathConnector side={game.side} />
              )}
            </View>
          ))}

          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
