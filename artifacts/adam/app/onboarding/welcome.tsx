import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, ScrollView, Text, View } from "react-native";
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

const WHY_HERO_POINTS = [
  {
    emoji: "🧠",
    en: "AI-powered learning",
    ar: "تعلّم مدعوم بالذكاء الاصطناعي",
    descEn: "Adam & Lulu adapt to your child's level and pace — no two sessions are the same.",
    descAr: "يتكيّف آدم ولولو مع مستوى طفلك وإيقاعه — كل جلسة مختلفة.",
  },
  {
    emoji: "🇬🇧🇸🇦",
    en: "Bilingual English & Arabic",
    ar: "ثنائي اللغة: إنجليزي وعربي",
    descEn: "Full support for both languages — your child learns and speaks in whichever they choose.",
    descAr: "دعم كامل للغتين — يتعلم طفلك ويتحدث بالتي يختارها.",
  },
  {
    emoji: "📚",
    en: "Real homework help",
    ar: "مساعدة حقيقية في الواجبات",
    descEn: "Explains maths, science, reading and more — in ways kids actually understand.",
    descAr: "يشرح الرياضيات والعلوم والقراءة وأكثر — بأسلوب يفهمه الأطفال فعلاً.",
  },
  {
    emoji: "🌙",
    en: "Bedtime stories with voice",
    ar: "قصص ليلية بصوت حيّ",
    descEn: "New, unique stories every night — narrated with a warm, soothing AI voice.",
    descAr: "قصص جديدة وفريدة كل ليلة — يرويها صوت ذكاء اصطناعي دافئ ومريح.",
  },
  {
    emoji: "🎮",
    en: "4 educational games",
    ar: "٤ ألعاب تعليمية",
    descEn: "Spelling, maths, memory & Arabic vocabulary — learning disguised as play.",
    descAr: "إملاء، رياضيات، ذاكرة، ومفردات عربية — تعلّم في قالب لعبة.",
  },
  {
    emoji: "🗣️",
    en: "Push-to-talk voice chat",
    ar: "محادثة صوتية بضغطة زر",
    descEn: "Your child can speak instead of type — making it natural for all ages.",
    descAr: "طفلك يتكلم بدل ما يكتب — طبيعي لكل الأعمار.",
  },
  {
    emoji: "📊",
    en: "Parent dashboard",
    ar: "لوحة متابعة للوالدين",
    descEn: "See what your child learned, how long they studied, and weekly progress reports.",
    descAr: "اطّلع على ما تعلّمه طفلك، ومدة دراسته، وتقارير التقدم الأسبوعية.",
  },
  {
    emoji: "🔒",
    en: "Safe & ad-free — always",
    ar: "آمن وبدون إعلانات — دائماً",
    descEn: "No ads, no external links, no inappropriate content. Built for children, trusted by parents.",
    descAr: "لا إعلانات، لا روابط خارجية، لا محتوى غير لائق. صُنع للأطفال، يثق به الوالدون.",
  },
];

