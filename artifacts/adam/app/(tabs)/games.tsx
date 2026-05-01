import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useEffect } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    title: { en: "Word Puzzle", ar: "Word Puzzle" },
    desc: { en: "Drag letters to spell the word!", ar: "Drag letters to spell the word!" },
    colors: ["#FF8A4C", "#E8612A"],
    side: "left",
    badge: "HOT 🔥",
  },
  {
    id: "math-blast",
    emoji: "💥",
    title: { en: "Math Blast", ar: "Math Blast" },
    desc: { en: "Tap the right answer fast!", ar: "Tap the right answer fast!" },
    colors: ["#4ECDC4", "#26A69A"],
    side: "right",
  },
  {
    id: "letter-match",
    emoji: "🔤",
    title: { en: "Letter Match", ar: "Letter Match" },
    desc: { en: "Match letter to its picture!", ar: "Match letter to its picture!" },
    colors: ["#FF6FB5", "#D63D8A"],
    side: "left",
  },
  {
    id: "emoji-quiz",
    emoji: "🤩",
    title: { en: "Emoji Quiz", ar: "Emoji Quiz" },
    desc: { en: "Guess what the emoji means!", ar: "Guess what the emoji means!" },
    colors: ["#FCD34D", "#F59E0B"],
    side: "right",
    badge: "NEW ✨",
  },
  {
    id: "color-burst",
    emoji: "🎨",
    title: { en: "Color Burst", ar: "Color Burst" },
    desc: { en: "Tap the right color fast!", ar: "Tap the right color fast!" },
    colors: ["#A78BFA", "#7C3AED"],
    side: "left",
    badge: "NEW ✨",
  },
  {
    id: "number-hunt",
    emoji: "🔢",
    title: { en: "Number Hunt", ar: "Number Hunt" },
    desc: { en: "Count and tap the right number!", ar: "Count and tap the right number!" },
    colors: ["#6EE7B7", "#10B981"],
    side: "right",
    badge: "NEW ✨",
  },
  {
    id: "spell-race",
    emoji: "⚡",
    title: { en: "Spell Race", ar: "Spell Race" },
    desc: { en: "Hear the word, type it fast!", ar: "Hear the word, type it fast!" },
    colors: ["#F97316", "#DC2626"],
    side: "left",
    badge: "NEW ✨",
  },
  {
    id: "memory-match",
    emoji: "🧠",
    title: { en: "Memory Match", ar: "Memory Match" },
    desc: { en: "Flip cards and find the pairs!", ar: "Flip cards and find the pairs!" },
    colors: ["#6D28D9", "#4C1D95"],
    side: "right",
    badge: "NEW ✨",
  },
  {
    id: "story-builder",
    emoji: "📖",
    title: { en: "Story Builder", ar: "Story Builder" },
    desc: { en: "Choose your adventure & learn!", ar: "Choose your adventure & learn!" },
    colors: ["#4F46E5", "#7C3AED"],
    side: "left",
    badge: "SOON 🔒",
    comingSoon: true,
  },
];

// ── Floating star particle ─────────────────────────────────────────────────
function StarParticle({ style }: { style: any }) {
  const a = useRef(new Animated.Value(Math.random())).current;
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const dur = 1600 + Math.random() * 2000;
    Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 0.8 + Math.random() * 0.2, duration: dur, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.1, duration: dur, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(y, { toValue: -7, duration: 2000 + Math.random() * 1200, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 2000 + Math.random() * 1200, useNativeDriver: true }),
    ])).start();
  }, [a, y]);
  return <Animated.Text style={[style, { opacity: a, transform: [{ translateY: y }] }]}>✦</Animated.Text>;
}

const BG_STARS = [
  { top: 45, left: 22, fontSize: 10, color: "#FDE68A" },
  { top: 90, right: 28, fontSize: 7, color: "#a78bfa" },
  { top: 155, left: 65, fontSize: 13, color: "#6ee7b7" },
  { top: 230, right: 55, fontSize: 8, color: "#FDE68A" },
  { top: 310, left: 14, fontSize: 11, color: "#a78bfa" },
  { top: 400, right: 18, fontSize: 9, color: "#FDE68A" },
  { top: 480, left: 100, fontSize: 8, color: "#6ee7b7" },
  { top: 560, right: 75, fontSize: 12, color: "#a78bfa" },
  { top: 640, left: 30, fontSize: 9, color: "#FDE68A" },
  { top: 720, right: 40, fontSize: 7, color: "#6ee7b7" },
];

