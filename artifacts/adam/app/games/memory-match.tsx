/**
 * Memory Match — flip cards to find matching emoji pairs.
 * 3 rounds: 4x3 (easy) → 4x4 (medium) → 5x4 (hard)
 * Plays encouraging TTS after each match.
 */
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { useApp } from "@/contexts/AppContext";
import { speakText } from "@/lib/tts";
import { playChime } from "@/lib/chime";

// ── Encouragement messages ─────────────────────────────────────────────────
const ENCOURAGEMENTS = [
  "Great match! Keep going!",
  "Well done! You found them!",
  "Amazing memory!",
  "Fantastic! You rock!",
  "Super! Keep it up!",
  "Brilliant! Nice one!",
  "Yes! Perfect match!",
];

const ROUND_EMOJIS = [
  // Round 1: 6 pairs (4x3 = 12 cards)
  ["🐶","🐱","🐸","🦁","🐼","🦊"],
  // Round 2: 8 pairs (4x4 = 16 cards)
  ["🍎","🍌","🍇","🍓","🍑","🍋","🍉","🥝"],
  // Round 3: 10 pairs (5x4 = 20 cards)
  ["⭐","🌙","🌈","❄️","🔥","💎","🌸","🍄","🦋","🎈"],
];

const ROUND_COLS = [4, 4, 5];
const ROUND_LABEL = ["Round 1 – Easy", "Round 2 – Medium", "Round 3 – Hard"];

type Card = { id: number; emoji: string; flipped: boolean; matched: boolean };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(emojis: string[]): Card[] {
  const pairs = [...emojis, ...emojis];
  return shuffle(pairs).map((emoji, id) => ({ id, emoji, flipped: false, matched: false }));
}

