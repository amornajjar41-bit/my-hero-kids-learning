import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const adamImg  = require("@/assets/images/adam-boy.png");
const luluImg  = require("@/assets/images/lulu-girl.png");

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

export default function Welcome() {
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "ar">("en");
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 700, useNativeDriver: false }),
      Animated.timing(slideUp, { toValue: 0, duration: 700, useNativeDriver: false, easing: Easing.out(Easing.cubic) }),
    ]).start();
  }, [fadeIn, slideUp]);

  const isAr = lang === "ar";

  return (
    <LinearGradient colors={["#1e0a4a", "#3b1a8a", "#6d28d9", "#f97316"]} locations={[0, 0.35, 0.65, 1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>

        {/* Floating decorative badges */}
        <FloatBadge emoji="⭐" style={{ position: "absolute", top: 90, left: 20 }} />
        <FloatBadge emoji="🎓" style={{ position: "absolute", top: 140, right: 24 }} />
        <FloatBadge emoji="🚀" style={{ position: "absolute", top: 210, left: 50 }} />
        <FloatBadge emoji="💡" style={{ position: "absolute", top: 260, right: 60 }} />

        <Animated.View style={{ flex: 1, opacity: fadeIn, transform: [{ translateY: slideUp }] }}>

          {/* Header */}
          <View style={{ alignItems: "center", paddingTop: 16, paddingBottom: 8, paddingHorizontal: 24 }}>
            {/* App brand pill */}
            <View style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 30, paddingHorizontal: 18, paddingVertical: 8, marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" }}>
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 13, letterSpacing: 2 }}>MY HERO</Text>
            </View>

            <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 30, textAlign: "center", lineHeight: 36 }}>
              {isAr ? "مرحباً بك في عالم المعرفة! 🌟" : "Welcome to My Hero! 🌟"}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
              {isAr
                ? "رفيقك الذكي للتعلم، القصص، والإبداع"
                : "Your child's smart companion for learning, stories & fun"}
            </Text>
          </View>

          {/* Characters showcase */}
          <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 14, marginTop: 10, marginBottom: 12 }}>
            {/* Adam card */}
            <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 24, padding: 16, alignItems: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)" }}>
              <Image source={adamImg} style={{ width: 100, height: 100 }} resizeMode="contain" />
              <View style={{ backgroundColor: "#3b82f6", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 5, marginTop: 8 }}>
                <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 16 }}>Adam</Text>
              </View>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, textAlign: "center", marginTop: 6, lineHeight: 15 }}>
                {isAr ? "البطل الذكي 🦸‍♂️" : "The Smart Hero 🦸‍♂️"}
              </Text>
            </View>

            {/* Lulu card */}
            <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 24, padding: 16, alignItems: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)" }}>
              <Image source={luluImg} style={{ width: 100, height: 100 }} resizeMode="contain" />
              <View style={{ backgroundColor: "#ec4899", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 5, marginTop: 8 }}>
                <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 16 }}>Lulu</Text>
              </View>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, textAlign: "center", marginTop: 6, lineHeight: 15 }}>
                {isAr ? "البطلة المبدعة 🦸‍♀️" : "The Creative Hero 🦸‍♀️"}
              </Text>
            </View>
          </View>

          {/* Feature pills */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 20, justifyContent: "center", marginBottom: 14 }}>
            {[
              { emoji: "📚", en: "Homework Help", ar: "مساعدة الواجب" },
              { emoji: "🌙", en: "Bedtime Stories", ar: "قصص الليل" },
              { emoji: "🎮", en: "Fun Games", ar: "ألعاب ممتعة" },
              { emoji: "🗣️", en: "Voice Chat", ar: "محادثة صوتية" },
            ].map((f) => (
              <View key={f.en} style={{ backgroundColor: "rgba(255,255,255,0.14)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, flexDirection: "row", gap: 5, alignItems: "center" }}>
                <Text style={{ fontSize: 14 }}>{f.emoji}</Text>
                <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700" }}>{isAr ? f.ar : f.en}</Text>
              </View>
            ))}
          </View>

          {/* Bottom section */}
          <View style={{ gap: 12, paddingHorizontal: 24, paddingBottom: 20 }}>
            {/* Language label */}
            <Text style={{ color: "rgba(255,255,255,0.75)", textAlign: "center", fontWeight: "700", fontSize: 13 }}>
              {isAr ? "اختر اللغة / Choose language" : "Choose your language / اختر اللغة"}
            </Text>

            {/* Language picker */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              {(["en", "ar"] as const).map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => setLang(opt)}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 18,
                    borderRadius: 20,
                    backgroundColor: lang === opt ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.15)",
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: lang === opt ? "#FFF" : "rgba(255,255,255,0.25)",
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ fontSize: 32 }}>{opt === "en" ? "🇬🇧" : "🇸🇦"}</Text>
                  <Text style={{ marginTop: 6, fontWeight: "800", fontSize: 15, color: lang === opt ? "#6d28d9" : "#FFF" }}>
                    {opt === "en" ? "English" : "العربية"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* CTA button */}
            <Pressable
              onPress={() => router.push({ pathname: "/onboarding/hero", params: { lang } })}
              style={({ pressed }) => ({
                backgroundColor: "#f97316",
                borderRadius: 20,
                paddingVertical: 18,
                alignItems: "center",
                opacity: pressed ? 0.88 : 1,
                shadowColor: "#f97316", shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 8,
              })}
            >
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 18 }}>
                {isAr ? "🚀 ابدأ المغامرة!" : "🚀 Start the Adventure!"}
              </Text>
            </Pressable>

            {/* Trust line */}
            <Text style={{ color: "rgba(255,255,255,0.5)", textAlign: "center", fontSize: 11 }}>
              {isAr ? "🔒 آمن للأطفال · ٣ أيام مجانية · بدون إعلانات" : "🔒 Child-safe · 3-day free trial · Ad-free"}
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}
