import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useEffect } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useApp } from "@/contexts/AppContext";
import { useT } from "@/hooks/useT";
import { curriculum } from "@/constants/curriculum";
import { AdamCharacter } from "@/components/AdamCharacter";

function FloatingStar({ style }: { style: any }) {
  const a = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 1800 + Math.random() * 1400, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.1, duration: 1800 + Math.random() * 1400, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(y, { toValue: -6, duration: 2200 + Math.random() * 1000, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 2200 + Math.random() * 1000, useNativeDriver: true }),
    ])).start();
  }, [a, y]);
  return (
    <Animated.Text style={[style, { opacity: a, transform: [{ translateY: y }] }]}>✦</Animated.Text>
  );
}

const STARS = [
  { top: 35, left: 18, fontSize: 10, color: "#FDE68A" },
  { top: 70, right: 25, fontSize: 7, color: "#a78bfa" },
  { top: 130, left: 55, fontSize: 12, color: "#6ee7b7" },
  { top: 190, right: 70, fontSize: 8, color: "#FDE68A" },
  { top: 260, left: 12, fontSize: 9, color: "#a78bfa" },
  { top: 320, right: 20, fontSize: 11, color: "#FDE68A" },
  { top: 420, left: 80, fontSize: 8, color: "#6ee7b7" },
  { top: 500, right: 40, fontSize: 10, color: "#a78bfa" },
];

export default function LearnTab() {
  const router = useRouter();
  const t = useT();
  const { progress, profile } = useApp();

  const enDone = progress.englishLessons;
  const enTotal = curriculum.english.length;

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#0D0826", "#1A1045", "#0F2D4A"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {/* Ambient glows */}
      <View style={{ position: "absolute", top: -50, left: -30, width: 220, height: 220, borderRadius: 110, backgroundColor: "#3B82F6", opacity: 0.08 }} />
      <View style={{ position: "absolute", top: 200, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: "#8B5CF6", opacity: 0.07 }} />
      <View style={{ position: "absolute", bottom: 100, left: -20, width: 160, height: 160, borderRadius: 80, backgroundColor: "#10B981", opacity: 0.06 }} />

      {/* Floating stars */}
      {STARS.map((s, i) => (
        <FloatingStar
          key={i}
          style={{
            position: "absolute",
            top: s.top,
            left: (s as any).left,
            right: (s as any).right,
            fontSize: s.fontSize,
            color: s.color,
          }}
        />
      ))}

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={{ padding: 18, gap: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 28, fontWeight: "900", color: "#FFF" }}>
                📚 {t("startLearning")}
              </Text>
              <Text style={{ color: "rgba(167,139,250,0.8)", fontSize: 14, marginTop: 2 }}>
                Choose a subject to start learning
              </Text>
            </View>
            <AdamCharacter hero={profile?.hero} size={80} bobbing pose="excited" />
          </View>

          {/* English */}
          <Pressable onPress={() => router.push("/learn/english")} style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
            <LinearGradient
              colors={["#1D4ED8", "#3B82F6"]}
              style={{ borderRadius: 24, padding: 22, overflow: "hidden" }}
            >
              <View style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.07)" }} />
              <Text style={{ fontSize: 48 }}>🇬🇧</Text>
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 22, marginTop: 10 }}>
                {t("learnEnglish")}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", marginTop: 4, fontSize: 13 }}>
                {enDone} / {enTotal} lessons • 3 units
              </Text>
              <View style={{ marginTop: 14, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 7 }}>
                <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 13 }}>▶ Start Learning</Text>
              </View>
            </LinearGradient>
          </Pressable>

          {/* Colors */}
          <Pressable onPress={() => router.push("/learn/english")} style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
            <LinearGradient
              colors={["#DC2626", "#F97316"]}
              style={{ borderRadius: 24, padding: 22, overflow: "hidden" }}
            >
              <View style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.07)" }} />
              <Text style={{ fontSize: 48 }}>🎨</Text>
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 22, marginTop: 10 }}>Colors</Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", marginTop: 4, fontSize: 13 }}>
                Learn colors with fun activities
              </Text>
              <View style={{ marginTop: 14, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 7 }}>
                <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 13 }}>▶ Explore</Text>
              </View>
            </LinearGradient>
          </Pressable>

          {/* Picture Dictionary */}
          <Pressable onPress={() => router.push("/learn/dictionary")} style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
            <LinearGradient
              colors={["#7C3AED", "#A855F7"]}
              style={{ borderRadius: 24, padding: 22, overflow: "hidden" }}
            >
              <View style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.07)" }} />
              <Text style={{ fontSize: 48 }}>📖</Text>
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 22, marginTop: 10 }}>
                {t("pictureDictionary")}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", marginTop: 4, fontSize: 13 }}>
                {t("tapToHear")}
              </Text>
              <View style={{ marginTop: 14, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 7 }}>
                <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 13 }}>▶ Open Dictionary</Text>
              </View>
            </LinearGradient>
          </Pressable>

          {/* Bedtime Stories */}
          <Pressable onPress={() => router.push("/stories" as any)} style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
            <LinearGradient
              colors={["#1E1B4B", "#4338CA"]}
              style={{ borderRadius: 24, padding: 22, overflow: "hidden" }}
            >
              <View style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.07)" }} />
              <Text style={{ fontSize: 48 }}>🌙</Text>
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 22, marginTop: 10 }}>Bedtime Stories</Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", marginTop: 4, fontSize: 13 }}>
                10 stories with audio • tap to listen
              </Text>
              <View style={{ marginTop: 14, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 7 }}>
                <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 13 }}>▶ Listen Now</Text>
              </View>
            </LinearGradient>
          </Pressable>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
