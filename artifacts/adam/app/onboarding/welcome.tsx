import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const adamImg  = require("@/assets/images/adam-boy.png");
const saraImg  = require("@/assets/images/lulu-girl.png");

function FloatBadge({ emoji, style }: { emoji: string; style?: any }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: -10, duration: 1800 + Math.random() * 600, useNativeDriver: false, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(y, { toValue:   0, duration: 1800 + Math.random() * 600, useNativeDriver: false, easing: Easing.inOut(Easing.sin) }),
      ]),
    ).start();
  }, [y]);
  return (
    <Animated.View style={[{ transform: [{ translateY: y }] }, style]}>
      <Text style={{ fontSize: 28 }}>{emoji}</Text>
    </Animated.View>
  );
}

const WHY_HERO_POINTS = [
  {
    emoji: "🧠",
    text: "AI-powered learning",
    desc: "Your heroes adapt to your child's level and pace — no two sessions are the same.",
  },
  {
    emoji: "📚",
    text: "Real homework help",
    desc: "Explains maths, science, reading and more — in ways kids actually understand.",
  },
  {
    emoji: "🌙",
    text: "Bedtime stories with voice",
    desc: "New, unique stories every night — narrated with a warm, soothing AI voice.",
  },
  {
    emoji: "🎮",
    text: "4 educational games",
    desc: "Spelling, maths, memory & vocabulary — learning disguised as play.",
  },
  {
    emoji: "🗣️",
    text: "Push-to-talk voice chat",
    desc: "Your child can speak instead of type — making it natural for all ages.",
  },
  {
    emoji: "📊",
    text: "Parent dashboard",
    desc: "See what your child learned, how long they studied, and weekly progress reports.",
  },
  {
    emoji: "🔒",
    text: "Safe & ad-free — always",
    desc: "No ads, no external links, no inappropriate content. Built for children, trusted by parents.",
  },
];

