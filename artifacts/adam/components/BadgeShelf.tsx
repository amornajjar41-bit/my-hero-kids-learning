import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, ScrollView, Text, View } from "react-native";

import { allBadges, badgeName } from "@/constants/badges";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";

// Sparkling star animation for earned badges
function SparkBadge({ earned, emoji, name }: { earned: boolean; emoji: string; name: string }) {
  const glow   = useRef(new Animated.Value(0.7)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!earned) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1200, useNativeDriver: false, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(glow, { toValue: 0.7, duration: 1200, useNativeDriver: false, easing: Easing.inOut(Easing.sin) }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotate, { toValue: 1,  duration: 1600, useNativeDriver: false, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(rotate, { toValue: -1, duration: 1600, useNativeDriver: false, easing: Easing.inOut(Easing.sin) }),
      ]),
    ).start();
    Animated.spring(scale, { toValue: 1, useNativeDriver: false, tension: 60, friction: 5 }).start();
  }, [earned, glow, rotate, scale]);

  const deg = rotate.interpolate({ inputRange: [-1, 1], outputRange: ["-8deg", "8deg"] });

  return (
    <View style={{ alignItems: "center", width: 88 }}>
      <Animated.View
        style={{
          transform: [{ rotate: earned ? deg : "0deg" }, { scale }],
          shadowColor: earned ? "#FFD700" : "#000",
          shadowOpacity: earned ? 0.6 : 0,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: earned ? 10 : 0,
        }}
      >
        <LinearGradient
          colors={earned ? ["#FEF3C7", "#FDE68A", "#F59E0B"] : ["#374151", "#1F2937"]}
          style={{
            width: 72, height: 80, borderRadius: 20,
            alignItems: "center", justifyContent: "center",
            borderWidth: 2, borderColor: earned ? "#FCD34D" : "#374151",
          }}
        >
          {earned ? (
            <>
              <Text style={{ fontSize: 36 }}>{emoji}</Text>
              <Animated.Text style={{ position: "absolute", top: 4, right: 6, fontSize: 10, opacity: glow }}>✨</Animated.Text>
              <Animated.Text style={{ position: "absolute", bottom: 4, left: 6, fontSize: 8, opacity: glow }}>⭐</Animated.Text>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 30, opacity: 0.3 }}>{emoji}</Text>
              <Text style={{ position: "absolute", fontSize: 20 }}>🔒</Text>
            </>
          )}
        </LinearGradient>
      </Animated.View>

      <Text
        numberOfLines={2}
        style={{
          fontSize: 10, color: earned ? "#FDE68A" : "#6B7280",
          textAlign: "center", marginTop: 7,
          fontWeight: earned ? "800" : "500", lineHeight: 13,
        }}
      >
        {name}
      </Text>
      {earned && (
        <View style={{ backgroundColor: "#10B981", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginTop: 3 }}>
          <Text style={{ color: "#FFF", fontSize: 9, fontWeight: "800" }}>EARNED ✓</Text>
        </View>
      )}
    </View>
  );
}

export function BadgeShelf() {
  const { progress } = useApp();
  const router = useRouter();

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

  return (
    <LinearGradient colors={["#1e1040", "#2d1b69", "#1e1040"]} style={{ borderRadius: 24, overflow: "hidden" }}>
      {/* Header */}
      <Pressable
        onPress={() => router.push("/rewards")}
        style={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 4, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
      >
        <View>
          <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 18 }}>
            🏆 Trophy Room
          </Text>
          <Text style={{ color: "#a78bfa", fontSize: 12, marginTop: 2 }}>
            {earnedCount} of {allBadges.length} trophies earned
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <View style={{ backgroundColor: "rgba(167,139,250,0.2)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#a78bfa" }}>
            <Text style={{ color: "#FDE68A", fontWeight: "900", fontSize: 16 }}>
              ⭐ {pts}
            </Text>
          </View>
          {todayPts > 0 && (
            <Text style={{ color: "#6ee7b7", fontSize: 10, fontWeight: "700" }}>
              +{todayPts} today
            </Text>
          )}
        </View>
      </Pressable>

      {/* Progress bar */}
      <View style={{ marginHorizontal: 18, marginBottom: 8 }}>
        <View style={{ height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
          <LinearGradient
            colors={["#F59E0B", "#FDE68A"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ width: `${(earnedCount / allBadges.length) * 100}%`, height: "100%", borderRadius: 2 }}
          />
        </View>
      </View>

      {/* Stars background dots */}
      {[...Array(8)].map((_, i) => (
        <View
          key={i}
          style={{
            position: "absolute", width: 2, height: 2, borderRadius: 1,
            backgroundColor: "#FFF", opacity: 0.3,
            top: `${[10, 20, 60, 80, 15, 45, 70, 35][i]}%`,
            left: `${[5, 92, 15, 88, 50, 25, 75, 60][i]}%`,
          }}
        />
      ))}

      {/* Badge row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 18, paddingTop: 6, gap: 12 }}
      >
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
            <SparkBadge key={b.id} earned={earned} emoji={b.emoji} name={badgeName(b)} />
          );
        })}
      </ScrollView>

      {/* View all CTA */}
      <Pressable
        onPress={() => router.push("/rewards")}
        style={({ pressed }) => ({
          marginHorizontal: 16, marginBottom: 14, padding: 10, borderRadius: 14,
          backgroundColor: "rgba(167,139,250,0.15)", alignItems: "center",
          borderWidth: 1, borderColor: "rgba(167,139,250,0.3)",
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ color: "#a78bfa", fontWeight: "800", fontSize: 13 }}>
          🛒 View Rewards & Shop
        </Text>
      </Pressable>

      {earnedCount === 0 && (
        <View style={{ paddingBottom: 8, alignItems: "center" }}>
          <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
            Complete lessons & games to unlock trophies! 🚀
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}
