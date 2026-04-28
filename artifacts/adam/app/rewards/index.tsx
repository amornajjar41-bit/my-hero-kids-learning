import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useEffect, useState } from "react";
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
import { useLang } from "@/hooks/useT";
import { REWARD_SHOP, type RewardItem } from "@/lib/storage";

// ── Animated badge card ────────────────────────────────────────────────────
function BadgeCard({ earned, emoji, name }: { earned: boolean; emoji: string; name: string }) {
  const glow = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    if (!earned) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1,   duration: 1200, useNativeDriver: false, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(glow, { toValue: 0.7, duration: 1200, useNativeDriver: false, easing: Easing.inOut(Easing.sin) }),
      ]),
    ).start();
  }, [earned, glow]);

  return (
    <View style={{ alignItems: "center", width: 80 }}>
      <LinearGradient
        colors={earned ? ["#FEF3C7", "#FDE68A", "#F59E0B"] : ["#374151", "#1F2937"]}
        style={{
          width: 68, height: 74, borderRadius: 18,
          alignItems: "center", justifyContent: "center",
          borderWidth: 2, borderColor: earned ? "#FCD34D" : "#374151",
        }}
      >
        {earned ? (
          <>
            <Text style={{ fontSize: 32 }}>{emoji}</Text>
            <Animated.Text style={{ position: "absolute", top: 3, right: 5, fontSize: 9, opacity: glow }}>✨</Animated.Text>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 28, opacity: 0.3 }}>{emoji}</Text>
            <Text style={{ position: "absolute", fontSize: 18 }}>🔒</Text>
          </>
        )}
      </LinearGradient>
      <Text numberOfLines={2} style={{ fontSize: 9, color: earned ? "#FDE68A" : "#6B7280", textAlign: "center", marginTop: 5, fontWeight: earned ? "800" : "500", lineHeight: 12 }}>
        {name}
      </Text>
    </View>
  );
}