// ── Flip animation per card ────────────────────────────────────────────────
function MemoryCard({ card, onPress, disabled }: { card: Card; onPress: () => void; disabled: boolean }) {
  const flip = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const prevFlipped = useRef(false);

  useEffect(() => {
    if (card.flipped !== prevFlipped.current) {
      prevFlipped.current = card.flipped;
      Animated.timing(flip, {
        toValue: card.flipped ? 1 : 0,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }
  }, [card.flipped, flip]);

  useEffect(() => {
    if (card.matched) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.18, duration: 150, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [card.matched, scale]);

  const frontOpacity = flip.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
  const backOpacity = flip.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] });
  const frontRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "0deg"] });
  const backRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-180deg"] });

  const haptic = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  return (
    <Pressable
      onPress={() => { haptic(); onPress(); }}
      disabled={disabled || card.flipped || card.matched}
      style={({ pressed }) => ({
        opacity: (disabled && !card.flipped && !card.matched) ? 0.8 : pressed ? 0.85 : 1,
      })}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {/* Back (hidden) */}
        <Animated.View style={{
          position: "absolute",
          width: 60, height: 60,
          borderRadius: 14,
          opacity: backOpacity,
          transform: [{ rotateY: backRotate }],
          backfaceVisibility: "hidden",
        }}>
          <LinearGradient colors={["#4F46E5", "#7C3AED"]} style={{ flex: 1, borderRadius: 14, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 22 }}>✦</Text>
          </LinearGradient>
        </Animated.View>

        {/* Front (emoji) */}
        <Animated.View style={{
          width: 60, height: 60,
          borderRadius: 14,
          opacity: frontOpacity,
          transform: [{ rotateY: frontRotate }],
          backfaceVisibility: "hidden",
          backgroundColor: card.matched ? "#10B981" : "#1E1A3A",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: card.matched ? "#6EE7B7" : "#3D2A8A",
        }}>
          <Text style={{ fontSize: 28 }}>{card.emoji}</Text>
          {card.matched && (
            <View style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: "#FDE68A", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 9, fontWeight: "900", color: "#000" }}>✓</Text>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function MemoryMatch() {
  const router = useRouter();
  const { progress, saveProgress, profile } = useApp();
  const voice = profile?.hero === "girl" ? "nova" : "echo";

  const [round, setRound] = useState(0);
  const [cards, setCards] = useState<Card[]>(() => buildDeck(ROUND_EMOJIS[0]));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const [moves, setMoves] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [celebrate, setCelebrate] = useState(false);

  const celebAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  const totalPairs = ROUND_EMOJIS[round].length;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [round, headerAnim]);

  const encourage = useCallback(() => {
    const msg = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
    speakText(msg, voice).catch(() => {});
    playChime("correct");
  }, [voice]);

  const handleCardPress = useCallback((id: number) => {
    if (locked) return;
    setFlipped((prev) => {
      const next = [...prev, id];
      setCards((c) => c.map((card) => (card.id === id ? { ...card, flipped: true } : card)));

      if (next.length === 2) {
        setLocked(true);
        setMoves((m) => m + 1);

        const [a, b] = next;
        setCards((c) => {
          const cardA = c.find((x) => x.id === a)!;
          const cardB = c.find((x) => x.id === b)!;

          if (cardA.emoji === cardB.emoji) {
            // Match!
            const updated = c.map((card) =>
              card.id === a || card.id === b ? { ...card, matched: true, flipped: true } : card,
            );
            const newMatchCount = updated.filter((x) => x.matched).length / 2;
            setMatchCount(newMatchCount);
            encourage();

            setTimeout(() => {
              setFlipped([]);
              setLocked(false);

              if (newMatchCount >= totalPairs) {
                const pts = Math.max(50, 200 - moves * 3);
                setTotalScore((s) => s + pts);

                if (round >= 2) {
                  // Game complete
                  setTimeout(() => {
                    setGameOver(true);
                    speakText("You finished! Amazing job!", voice).catch(() => {});
                    playChime("levelup");
                    saveProgress((p) => ({
                      ...p,
                      gamesPlayed: (p.gamesPlayed ?? 0) + 1,
                      pointsTotal: (p.pointsTotal ?? 0) + pts,
                      starsTotal: (p.starsTotal ?? 0) + 3,
                    }));
                  }, 600);
                } else {
                  // Next round
                  setTimeout(() => {
                    const nextRound = round + 1;
                    setRound(nextRound);
                    setCards(buildDeck(ROUND_EMOJIS[nextRound]));
                    setMoves(0);
                    setMatchCount(0);
                    setFlipped([]);
                    setLocked(false);
                    speakText(`Round ${nextRound + 1}! Let's go!`, voice).catch(() => {});
                  }, 1000);
                }
              }
            }, 500);

            return updated;
          } else {
            // No match — flip back
            setTimeout(() => {
              setCards((cc) => cc.map((card) =>
                card.id === a || card.id === b ? { ...card, flipped: false } : card,
              ));
              setFlipped([]);
              setLocked(false);
              playChime("tap");
            }, 900);
            return c;
          }
        });

        return [];
      }

      return next;
    });
  }, [locked, encourage, round, totalPairs, moves, voice, saveProgress]);

  const restart = () => {
    setRound(0);
    setCards(buildDeck(ROUND_EMOJIS[0]));
    setFlipped([]);
    setLocked(false);
    setMoves(0);
    setMatchCount(0);
    setGameOver(false);
    setTotalScore(0);
  };

  const cols = ROUND_COLS[round];

  if (gameOver) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient colors={["#0D0426", "#1A0A3F", "#2D1B69"]} style={{ flex: 1 }} />
        <SafeAreaView style={{ flex: 1, position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 72 }}>🏆</Text>
          <Text style={{ color: "#FDE68A", fontWeight: "900", fontSize: 28, textAlign: "center", marginTop: 16 }}>You Won!</Text>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, textAlign: "center", marginTop: 8 }}>
            All 3 rounds complete!
          </Text>
          <View style={{ backgroundColor: "rgba(245,158,11,0.2)", borderRadius: 18, padding: 18, marginTop: 20, alignItems: "center", borderWidth: 1, borderColor: "rgba(245,158,11,0.4)" }}>
            <Text style={{ color: "#FDE68A", fontWeight: "900", fontSize: 22 }}>+{totalScore} points</Text>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 4 }}>⭐⭐⭐ Perfect!</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 14, marginTop: 28 }}>
            <Pressable onPress={restart} style={({ pressed }) => ({
              flex: 1, backgroundColor: "#7C3AED", borderRadius: 18, padding: 16, alignItems: "center", opacity: pressed ? 0.85 : 1,
            })}>
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 15 }}>🔄 Play Again</Text>
            </Pressable>
            <Pressable onPress={() => router.back()} style={({ pressed }) => ({
              flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 18, padding: 16, alignItems: "center", opacity: pressed ? 0.85 : 1,
            })}>
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 15 }}>🏠 Home</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={["#0D0426", "#1A0A3F", "#2D1B69"]} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}
          >
            <Ionicons name="chevron-back" size={20} color="#FFF" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 20 }}>🧠 Memory Match</Text>
            <Text style={{ color: "#a78bfa", fontSize: 12, marginTop: 1 }}>{ROUND_LABEL[round]}</Text>
          </View>
          <View style={{ backgroundColor: "rgba(245,158,11,0.2)", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(245,158,11,0.4)" }}>
            <Text style={{ color: "#FDE68A", fontWeight: "900", fontSize: 15 }}>
              {matchCount}/{totalPairs} pairs
            </Text>
          </View>
        </View>

        {/* Round progress */}
        <View style={{ paddingHorizontal: 18, marginBottom: 8 }}>
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 8 }}>
            {[0, 1, 2].map((r) => (
              <View key={r} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: r < round ? "#10B981" : r === round ? "#F59E0B" : "rgba(255,255,255,0.15)" }} />
            ))}
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>Moves: {moves}</Text>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>Score: {totalScore}</Text>
          </View>
        </View>

        {/* Card grid */}
        <ScrollView contentContainerStyle={{ alignItems: "center", paddingVertical: 10, paddingHorizontal: 16, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
          <View style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 10,
            maxWidth: cols * 70,
          }}>
            {cards.map((card) => (
              <MemoryCard
                key={card.id}
                card={card}
                onPress={() => handleCardPress(card.id)}
                disabled={locked}
              />
            ))}
          </View>

          {/* Hint */}
          <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 18, textAlign: "center" }}>
            Tap two cards to find matching pairs!
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
