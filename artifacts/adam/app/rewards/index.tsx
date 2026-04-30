import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useEffect } from "react";
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { allBadges, badgeName } from "@/constants/badges";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { REWARD_SHOP, type RewardItem } from "@/lib/storage";

// ── Floating star ──────────────────────────────────────────────────────────
function FloatingStar({ style }: { style: any }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 2000 + Math.random() * 1500, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 2000 + Math.random() * 1500, useNativeDriver: true }),
      ]),
    ).start();
  }, [anim]);
  return (
    <Animated.Text
      style={[style, { opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.7] }) }]}
    >✦</Animated.Text>
  );
}

const BG_STARS = [
  { top: 30, left: 20, fontSize: 12 }, { top: 60, right: 30, fontSize: 8 },
  { top: 140, left: 50, fontSize: 10 }, { top: 200, right: 60, fontSize: 14 },
  { top: 280, left: 10, fontSize: 9 }, { top: 350, right: 15, fontSize: 11 },
];

// ── Animated badge card ────────────────────────────────────────────────────
function TrophyBadge({ earned, emoji, name }: { earned: boolean; emoji: string; name: string }) {
  const glow = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    if (!earned) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1200, useNativeDriver: false, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(glow, { toValue: 0.7, duration: 1200, useNativeDriver: false, easing: Easing.inOut(Easing.sin) }),
      ]),
    ).start();
  }, [earned, glow]);

  return (
    <View style={{ alignItems: "center", width: 80 }}>
      <LinearGradient
        colors={earned ? ["#FEF3C7", "#FDE68A", "#F59E0B"] : ["#2a1f4a", "#1a1030"]}
        style={{
          width: 68, height: 74, borderRadius: 18,
          alignItems: "center", justifyContent: "center",
          borderWidth: 2, borderColor: earned ? "#FCD34D" : "#3a2f5a",
        }}
      >
        {earned ? (
          <>
            <Text style={{ fontSize: 32 }}>{emoji}</Text>
            <Animated.Text style={{ position: "absolute", top: 3, right: 5, fontSize: 9, opacity: glow }}>✨</Animated.Text>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 28, opacity: 0.25 }}>{emoji}</Text>
            <Text style={{ position: "absolute", fontSize: 18 }}>🔒</Text>
          </>
        )}
      </LinearGradient>
      <Text numberOfLines={2} style={{
        fontSize: 9, color: earned ? "#FDE68A" : "#6B7280",
        textAlign: "center", marginTop: 5, fontWeight: earned ? "800" : "500", lineHeight: 12,
      }}>
        {name}
      </Text>
    </View>
  );
}