export default function Welcome() {
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "ar">("en");
  const fadeIn  = useRef(new Animated.Value(0)).current;
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

        {/* Floating decorative badges (absolute, non-scrolling) */}
        <FloatBadge emoji="⭐" style={{ position: "absolute", top: 90,  left: 20 }} />
        <FloatBadge emoji="🎓" style={{ position: "absolute", top: 140, right: 24 }} />
        <FloatBadge emoji="🚀" style={{ position: "absolute", top: 210, left: 50 }} />
        <FloatBadge emoji="💡" style={{ position: "absolute", top: 260, right: 60 }} />

        {/* Animated fade-in wrapper */}
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
                {isAr ? "مرحباً بك في عالم المعرفة! 🌟" : "Welcome to My Hero! 🌟"}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
                {isAr
                  ? "رفيقك الذكي للتعلم، القصص، والإبداع"
                  : "Your child's smart companion for learning, stories & fun"}
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
                  {isAr ? "البطل الذكي 🦸‍♂️" : "The Smart Hero 🦸‍♂️"}
                </Text>
              </View>
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

            {/* ── Feature pills ────────────────────────────────────────── */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 20, justifyContent: "center", marginBottom: 16 }}>
              {[
                { emoji: "📚", en: "Homework Help",    ar: "مساعدة الواجب" },
                { emoji: "🌙", en: "Bedtime Stories",  ar: "قصص الليل" },
                { emoji: "🎮", en: "Fun Games",        ar: "ألعاب ممتعة" },
                { emoji: "🗣️", en: "Voice Chat",      ar: "محادثة صوتية" },
              ].map((f) => (
                <View key={f.en} style={{ backgroundColor: "rgba(255,255,255,0.14)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, flexDirection: "row", gap: 5, alignItems: "center" }}>
                  <Text style={{ fontSize: 14 }}>{f.emoji}</Text>
                  <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700" }}>{isAr ? f.ar : f.en}</Text>
                </View>
              ))}
            </View>

            {/* ── Language picker + CTA ─────────────────────────────────── */}
            <View style={{ gap: 12, paddingHorizontal: 24 }}>
              <Text style={{ color: "rgba(255,255,255,0.75)", textAlign: "center", fontWeight: "700", fontSize: 13 }}>
                {isAr ? "اختر اللغة / Choose language" : "Choose your language / اختر اللغة"}
              </Text>

              <View style={{ flexDirection: "row", gap: 12 }}>
                {(["en", "ar"] as const).map((opt) => (
                  <Pressable
                    key={opt}
                    onPress={() => setLang(opt)}
                    style={({ pressed }) => ({
                      flex: 1, paddingVertical: 18, borderRadius: 20,
                      backgroundColor: lang === opt ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.15)",
                      alignItems: "center", borderWidth: 2,
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

              <Pressable
                onPress={() => router.push({ pathname: "/onboarding/hero", params: { lang } })}
                style={({ pressed }) => ({
                  backgroundColor: "#f97316", borderRadius: 20, paddingVertical: 18,
                  alignItems: "center", opacity: pressed ? 0.88 : 1,
                  shadowColor: "#f97316", shadowOpacity: 0.5, shadowRadius: 14,
                  shadowOffset: { width: 0, height: 4 }, elevation: 8,
                })}
              >
                <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 18 }}>
                  {isAr ? "🚀 ابدأ المغامرة!" : "🚀 Start the Adventure!"}
                </Text>
              </Pressable>
            </View>

            {/* ── Why My Hero — parent section ─────────────────────────── */}
            <View style={{ marginHorizontal: 24, marginTop: 28 }}>
              {/* Section header */}
              <View style={{ backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 20, padding: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", marginBottom: 12 }}>
                <Text style={{ color: "#FDE68A", fontWeight: "900", fontSize: 18, marginBottom: 4, textAlign: isAr ? "right" : "left" }}>
                  {isAr ? "💌 لماذا My Hero؟" : "💌 Why My Hero?"}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 21, textAlign: isAr ? "right" : "left" }}>
                  {isAr
                    ? "في عالم تملؤه الشاشات، يحتاج طفلك رفيقاً يعلّمه ويحمي عقله ومستقبله. My Hero ليس مجرد تطبيق — بل هو مدرّس ذكي، حارس أمين، وصديق لا يكلّ."
                    : "In a world full of screens, your child needs a companion that genuinely teaches, protects, and grows with them. My Hero isn't just an app — it's a smart tutor, a trusted guardian, and a tireless friend."}
                </Text>
              </View>

              {/* Bullet points */}
              <View style={{ gap: 10 }}>
                {WHY_HERO_POINTS.map((p, i) => (
                  <View
                    key={i}
                    style={{
                      backgroundColor: "rgba(255,255,255,0.08)",
                      borderRadius: 16, padding: 14,
                      borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
                      flexDirection: isAr ? "row-reverse" : "row",
                      gap: 12, alignItems: "flex-start",
                    }}
                  >
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Text style={{ fontSize: 22 }}>{p.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 14, marginBottom: 3, textAlign: isAr ? "right" : "left" }}>
                        {isAr ? p.ar : p.en}
                      </Text>
                      <Text style={{ color: "rgba(255,255,255,0.72)", fontSize: 12, lineHeight: 18, textAlign: isAr ? "right" : "left" }}>
                        {isAr ? p.descAr : p.descEn}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Trial + trust */}
              <View style={{ backgroundColor: "rgba(249,115,22,0.25)", borderRadius: 16, padding: 16, marginTop: 14, borderWidth: 1, borderColor: "rgba(249,115,22,0.4)" }}>
                <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 15, textAlign: "center", marginBottom: 4 }}>
                  {isAr ? "🎁 جرّب ٣ أيام مجاناً — بدون بطاقة بنكية" : "🎁 Try free for 3 days — no credit card needed"}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, textAlign: "center", lineHeight: 18 }}>
                  {isAr
                    ? "بعدها: $19.99 شهرياً أو $189 سنوياً (وفّر %21)"
                    : "Then $19.99/month or $189/year (save 21%)"}
                </Text>
              </View>

              {/* Trust line */}
              <Text style={{ color: "rgba(255,255,255,0.45)", textAlign: "center", fontSize: 11, marginTop: 14, lineHeight: 17 }}>
                {isAr
                  ? "🔒 آمن للأطفال · بدون إعلانات · بدون روابط خارجية · محتوى مناسب للعمر"
                  : "🔒 Child-safe · Ad-free · No external links · Age-appropriate content"}
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}