// ── Shop item card ─────────────────────────────────────────────────────────
function ShopCard({
  item, unlocked, canAfford, onBuy,
}: {
  item: RewardItem; unlocked: boolean; canAfford: boolean; onBuy: () => void;
}) {
  const c = useColors();
  const lang = useLang();
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
          {lang === "ar" ? item.ar : item.en}
        </Text>
        {unlocked ? (
          <View style={{ backgroundColor: "#10B981", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "800" }}>
              {lang === "ar" ? "مفتوح ✓" : "UNLOCKED ✓"}
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={{ fontSize: 14 }}>⭐</Text>
            <Text style={{ color: canAfford ? "#FDE68A" : "#9CA3AF", fontWeight: "800", fontSize: 13 }}>
              {item.cost}
            </Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

// ── Streak bonus banner ────────────────────────────────────────────────────
function StreakBonus({ streak, lang }: { streak: number; lang: string }) {
  if (streak < 3) return null;
  const bonus = streak >= 7 ? 150 : 50;
  const days = streak >= 7 ? 7 : 3;
  return (
    <View style={{ backgroundColor: "rgba(245,158,11,0.2)", borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "rgba(245,158,11,0.4)" }}>
      <Text style={{ fontSize: 28 }}>🔥</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#FDE68A", fontWeight: "800", fontSize: 13 }}>
          {lang === "ar" ? `مكافأة ${days} أيام متتالية!` : `${days}-day streak bonus!`}
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 }}>
          {lang === "ar" ? `ربحت ${bonus} نقطة إضافية` : `+${bonus} bonus points earned`}
        </Text>
      </View>
      <Text style={{ color: "#FDE68A", fontWeight: "900", fontSize: 20 }}>+{bonus}</Text>
    </View>
  );
}

export default function RewardsRoom() {
  const c = useColors();
  const router = useRouter();
  const lang = useLang();
  const { progress, saveProgress } = useApp();
  const [tab, setTab] = useState<"badges" | "shop">("badges");

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
      lang === "ar" ? "تأكيد الشراء" : "Confirm Purchase",
      lang === "ar"
        ? `هل تريد شراء ${item.ar} بـ ${item.cost} نقطة؟`
        : `Buy ${item.en} for ${item.cost} points?`,
      [
        { text: lang === "ar" ? "إلغاء" : "Cancel", style: "cancel" },
        {
          text: lang === "ar" ? "اشترِ!" : "Buy!",
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
    <LinearGradient colors={["#0f0820", "#1e0a4a", "#2d1b69"]} style={{ flex: 1 }}>
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
              {lang === "ar" ? "🏆 غرفة الجوائز" : "🏆 Rewards Room"}
            </Text>
            <Text style={{ color: "#a78bfa", fontSize: 12, marginTop: 1 }}>
              {lang === "ar" ? `${earnedCount}/${allBadges.length} شارات` : `${earnedCount}/${allBadges.length} badges`}
            </Text>
          </View>
          {/* Points balance */}
          <View style={{ backgroundColor: "rgba(245,158,11,0.2)", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: "rgba(245,158,11,0.4)", alignItems: "center" }}>
            <Text style={{ color: "#FDE68A", fontWeight: "900", fontSize: 18 }}>⭐ {pts}</Text>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 9 }}>
              {lang === "ar" ? "نقاطك" : "your pts"}
            </Text>
          </View>
        </View>

        {/* Today's points pill */}
        {todayPts > 0 && (
          <View style={{ marginHorizontal: 18, marginBottom: 10 }}>
            <View style={{ backgroundColor: "rgba(16,185,129,0.2)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "rgba(16,185,129,0.4)" }}>
              <Text style={{ fontSize: 18 }}>🌟</Text>
              <Text style={{ color: "#6ee7b7", fontWeight: "700", fontSize: 13 }}>
                {lang === "ar" ? `+${todayPts} نقطة اليوم!` : `+${todayPts} points today!`}
              </Text>
            </View>
          </View>
        )}

        {/* Streak bonus */}
        {progress.streak >= 3 && (
          <View style={{ marginHorizontal: 18, marginBottom: 10 }}>
            <StreakBonus streak={progress.streak} lang={lang} />
          </View>
        )}

        {/* Progress bar */}
        <View style={{ marginHorizontal: 18, marginBottom: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ color: "#a78bfa", fontSize: 11, fontWeight: "700" }}>
              {lang === "ar" ? "الشارات المكتسبة" : "Badges earned"}
            </Text>
            <Text style={{ color: "#FDE68A", fontSize: 11, fontWeight: "800" }}>
              {earnedCount}/{allBadges.length}
            </Text>
          </View>
          <View style={{ height: 6, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
            <LinearGradient
              colors={["#F59E0B", "#FDE68A"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ width: `${(earnedCount / allBadges.length) * 100}%`, height: "100%", borderRadius: 3 }}
            />
          </View>
        </View>

        {/* Tab switcher */}
        <View style={{ flexDirection: "row", marginHorizontal: 18, marginBottom: 14, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 4 }}>
          {(["badges", "shop"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center",
                backgroundColor: tab === t ? "rgba(167,139,250,0.25)" : "transparent",
              }}
            >
              <Text style={{ color: tab === t ? "#FDE68A" : "rgba(255,255,255,0.5)", fontWeight: "800", fontSize: 14 }}>
                {t === "badges"
                  ? (lang === "ar" ? "🏅 الشارات" : "🏅 Badges")
                  : (lang === "ar" ? "🛒 المتجر" : "🛒 Shop")}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {tab === "badges" ? (
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
                return (
                  <BadgeCard
                    key={b.id}
                    earned={earned}
                    emoji={b.emoji}
                    name={badgeName(b, lang)}
                  />
                );
              })}
            </View>
          ) : (
            <>
              {/* Points earning guide */}
              <View style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}>
                <Text style={{ color: "#FDE68A", fontWeight: "800", fontSize: 13, marginBottom: 8 }}>
                  {lang === "ar" ? "كيف تكسب النقاط؟" : "How to earn points?"}
                </Text>
                {[
                  { emoji: "📚", en: "Homework help", ar: "مساعدة الواجب", pts: 10 },
                  { emoji: "🎓", en: "Complete lesson", ar: "إتمام درس", pts: 25 },
                  { emoji: "🎮", en: "Play a game", ar: "لعب لعبة", pts: 15 },
                  { emoji: "🌙", en: "Listen to story", ar: "استماع قصة", pts: 20 },
                  { emoji: "🔥", en: "3-day streak bonus", ar: "مكافأة ٣ أيام", pts: 50 },
                  { emoji: "🔥🔥", en: "7-day streak bonus", ar: "مكافأة ٧ أيام", pts: 150 },
                ].map((row, i) => (
                  <View key={i} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 4, gap: 8 }}>
                    <Text style={{ fontSize: 16 }}>{row.emoji}</Text>
                    <Text style={{ flex: 1, color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                      {lang === "ar" ? row.ar : row.en}
                    </Text>
                    <Text style={{ color: "#FDE68A", fontWeight: "800", fontSize: 13 }}>+{row.pts}</Text>
                  </View>
                ))}
              </View>

              {/* Shop items */}
              <Text style={{ color: "#a78bfa", fontWeight: "800", fontSize: 14, marginBottom: 10 }}>
                {lang === "ar" ? "🛒 تسوق بنقاطك" : "🛒 Spend your points"}
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
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
