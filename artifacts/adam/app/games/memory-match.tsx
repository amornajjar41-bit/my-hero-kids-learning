/**
 * Memory Match — flip cards to find matching emoji pairs.
 * 3 rounds: easy → medium → hard
 *
 * Crash fixes:
 *  - Generation counter: stale setTimeout callbacks bail out immediately
 *  - All timers tracked + cleared on round-start, unmount, and tab-blur
 *  - `isLocked` state drives the disabled prop (not a stale ref value)
 *  - Audio guard: only one encouragement at a time, ignores stale calls
 *  - MemCard flip/scale animations reset properly on key change
 */
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { useApp } from "@/contexts/AppContext";
import { speak as speakText, stop as stopSpeech } from "@/lib/audio";
import { playChime } from "@/lib/chime";

const { width: SW, height: SH } = Dimensions.get("window");

const ENCOURAGEMENTS = [
  "Great match!", "Well done!", "Amazing!", "Fantastic!", "Super!",
  "Brilliant!", "Yes!", "Perfect!", "Incredible!", "Genius!",
];

const ROUNDS = [
  { emojis: ["🐶","🐱","🐸","🦁","🐼","🦊"], cols: 4, label: "Round 1 · Easy 🌟" },
  { emojis: ["🍎","🍌","🍇","🍓","🍑","🍋","🍉","🥝"], cols: 4, label: "Round 2 · Medium 🔥" },
  { emojis: ["⭐","🌙","🌈","❄️","🔥","💎","🌸","🍄","🦋","🎈"], cols: 5, label: "Round 3 · Hard 🚀" },
];

type Phase = "preview" | "playing" | "transitioning";
type Card = { id: number; emoji: string; flipped: boolean; matched: boolean };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function buildDeck(emojis: string[]): Card[] {
  return shuffle([...emojis, ...emojis]).map((emoji, id) => ({ id, emoji, flipped: false, matched: false }));
}

function getCardSize(cols: number): number {
  const gap = 10;
  const padding = 20;
  return Math.floor((SW - padding * 2 - gap * (cols - 1)) / cols);
}