export default function Welcome() {
  const router = useRouter();
  const fadeIn  = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 700, useNativeDriver: false }),
      Animated.timing(slideUp, { toValue: 0, duration: 700, useNativeDriver: false, easing: Easing.out(Easing.cubic) }),
    ]).start();
  }, [fadeIn, slideUp]);

  return (
    <LinearGradient colors={["#1e0a4a", "#3b1a8a", "#6d28d9", "#f97316"]} locations={[0, 0.35, 0.65, 1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>

        <FloatBadge emoji="⭐" style={{ position: "absolute", top: 90,  left: 20 }} />
        <FloatBadge emoji="🎓" style={{ position: "absolute", top: 140, right: 24 }} />
        <FloatBadge emoji="🚀" style={{ position: "absolute", top: 210, left: 50 }} />
        <FloatBadge emoji="💡" style={{ position: "absolute", top: 260, right: 60 }} />

        <Animated.View style={{ flex: 1, opacity: fadeIn, transform: [{ translateY: slideUp }] }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            bounces
          >
            {/* ── Header ───────────────────────────────────────────────── */}
            <View style={{ alignItems: "center", paddingTop: 16, paddingBottom: 8, paddingHorizontal: 24 }}>
              <View style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 30, paddingHorizontal: 18, paddingVertical: 8, marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" }}>
                <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 13, letterSpacing: 2 }}>MY HERO</Text>
              </View>
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 30, textAlign: "center", lineHeight: 36 }}>
                Welcome to My Hero! 🌟
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
                Your child's smart companion for learning, stories & fun
              </Text>
            </View>

            {/* ── Characters ───────────────────────────────────────────── */}
            <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 14, marginTop: 10, marginBottom: 12 }}>
              <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 24, padding: 16, alignItems: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)" }}>
                <Image source={adamImg} style={{ width: 100, height: 100 }} resizeMode="contain" />
                <View style={{ backgroundColor: "#3b82f6", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 5, marginTop: 8 }}>
                  <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 16 }}>Adam</Text>
                </View>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, textAlign: "center", marginTop: 6, lineHeight: 15 }}>
                  The Smart Hero 🦸‍♂️
                </Text>
              </View>
              <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 24, padding: 16, alignItems: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)" }}>
                <Image source={saraImg} style={{ width: 100, height: 100 }} resizeMode="contain" />
                <View style={{ backgroundColor: "#ec4899", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 5, marginTop: 8 }}>
                  <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 16 }}>Sara</Text>
                </View>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, textAlign: "center", marginTop: 6, lineHeight: 15 }}>
                  The Creative Hero 🦸‍♀️
                </Text>
              </View>
            </View>

            {/* ── Feature pills ────────────────────────────────────────── */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 20, justifyContent: "center", marginBottom: 16 }}>
              {[
                { emoji: "📚", label: "Homework Help" },
                { emoji: "🌙", label: "Bedtime Stories" },
                { emoji: "🎮", label: "Fun Games" },
                { emoji: "🗣️", label: "Voice Chat" },
              ].map((f) => (
                <View key={f.label} style={{ backgroundColor: "rgba(255,255,255,0.14)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, flexDirection: "row", gap: 5, alignItems: "center" }}>
                  <Text style={{ fontSize: 14 }}>{f.emoji}</Text>
                  <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700" }}>{f.label}</Text>
                </View>
              ))}
            </View>

            {/* ── CTA ─────────────────────────────────────────────────── */}
            <View style={{ paddingHorizontal: 24 }}>
              <Pressable
                onPress={() => router.push({ pathname: "/onboarding/hero", params: { lang: "en" } })}
                style={({ pressed }) => ({
                  backgroundColor: "#f97316", borderRadius: 20, paddingVertical: 18,
                  alignItems: "center", opacity: pressed ? 0.88 : 1,
                  shadowColor: "#f97316", shadowOpacity: 0.5, shadowRadius: 14,
                  shadowOffset: { width: 0, height: 4 }, elevation: 8,
                })}
              >
                <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 18 }}>
                  🚀 Start the Adventure!
                </Text>
              </Pressable>
            </View>

            {/* ── Why My Hero — parent section ─────────────────────────── */}
            <View style={{ marginHorizontal: 24, marginTop: 28 }}>
              <View style={{ backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 20, padding: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", marginBottom: 12 }}>
                <Text style={{ color: "#FDE68A", fontWeight: "900", fontSize: 18, marginBottom: 4 }}>
                  💌 Why My Hero?
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 21 }}>
                  In a world full of screens, your child needs a companion that genuinely teaches, protects, and grows with them. My Hero isn't just an app — it's a smart tutor, a trusted guardian, and a tireless friend.
                </Text>
              </View>

              <View style={{ gap: 10 }}>
                {WHY_HERO_POINTS.map((p, i) => (
                  <View
                    key={i}
                    style={{
                      backgroundColor: "rgba(255,255,255,0.08)",
                      borderRadius: 16, padding: 14,
                      borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
                      flexDirection: "row",
                      gap: 12, alignItems: "flex-start",
                    }}
                  >
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Text style={{ fontSize: 22 }}>{p.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 14, marginBottom: 3 }}>
                        {p.text}
                      </Text>
                      <Text style={{ color: "rgba(255,255,255,0.72)", fontSize: 12, lineHeight: 18 }}>
                        {p.desc}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={{ backgroundColor: "rgba(249,115,22,0.25)", borderRadius: 16, padding: 16, marginTop: 14, borderWidth: 1, borderColor: "rgba(249,115,22,0.4)" }}>
                <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 15, textAlign: "center" }}>
                  🎁 Try free for 7 days — no credit card needed
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <View style={{ backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, flexDirection: "row", gap: 4, alignItems: "center" }}>
                  <Text style={{ fontSize: 14 }}>👨‍👩‍👧</Text>
                  <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700" }}>2,400+ happy families</Text>
                </View>
                <View style={{ backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, flexDirection: "row", gap: 4, alignItems: "center" }}>
                  <Text style={{ fontSize: 14 }}>⭐</Text>
                  <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700" }}>4.9 / 5</Text>
                </View>
              </View>

              <Text style={{ color: "rgba(255,255,255,0.45)", textAlign: "center", fontSize: 11, marginTop: 14, lineHeight: 17 }}>
                🔒 Child-safe · Ad-free · No external links · Age-appropriate content
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}
