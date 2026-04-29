import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { PLANS_USD, convertPrice } from "@/constants/countries";
import { registerUser, saveSessionToken } from "@/lib/auth";
import { useApp } from "@/contexts/AppContext";

type PlanKey = "free" | "monthly" | "biannual" | "yearly";

const BENEFITS_EN = [
  "Homework help in Math, English, Science and more",
  "Learns at your child's pace — adapts from age 4 to 14",
  "AI voice chat — your child speaks, their hero listens and teaches",
  "You control screen time and monitor progress",
  "Safe, ad-free, and built for children",
  "Costs less than one private tutoring session",
];

export default function Done() {
  const c = useColors();
  const router = useRouter();
  const { profile } = useApp();
  const params = useLocalSearchParams<{
    lang: "en" | "ar";
    hero: "boy" | "girl";
    parentEmail: string;
    password: string;
    parentName: string;
    country: string;
    currency: string;
    currencySymbol: string;
    currencyRate: string;
    name: string;
    age: string;
    dob: string;
  }>();

  const isAr = (params.lang ?? profile?.language) === "ar";
  const symbol = params.currencySymbol ?? "$";
  const rate = parseFloat(params.currencyRate ?? "1") || 1;
  const heroName = (params.hero ?? profile?.hero) === "girl" ? "Sara" : "Adam";
  const childName = params.name || profile?.childName || (isAr ? "طفلك" : "your child");

  const [loading, setLoading] = useState(false);

  async function handleStart(plan: PlanKey) {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setLoading(true);
    try {
      const email = params.parentEmail;
      const password = params.password;
      if (email && password) {
        const result = await registerUser({
          email,
          password,
          parentName: params.parentName ?? "",
          country: params.country ?? "US",
          currency: params.currency ?? "USD",
          language: params.lang ?? "en",
          childName: params.name ?? profile?.childName ?? "",
          childGender: (params.hero ?? profile?.hero ?? "boy") as "boy" | "girl",
          childDob: params.dob ?? "",
          characterChoice: (params.hero ?? profile?.hero ?? "boy") as "boy" | "girl",
          languagePreference: (params.lang ?? profile?.language ?? "en") as "en" | "ar",
        });
        if (result.sessionToken) {
          await saveSessionToken(result.sessionToken);
        }
      }
    } catch {
      // Non-fatal
    }
    setLoading(false);
    router.replace("/(tabs)/chat");
  }

  const planPrice = (key: "monthly" | "biannual" | "yearly") =>
    convertPrice(PLANS_USD[key].usd, rate, symbol);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 60, gap: 20 }}>

        {/* ── Section 1: Emotional Headline ───────────────────────────────── */}
        <LinearGradient
          colors={["#1A0F3F", "#2D1B69"]}
          style={{ borderRadius: 24, padding: 28, alignItems: "center", gap: 12 }}
        >
          <Text style={{ fontSize: 64 }}>🦸</Text>
          <Text style={{
            color: "#FFF", fontWeight: "900", fontSize: 24, textAlign: "center", lineHeight: 32,
          }}>
            {isAr
              ? `أعطِ ${childName} الرفيق التعليمي الأذكى 🦸`
              : `Give ${childName} the smartest learning companion 🦸`}
          </Text>
          <Text style={{
            color: "rgba(255,255,255,0.8)", fontSize: 14, textAlign: "center", lineHeight: 22,
          }}>
            {isAr
              ? "انضم إلى آلاف العائلات التي تساعد أطفالها على التعلم والنمو وحب المدرسة"
              : "Join thousands of families helping their children learn, grow, and love school"}
          </Text>
          <View style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 16, paddingHorizontal: 18, paddingVertical: 8, marginTop: 4,
          }}>
            <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 14 }}>
              {isAr ? `${heroName} جاهز لمساعدة ${childName}! 🚀` : `${heroName} is ready to help ${childName}! 🚀`}
            </Text>
          </View>
        </LinearGradient>

        {/* ── Section 2: 6 Key Benefits ───────────────────────────────────── */}
        <View style={{ backgroundColor: c.card, borderRadius: 20, padding: 20, gap: 12 }}>
          <Text style={{ fontWeight: "900", fontSize: 18, color: c.text, textAlign: isAr ? "right" : "left" }}>
            {isAr ? "ماذا يحصل طفلك؟" : "What your child gets:"}
          </Text>
          {BENEFITS_EN.map((b, i) => (
            <View key={i} style={{
              flexDirection: isAr ? "row-reverse" : "row",
              alignItems: "flex-start", gap: 12,
            }}>
              <View style={{
                width: 24, height: 24, borderRadius: 12,
                backgroundColor: "#10B981", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: 1,
              }}>
                <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 13 }}>✓</Text>
              </View>
              <Text style={{
                flex: 1, color: c.text, fontSize: 14, lineHeight: 22,
                textAlign: isAr ? "right" : "left",
              }}>{b}</Text>
            </View>
          ))}
        </View>

        {/* ── Section 3: Pricing Plans ─────────────────────────────────────── */}
        <Text style={{ fontWeight: "900", fontSize: 18, color: c.text, textAlign: isAr ? "right" : "left" }}>
          {isAr ? "اختر خطتك:" : "Choose your plan:"}
        </Text>

        {/* FREE TRIAL */}
        <View style={{
          backgroundColor: "#ECFDF5", borderRadius: 20, padding: 20,
          borderWidth: 2, borderColor: "#10B981", gap: 10,
        }}>
          <View style={{ flexDirection: isAr ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ gap: 2 }}>
              <Text style={{ fontWeight: "900", fontSize: 18, color: "#065F46" }}>
                {isAr ? "تجربة مجانية" : "Free Trial"}
              </Text>
              <Text style={{ color: "#059669", fontWeight: "700", fontSize: 13 }}>
                {isAr ? "٣ أيام · لا بطاقة مطلوبة" : "3 days · No credit card needed"}
              </Text>
            </View>
            <View style={{
              backgroundColor: "#10B981", borderRadius: 20,
              paddingHorizontal: 14, paddingVertical: 6,
            }}>
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 16 }}>
                {isAr ? "مجاني" : "FREE"}
              </Text>
            </View>
          </View>
          <Text style={{ color: "#065F46", fontSize: 12, lineHeight: 18, textAlign: isAr ? "right" : "left" }}>
            {isAr
              ? "كل المميزات مع حدود يومية — اكتشف التجربة كاملة"
              : "All features with daily limits — discover the full experience"}
          </Text>
          <Pressable
            onPress={() => handleStart("free")}
            disabled={loading}
            style={({ pressed }) => ({
              backgroundColor: "#10B981",
              borderRadius: 14, paddingVertical: 14, alignItems: "center",
              opacity: pressed || loading ? 0.85 : 1,
            })}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 16 }}>
                {isAr ? "ابدأ التجربة المجانية 🚀" : "Start Free Trial 🚀"}
              </Text>
            )}
          </Pressable>
        </View>

        {/* MONTHLY */}
        <View style={{
          backgroundColor: c.card, borderRadius: 20, padding: 20,
          borderWidth: 1, borderColor: c.border, gap: 10,
        }}>
          <View style={{ flexDirection: isAr ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ gap: 2 }}>
              <Text style={{ fontWeight: "800", fontSize: 17, color: c.text }}>
                {isAr ? "شهري" : "Monthly"}
              </Text>
              <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
                {isAr ? "وصول كامل غير محدود · إلغاء في أي وقت" : "Full unlimited access · Cancel anytime"}
              </Text>
            </View>
            <View style={{ alignItems: isAr ? "flex-start" : "flex-end" }}>
              <Text style={{ fontWeight: "900", fontSize: 22, color: c.text }}>{planPrice("monthly")}</Text>
              <Text style={{ color: c.mutedForeground, fontSize: 11 }}>{isAr ? "/شهر" : "/month"}</Text>
            </View>
          </View>
          <Pressable
            onPress={() => handleStart("monthly")}
            disabled={loading}
            style={({ pressed }) => ({
              backgroundColor: c.primary,
              borderRadius: 14, paddingVertical: 13, alignItems: "center",
              opacity: pressed || loading ? 0.85 : 1,
            })}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 15 }}>
                {isAr ? "اختر الشهري" : "Choose Monthly"}
              </Text>
            )}
          </Pressable>
        </View>

        {/* 6 MONTHS */}
        <LinearGradient
          colors={["#7C3AED", "#A78BFA"]}
          style={{ borderRadius: 20, padding: 20, gap: 10 }}
        >
          <View style={{ position: "absolute", top: -12, alignSelf: "center", zIndex: 1 }}>
            <View style={{
              backgroundColor: "#5B21B6", borderRadius: 20,
              paddingHorizontal: 14, paddingVertical: 4,
            }}>
              <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 12 }}>
                {isAr ? "🔥 وفّر ١٠٪" : "🔥 SAVE 10%"}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: isAr ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <View style={{ gap: 2 }}>
              <Text style={{ fontWeight: "800", fontSize: 17, color: "#FFF" }}>
                {isAr ? "٦ أشهر" : "6 Months"}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                {isAr ? "أفضل للمتعلمين الجادين" : "Best for committed learners"}
              </Text>
            </View>
            <View style={{ alignItems: isAr ? "flex-start" : "flex-end" }}>
              <Text style={{ fontWeight: "900", fontSize: 22, color: "#FFF" }}>{planPrice("biannual")}</Text>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>
                {isAr
                  ? `${convertPrice(PLANS_USD.biannual.usd / 6, rate, symbol)}/شهر`
                  : `${convertPrice(PLANS_USD.biannual.usd / 6, rate, symbol)}/mo`}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => handleStart("biannual")}
            disabled={loading}
            style={({ pressed }) => ({
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 14, paddingVertical: 13, alignItems: "center",
              borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)",
              opacity: pressed || loading ? 0.85 : 1,
            })}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 15 }}>
                {isAr ? "اختر ٦ أشهر" : "Choose 6 Months"}
              </Text>
            )}
          </Pressable>
        </LinearGradient>

        {/* YEARLY — Most Popular */}
        <LinearGradient
          colors={["#FF6B35", "#FFA76A"]}
          style={{ borderRadius: 20, padding: 20, gap: 10 }}
        >
          <View style={{ position: "absolute", top: -12, alignSelf: "center", zIndex: 1 }}>
            <View style={{
              backgroundColor: "#C2410C", borderRadius: 20,
              paddingHorizontal: 14, paddingVertical: 4,
            }}>
              <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 12 }}>
                {isAr ? "⭐ الأكثر شعبية · وفّر ٢١٪" : "⭐ MOST POPULAR · SAVE 21%"}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: isAr ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <View style={{ gap: 2 }}>
              <Text style={{ fontWeight: "800", fontSize: 17, color: "#FFF" }}>
                {isAr ? "سنوي" : "Yearly"}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 12 }}>
                {isAr ? "أفضل قيمة — ادفع مرة كل عام" : "Best value — pay once a year"}
              </Text>
            </View>
            <View style={{ alignItems: isAr ? "flex-start" : "flex-end" }}>
              <Text style={{ fontWeight: "900", fontSize: 22, color: "#FFF" }}>{planPrice("yearly")}</Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 11 }}>
                {isAr
                  ? `${convertPrice(PLANS_USD.yearly.usd / 12, rate, symbol)}/شهر`
                  : `${convertPrice(PLANS_USD.yearly.usd / 12, rate, symbol)}/mo`}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => handleStart("yearly")}
            disabled={loading}
            style={({ pressed }) => ({
              backgroundColor: "#FFF",
              borderRadius: 14, paddingVertical: 13, alignItems: "center",
              opacity: pressed || loading ? 0.85 : 1,
              shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
            })}
          >
            {loading ? <ActivityIndicator color="#FF6B35" /> : (
              <Text style={{ color: "#FF6B35", fontWeight: "900", fontSize: 15 }}>
                {isAr ? "اختر السنوي ⭐" : "Choose Yearly ⭐"}
              </Text>
            )}
          </Pressable>
        </LinearGradient>

        {/* Reassurance */}
        <Text style={{ color: c.mutedForeground, fontSize: 12, textAlign: "center", lineHeight: 20 }}>
          {isAr
            ? "لا رسوم خفية. إلغاء في أي وقت. بيانات طفلك آمنة وخاصة دائماً."
            : "No hidden fees. Cancel anytime. Your child's data is always safe and private."}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