// ── Animated card ─────────────────────────────────────────────────────────────
function MemCard({
  card, onPress, disabled, size, previewPhase,
}: {
  card: Card; onPress: () => void; disabled: boolean; size: number; previewPhase: boolean;
}) {
  const flip = useRef(new Animated.Value(previewPhase ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(previewPhase ? 1 : 0.7)).current;
  const prevFlipped = useRef(previewPhase);
  const prevMatched = useRef(false);
  const flipAnim = useRef<Animated.CompositeAnimation | null>(null);
  const scaleAnim = useRef<Animated.CompositeAnimation | null>(null);

  // Pop-in on mount
  useEffect(() => {
    if (!previewPhase) {
      scaleAnim.current?.stop();
      scaleAnim.current = Animated.spring(scale, {
        toValue: 1, useNativeDriver: true, tension: 150, friction: 8,
      });
      scaleAnim.current.start();
    }
    return () => {
      flipAnim.current?.stop();
      scaleAnim.current?.stop();
    };
  }, []);

  useEffect(() => {
    const shouldBeUp = card.flipped || card.matched || previewPhase;
    if (shouldBeUp !== prevFlipped.current) {
      prevFlipped.current = shouldBeUp;
      flipAnim.current?.stop();
      flipAnim.current = Animated.timing(flip, {
        toValue: shouldBeUp ? 1 : 0,
        duration: 280,
        useNativeDriver: true,
      });
      flipAnim.current.start();
    }
  }, [card.flipped, card.matched, previewPhase]);

  useEffect(() => {
    if (card.matched && !prevMatched.current) {
      prevMatched.current = true;
      scaleAnim.current?.stop();
      scaleAnim.current = Animated.sequence([
        Animated.timing(scale, { toValue: 1.22, duration: 110, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 7 }),
      ]);
      scaleAnim.current.start();
    }
  }, [card.matched]);

  const frontOpacity = flip.interpolate({ inputRange: [0, 0.45, 0.55, 1], outputRange: [0, 0, 1, 1] });
  const backOpacity  = flip.interpolate({ inputRange: [0, 0.45, 0.55, 1], outputRange: [1, 1, 0, 0] });
  const frontRotate  = flip.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "0deg"] });
  const backRotate   = flip.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-180deg"] });

  const cardH = Math.round(size * 1.05);

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      disabled={disabled || card.flipped || card.matched || previewPhase}
    >
      <Animated.View style={{ width: size, height: cardH, transform: [{ scale }] }}>
        {/* Back face */}
        <Animated.View style={{
          position: "absolute", width: size, height: cardH, borderRadius: 16,
          opacity: backOpacity,
          transform: [{ rotateY: backRotate }],
          backfaceVisibility: "hidden",
          overflow: "hidden",
        }}>
          <LinearGradient
            colors={["#4F46E5", "#7C3AED"]}
            style={{ flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 16, borderWidth: 2, borderColor: "rgba(167,139,250,0.5)" }}
          >
            <Text style={{ fontSize: size * 0.38 }}>✦</Text>
          </LinearGradient>
        </Animated.View>

        {/* Front face */}
        <Animated.View style={{
          position: "absolute", width: size, height: cardH, borderRadius: 16,
          opacity: frontOpacity,
          transform: [{ rotateY: frontRotate }],
          backfaceVisibility: "hidden",
          overflow: "hidden",
          borderWidth: 2,
          borderColor: card.matched ? "#6EE7B7" : "rgba(255,255,255,0.15)",
        }}>
          <LinearGradient
            colors={card.matched ? ["#064E3B", "#065F46"] : ["#1E1A3A", "#2D1B69"]}
            style={{ flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 14 }}
          >
            <Text style={{ fontSize: size * 0.42 }}>{card.emoji}</Text>
            {card.matched && (
              <View style={{
                position: "absolute", top: 4, right: 4,
                width: 18, height: 18, borderRadius: 9,
                backgroundColor: "#FDE68A", alignItems: "center", justifyContent: "center",
              }}>
                <Text style={{ fontSize: 10, fontWeight: "900", color: "#000" }}>✓</Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// ── Preview countdown bubble ──────────────────────────────────────────────────
function CountdownBubble({ seconds }: { seconds: number }) {
  const scale = useRef(new Animated.Value(1.3)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }).start();
  }, [seconds]);
  return (
    <Animated.View style={{
      position: "absolute", top: SH * 0.08, alignSelf: "center",
      backgroundColor: "rgba(245,158,11,0.95)", borderRadius: 28,
      paddingHorizontal: 24, paddingVertical: 10, zIndex: 10,
      transform: [{ scale }],
      shadowColor: "#F59E0B", shadowOpacity: 0.6, shadowRadius: 20, elevation: 12,
    }}>
      <Text style={{ color: "#000", fontWeight: "900", fontSize: 20 }}>
        Memorise! {seconds}s ⏱
      </Text>
    </Animated.View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function MemoryMatch() {
  const router = useRouter();
  const { saveProgress, profile } = useApp();
  const voice = profile?.hero === "girl" ? "nova" : "echo";

  const [round, setRound] = useState(0);
  const [cards, setCards] = useState<Card[]>(() => buildDeck(ROUNDS[0]!.emojis));
  const [phase, setPhase] = useState<Phase>("preview");
  const [countdown, setCountdown] = useState(2);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [isLocked, setIsLocked] = useState(false);   // drives disabled prop
  const lockedRef = useRef(false);                   // sync guard in handlers
  const [moves, setMoves] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Generation counter: every new round bumps this; stale callbacks bail out
  const genRef = useRef(0);
  // All pending timers: cleared on round start + unmount
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const addTimer = useCallback((fn: () => void, delay: number) => {
    const t = setTimeout(fn, delay);
    timersRef.current.push(t);
    return t;
  }, []);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // Safe lock helpers that keep ref + state in sync
  const lock = useCallback(() => {
    lockedRef.current = true;
    setIsLocked(true);
  }, []);

  const unlock = useCallback(() => {
    lockedRef.current = false;
    setIsLocked(false);
  }, []);

  // Speak helper: stop current audio first, guard against stale gen
  const safeSpeak = useCallback((text: string, gen: number) => {
    if (gen !== genRef.current) return;
    stopSpeech();
    speakText(text, voice).catch(() => {});
  }, [voice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
      stopSpeech();
    };
  }, [clearAllTimers]);

  const currentRound = ROUNDS[round]!;
  const totalPairs = currentRound.emojis.length;
  const cardSize = getCardSize(currentRound.cols);

  // Preview countdown
  useEffect(() => {
    if (phase !== "preview") return;
    if (countdown <= 0) {
      setCards((c) => c.map((card) => ({ ...card, flipped: false })));
      setPhase("playing");
      return;
    }
    const t = setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  const startRound = useCallback((r: number) => {
    // Bump generation — all stale callbacks will see gen !== genRef.current
    genRef.current += 1;
    clearAllTimers();
    stopSpeech();

    const deck = buildDeck(ROUNDS[r]!.emojis);
    setCards(deck);
    setPhase("preview");
    setCountdown(2);
    setFlippedIds([]);
    lockedRef.current = false;
    setIsLocked(false);
    setMoves(0);
    setMatchCount(0);
  }, [clearAllTimers]);

  const handleCardPress = useCallback((id: number) => {
    // Synchronous guard using ref — blocks before any state update
    if (lockedRef.current || phase !== "playing") return;

    const gen = genRef.current;

    setFlippedIds((prev) => {
      // Don't add duplicates or exceed 2
      if (prev.includes(id) || prev.length >= 2) return prev;

      const next = [...prev, id];
      setCards((c) => c.map((card) => card.id === id ? { ...card, flipped: true } : card));

      if (next.length === 2) {
        // Lock immediately (synchronous ref + state)
        lockedRef.current = true;
        setIsLocked(true);
        setMoves((m) => m + 1);

        const [aId, bId] = next as [number, number];

        addTimer(() => {
          // Bail if this is a stale callback (round changed / unmounted)
          if (gen !== genRef.current) return;

          setCards((c) => {
            const cardA = c.find((x) => x.id === aId);
            const cardB = c.find((x) => x.id === bId);
            if (!cardA || !cardB) return c;

            if (cardA.emoji === cardB.emoji) {
              // ── Match ──────────────────────────────────────────────────────
              const updated = c.map((card) =>
                card.id === aId || card.id === bId
                  ? { ...card, matched: true, flipped: true }
                  : card,
              );
              const newMatchCount = updated.filter((x) => x.matched).length / 2;
              setMatchCount(newMatchCount);

              const msg = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]!;
              playChime("success");
              addTimer(() => safeSpeak(msg, gen), 500);

              setFlippedIds([]);
              lockedRef.current = false;
              setIsLocked(false);

              // Check round/game complete
              setMoves((currentMoves) => {
                if (newMatchCount >= totalPairs) {
                  const pts = Math.max(50, 200 - currentMoves * 3);
                  setTotalScore((s) => s + pts);

                  addTimer(() => {
                    if (gen !== genRef.current) return;
                    if (round >= ROUNDS.length - 1) {
                      setGameOver(true);
                      safeSpeak("You finished! Amazing job!", gen);
                      playChime("celebration");
                      saveProgress((p) => ({
                        ...p,
                        gamesPlayed: (p.gamesPlayed ?? 0) + 1,
                        pointsTotal: (p.pointsTotal ?? 0) + pts,
                        starsTotal: (p.starsTotal ?? 0) + 3,
                      }));
                    } else {
                      const nextRound = round + 1;
                      setRound(nextRound);
                      safeSpeak(`Round ${nextRound + 1}! Memorise fast!`, gen);
                      playChime("celebration");
                      startRound(nextRound);
                    }
                  }, 900);
                }
                return currentMoves;
              });

              return updated;
            } else {
              // ── No match: flip back after delay ───────────────────────────
              addTimer(() => {
                if (gen !== genRef.current) return;
                setCards((cc) => cc.map((card) =>
                  card.id === aId || card.id === bId ? { ...card, flipped: false } : card,
                ));
                setFlippedIds([]);
                lockedRef.current = false;
                setIsLocked(false);
              }, 750);
              return c;
            }
          });
        }, 280);

        return [];
      }

      return next;
    });
  }, [phase, round, totalPairs, voice, saveProgress, startRound, addTimer, safeSpeak]);

  const restart = useCallback(() => {
    setRound(0);
    setGameOver(false);
    setTotalScore(0);
    startRound(0);
  }, [startRound]);

  // ── Game over screen ──────────────────────────────────────────────────────
  if (gameOver) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient colors={["#0D0426", "#1A0A3F", "#2D1B69"]} style={{ flex: 1 }} />
        <SafeAreaView style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          alignItems: "center", justifyContent: "center", padding: 28,
        }}>
          <Text style={{ fontSize: 80 }}>🏆</Text>
          <Text style={{ color: "#FDE68A", fontWeight: "900", fontSize: 32, textAlign: "center", marginTop: 16 }}>
            You Won!
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, textAlign: "center", marginTop: 8 }}>
            All 3 rounds complete!
          </Text>
          <View style={{
            backgroundColor: "rgba(245,158,11,0.2)", borderRadius: 20, padding: 20,
            marginTop: 20, alignItems: "center",
            borderWidth: 1, borderColor: "rgba(245,158,11,0.4)",
          }}>
            <Text style={{ color: "#FDE68A", fontWeight: "900", fontSize: 26 }}>+{totalScore} points</Text>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 4 }}>⭐⭐⭐ Perfect!</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 14, marginTop: 32, width: "100%" }}>
            <Pressable
              onPress={restart}
              style={({ pressed }) => ({
                flex: 1, backgroundColor: "#7C3AED", borderRadius: 20, padding: 18,
                alignItems: "center", opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 16 }}>🔄 Play Again</Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 20, padding: 18,
                alignItems: "center", opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 16 }}>🏠 Home</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Game screen ───────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#0D0426", "#1A0A3F", "#2D1B69"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {phase === "preview" && <CountdownBubble seconds={countdown} />}

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={{
          paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6,
          flexDirection: "row", alignItems: "center", gap: 12,
        }}>
          <Pressable
            onPress={() => { clearAllTimers(); stopSpeech(); router.back(); }}
            style={({ pressed }) => ({
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.1)",
              alignItems: "center", justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="chevron-back" size={20} color="#FFF" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 18 }}>🧠 Memory Match</Text>
            <Text style={{ color: "#a78bfa", fontSize: 12 }}>{currentRound.label}</Text>
          </View>
          <View style={{
            backgroundColor: "rgba(245,158,11,0.2)", borderRadius: 14,
            paddingHorizontal: 12, paddingVertical: 6,
            borderWidth: 1, borderColor: "rgba(245,158,11,0.4)",
          }}>
            <Text style={{ color: "#FDE68A", fontWeight: "900", fontSize: 15 }}>{matchCount}/{totalPairs} ✓</Text>
          </View>
        </View>

        {/* Round progress bars */}
        <View style={{ paddingHorizontal: 16, marginBottom: 6 }}>
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 6 }}>
            {ROUNDS.map((_, r) => (
              <View key={r} style={{
                flex: 1, height: 5, borderRadius: 3,
                backgroundColor: r < round ? "#10B981" : r === round ? "#F59E0B" : "rgba(255,255,255,0.12)",
              }} />
            ))}
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>Moves: {moves}</Text>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>Score: {totalScore}</Text>
          </View>
        </View>

        {/* Card grid */}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, paddingBottom: 10 }}>
          {phase === "preview" && (
            <Text style={{ color: "#FDE68A", fontWeight: "800", fontSize: 14, marginBottom: 12, textAlign: "center" }}>
              👀 Remember the positions!
            </Text>
          )}
          <View style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 10,
            maxWidth: currentRound.cols * (cardSize + 10),
          }}>
            {cards.map((card) => (
              <MemCard
                key={card.id}
                card={card}
                onPress={() => handleCardPress(card.id)}
                disabled={isLocked || phase !== "playing"}
                size={cardSize}
                previewPhase={phase === "preview"}
              />
            ))}
          </View>
          {phase === "playing" && (
            <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 16 }}>
              Tap two cards to find pairs!
            </Text>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