// ── Animated orb ──────────────────────────────────────────────────────────
function Orb({ style, color }: { style: any; color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: 1.15, duration: 3000 + Math.random() * 2000, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.9, duration: 3000 + Math.random() * 2000, useNativeDriver: true }),
    ])).start();
  }, [scale]);
  return <Animated.View style={[style, { backgroundColor: color, transform: [{ scale }] }]} />;
}

function PulseDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.4, duration: 800, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ]),
      ]),
    ).start();
  }, [scale, opacity]);
  return (
    <Animated.View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#FDE68A", transform: [{ scale }], opacity }} />
  );
}

function GameCard({ game, lang, onPress }: { game: GameDef; lang: "en"; onPress: () => void }) {
  const isLeft = game.side === "left";
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = GAMES.indexOf(game) * 120;
    const timer = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounce, { toValue: -5, duration: 1500, useNativeDriver: true }),
          Animated.timing(bounce, { toValue: 0, duration: 1500, useNativeDriver: true }),
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
            shadowOpacity: game.comingSoon ? 0 : 0.4,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 5 },
            elevation: game.comingSoon ? 0 : 8,
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
                <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 12 }}>▶ Play Now</Text>
              </View>
            )}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function PathConnector({ side }: { side: "left" | "right" }) {
  return (
    <View style={{ alignItems: "center", height: 44, justifyContent: "center" }}>
      <View style={{
        width: 2, height: 32,
        borderStyle: "dashed", borderLeftWidth: 2,
        borderColor: "rgba(167,139,250,0.5)",
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
  const lang = profile?.language ?? "en";

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#0D0426", "#1A0A3F", "#2D1B69", "#1A0D40"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Animated orbs */}
      <Orb style={{ position: "absolute", top: -60, left: -50, width: 240, height: 240, borderRadius: 120, opacity: 0.1 }} color="#7C3AED" />
      <Orb style={{ position: "absolute", top: 300, right: -60, width: 200, height: 200, borderRadius: 100, opacity: 0.08 }} color="#FF8A4C" />
      <Orb style={{ position: "absolute", bottom: 200, left: -40, width: 180, height: 180, borderRadius: 90, opacity: 0.07 }} color="#3B82F6" />
      <Orb style={{ position: "absolute", bottom: 50, right: -30, width: 150, height: 150, borderRadius: 75, opacity: 0.06 }} color="#10B981" />

      {/* Floating stars */}
      {BG_STARS.map((s, i) => (
        <StarParticle key={i} style={{ position: "absolute", top: s.top, left: (s as any).left, right: (s as any).right, fontSize: s.fontSize, color: s.color }} />
      ))}

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 8 }}>
            <Text style={{ fontSize: 28, fontWeight: "900", color: "#FFF" }}>
              🎮 {t("gamesZone")}
            </Text>
            <Text style={{ color: "rgba(167,139,250,0.8)", fontSize: 13, marginTop: 4 }}>
              Pick your adventure!
            </Text>
          </View>

          {/* Stats pill */}
          <View style={{ marginHorizontal: 18, marginBottom: 20 }}>
            <View style={{
              backgroundColor: "rgba(245,158,11,0.15)",
              borderRadius: 18, padding: 14,
              flexDirection: "row", alignItems: "center", gap: 12,
              borderWidth: 1, borderColor: "rgba(245,158,11,0.35)",
            }}>
              <Text style={{ fontSize: 24 }}>⭐</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#FDE68A", fontWeight: "800", fontSize: 14 }}>
                  {progress.starsTotal} stars · {progress.gamesPlayed} games played
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 2 }}>
                  {t("dailyChallenge")}
                </Text>
              </View>
              <Text style={{ fontSize: 22 }}>🏆</Text>
            </View>
          </View>

          {/* Game cards */}
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
              {index < GAMES.length - 1 && <PathConnector side={game.side} />}
            </View>
          ))}

          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