// ── Shop item card ─────────────────────────────────────────────────────────
function ShopCard({ item, unlocked, canAfford, onBuy }: {
  item: RewardItem; unlocked: boolean; canAfford: boolean; onBuy: () => void;
}) {
  return (
    <Pressable
      onPress={unlocked ? undefined : canAfford ? onBuy : undefined}
      disabled={unlocked || !canAfford}
      style={({ pressed }) => ({
        flex: 1, minWidth: "44%", maxWidth: "48%",
        borderRadius: 20, overflow: "hidden",
        opacity: unlocked ? 1 : canAfford ? (pressed ? 0.85 : 1) : 0.45,
        marginBottom: 12,
      })}
    >
      <LinearGradient
        colors={unlocked ? ["#6d28d9", "#4f46e5"] : canAfford ? ["#1e1040", "#2d1b69"] : ["#1a1a2e", "#16213e"]}
        style={{ padding: 16, alignItems: "center", gap: 6 }}
      >
        <Text style={{ fontSize: 36 }}>{item.emoji}</Text>
        <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 13, textAlign: "center" }}>
          {item.en}
        </Text>
        {unlocked ? (
          <View style={{ backgroundColor: "#10B981", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "800" }}>UNLOCKED ✓</Text>
          </View>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={{ fontSize: 14 }}>⭐</Text>
            <Text style={{ color: canAfford ? "#FDE68A" : "#9CA3AF", fontWeight: "800", fontSize: 13 }}>{item.cost}</Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

export default function TrophyRoom() {
  const router = useRouter();
  const { progress, saveProgress } = useApp();

  const earnedCount = allBadges.filter((b) =>
    b.earned({
      streak: progress.streak,
      lessonsCompleted: progress.lessonsCompleted.length,
      chatSessions: progress.chatSessions,
      arabicLessons: progress.arabicLessons,
      englishLessons: progress.englishLessons,
      gamesPlayed: progress.gamesPlayed,
      storiesListened: progress.storiesListened,
      pointsTotal: progress.pointsTotal ?? 0,
    }),
  ).length;

  const pts = progress.pointsTotal ?? 0;
  const todayPts = progress.todayPoints ?? 0;
  const unlocked = progress.rewardsUnlocked ?? [];

  const handleBuy = (item: RewardItem) => {
    if (pts < item.cost) return;
    Alert.alert(
      "Confirm Purchase",
      `Buy ${item.en} for ${item.cost} points?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Buy!",
          onPress: () => {
            saveProgress((p) => ({
              ...p,
              pointsTotal: (p.pointsTotal ?? 0) - item.cost,
              rewardsUnlocked: [...(p.rewardsUnlocked ?? []), item.id],
            }));
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={["#0f0820", "#1e0a4a", "#2d1b69"]} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
      {BG_STARS.map((s, i) => (
        <FloatingStar key={i} style={{ position: "absolute", color: "#a78bfa", fontSize: s.fontSize, top: s.top, left: (s as any).left, right: (s as any).right }} />
      ))}

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View style={{ paddingHorizontal: 18, paddingTop: 10, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}
          >
            <Ionicons name="chevron-back" size={20} color="#FFF" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 22 }}>
              🏆 Trophy Room
            </Text>
            <Text style={{ color: "#a78bfa", fontSize: 12, marginTop: 1 }}>
              {earnedCount}/{allBadges.length} trophies earned
            </Text>
          </View>
          <View style={{ backgroundColor: "rgba(245,158,11,0.2)", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: "rgba(245,158,11,0.4)", alignItems: "center" }}>
            <Text style={{ color: "#FDE68A", fontWeight: "900", fontSize: 18 }}>⭐ {pts}</Text>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 9 }}>your pts</Text>
          </View>
        </View>

        {/* Today's points */}
        {todayPts > 0 && (
          <View style={{ marginHorizontal: 18, marginBottom: 10 }}>
            <View style={{ backgroundColor: "rgba(16,185,129,0.2)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "rgba(16,185,129,0.4)" }}>
              <Text style={{ fontSize: 18 }}>🌟</Text>
              <Text style={{ color: "#6ee7b7", fontWeight: "700", fontSize: 13 }}>
                +{todayPts} points today!
              </Text>
            </View>
          </View>
        )}

        {/* Progress bar */}
        <View style={{ marginHorizontal: 18, marginBottom: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ color: "#a78bfa", fontSize: 11, fontWeight: "700" }}>Trophies earned</Text>
            <Text style={{ color: "#FDE68A", fontSize: 11, fontWeight: "800" }}>{earnedCount}/{allBadges.length}</Text>
          </View>
          <View style={{ height: 6, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
            <LinearGradient
              colors={["#F59E0B", "#FDE68A"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ width: `${(earnedCount / allBadges.length) * 100}%`, height: "100%", borderRadius: 3 }}
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40, gap: 20 }} showsVerticalScrollIndicator={false}>

          {/* ── Trophies ── */}
          <View>
            <Text style={{ color: "#FDE68A", fontWeight: "800", fontSize: 16, marginBottom: 12 }}>
              🏅 Your Trophies
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "flex-start" }}>
              {allBadges.map((b) => {
                const earned = b.earned({
                  streak: progress.streak,
                  lessonsCompleted: progress.lessonsCompleted.length,
                  chatSessions: progress.chatSessions,
                  arabicLessons: progress.arabicLessons,
                  englishLessons: progress.englishLessons,
                  gamesPlayed: progress.gamesPlayed,
                  storiesListened: progress.storiesListened,
                  pointsTotal: progress.pointsTotal ?? 0,
                });
                return <TrophyBadge key={b.id} earned={earned} emoji={b.emoji} name={badgeName(b)} />;
              })}
            </View>
          </View>

          {/* ── How to earn points ── */}
          <View style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}>
            <Text style={{ color: "#FDE68A", fontWeight: "800", fontSize: 13, marginBottom: 8 }}>
              How to earn points?
            </Text>
            {[
              { emoji: "📚", text: "Homework help", pts: 10 },
              { emoji: "🎓", text: "Complete lesson", pts: 25 },
              { emoji: "🎮", text: "Play a game", pts: 15 },
              { emoji: "🌙", text: "Listen to story", pts: 20 },
              { emoji: "🔥", text: "3-day streak bonus", pts: 50 },
              { emoji: "🔥🔥", text: "7-day streak bonus", pts: 150 },
            ].map((row, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 4, gap: 8 }}>
                <Text style={{ fontSize: 16 }}>{row.emoji}</Text>
                <Text style={{ flex: 1, color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{row.text}</Text>
                <Text style={{ color: "#FDE68A", fontWeight: "800", fontSize: 13 }}>+{row.pts}</Text>
              </View>
            ))}
          </View>

          {/* ── Shop ── */}
          <View>
            <Text style={{ color: "#a78bfa", fontWeight: "800", fontSize: 16, marginBottom: 12 }}>
              🛒 Spend Your Points
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
              {REWARD_SHOP.map((item) => (
                <ShopCard
                  key={item.id}
                  item={item}
                  unlocked={unlocked.includes(item.id)}
                  canAfford={pts >= item.cost}
                  onBuy={() => handleBuy(item)}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
