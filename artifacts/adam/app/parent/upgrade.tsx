import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SoftCard } from "@/components/SoftCard";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useLang } from "@/hooks/useT";
import { PLANS_USD, convertPrice } from "@/constants/countries";

const BENEFITS_EN = [
  "Unlimited homework help 📚",
  "Voice chat with your hero 🎤",
  "Photo homework upload 📷",
  "Full English & Arabic curriculum 🌍",
  "All 4 educational games 🎮",
  "Parent-controlled screen time & reports ⏱️",
];
const BENEFITS_AR = [
  "مساعدة واجب غير محدودة 📚",
  "محادثة صوتية مع بطلك 🎤",
  "رفع صور الواجب 📷",
  "كامل منهج الإنجليزي والعربي 🌍",
  "كل الألعاب الأربعة 🎮",
  "وقت شاشة وتقارير بيد الوالدين ⏱️",
];

function formatPrice(usd: number, currency: string): string {
  const RATES: Record<string, { symbol: string; rate: number }> = {
    USD: { symbol: "$", rate: 1 }, EUR: { symbol: "€", rate: 0.93 },
    GBP: { symbol: "£", rate: 0.79 }, SAR: { symbol: "ر.س", rate: 3.75 },
    AED: { symbol: "د.إ", rate: 3.67 }, KWD: { symbol: "د.ك", rate: 0.31 },
    QAR: { symbol: "ر.ق", rate: 3.64 }, EGP: { symbol: "ج.م", rate: 30.9 },
  };
  const c = RATES[currency] ?? RATES.USD!;
  const amount = usd * c.rate;
  const rounded = amount >= 100 ? Math.round(amount) : Math.round(amount * 10) / 10;
  return `${c.symbol}${rounded.toLocaleString()}`;
}

export default function Upgrade() {
  const c = useColors();
  const router = useRouter();
  const lang = useLang();
  const isAr = lang === "ar";
  const { profile, patchProfile } = useApp();
  const [loading, setLoading] = useState(false);

  const currency = profile?.currency ?? "USD";

  const subscribe = async (plan: "monthly" | "6months" | "yearly") => {
    setLoading(true);
    await patchProfile({ isPaid: true, paidPlan: plan });
    setLoading(false);
    router.back();
  };

  const p = PLANS_USD;
  const monthly = formatPrice(24.99, currency);
  const sixMonths = formatPrice(135.99, currency);
  const sixPerMonth = formatPrice(135.99 / 6, currency);
  const yearly = formatPrice(236.99, currency);
  const yearlyPerMonth = formatPrice(236.99 / 12, currency);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      <View style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: c.card, alignItems: "center", justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="close" size={20} color={c.text} />
        </Pressable>
        <Text style={{ fontWeight: "800", fontSize: 20, color: c.text, flex: 1 }}>
          ✨ {isAr ? "اشترك في My Hero" : "Upgrade My Hero"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, gap: 16, paddingBottom: 60 }}>

        {/* Hero Banner */}
        <LinearGradient
          colors={["#1A0F3F", "#2D1B69"]}
          style={{ borderRadius: 20, padding: 24, alignItems: "center", gap: 10 }}
        >
          <Text style={{ fontSize: 56 }}>🦸</Text>
          <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 20, textAlign: "center" }}>
            {isAr ? "افتح كامل قدرات My Hero" : "Unlock My Hero's Full Powers"}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, textAlign: "center", lineHeight: 20 }}>
            {isAr
              ? "تعلم غير محدود، آمن، وممتع لطفلك كل يوم"
              : "Unlimited, safe and fun learning for your child every day"}
          </Text>
        </LinearGradient>

        {/* Benefits */}
        <SoftCard style={{ gap: 10 }}>
          <Text style={{ fontWeight: "800", color: c.text, fontSize: 16, textAlign: isAr ? "right" : "left" }}>
            {isAr ? "كل شيء مشمول:" : "Everything included:"}
          </Text>
          {(isAr ? BENEFITS_AR : BENEFITS_EN).map((b) => (
            <View key={b} style={{ flexDirection: isAr ? "row-reverse" : "row", gap: 10, alignItems: "flex-start" }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 12 }}>✓</Text>
              </View>
              <Text style={{ flex: 1, color: c.text, fontSize: 14, lineHeight: 22, textAlign: isAr ? "right" : "left" }}>{b}</Text>
            </View>
          ))}
        </SoftCard>

        {/* MONTHLY */}
        <SoftCard style={{ gap: 10 }}>
          <View style={{ flexDirection: isAr ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ gap: 2 }}>
              <Text style={{ fontWeight: "800", fontSize: 17, color: c.text }}>{isAr ? "شهري" : "Monthly"}</Text>
              <Text style={{ color: c.mutedForeground, fontSize: 12 }}>{isAr ? "إلغاء في أي وقت" : "Cancel anytime"}</Text>
            </View>
            <View style={{ alignItems: isAr ? "flex-start" : "flex-end" }}>
              <Text style={{ fontWeight: "900", fontSize: 22, color: c.text }}>{monthly}</Text>
              <Text style={{ color: c.mutedForeground, fontSize: 11 }}>{isAr ? "/شهر" : "/month"}</Text>
            </View>
          </View>
          <Pressable
            disabled={loading}
            onPress={() => subscribe("monthly")}
            style={({ pressed }) => ({
              backgroundColor: c.primary, borderRadius: 14, paddingVertical: 13, alignItems: "center",
              opacity: pressed || loading ? 0.85 : 1,
            })}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 15 }}>
                {isAr ? "اختر الشهري" : "Choose Monthly"}
              </Text>
            )}
          </Pressable>
        </SoftCard>

        {/* 6 MONTHS */}
        <LinearGradient colors={["#7C3AED", "#A78BFA"]} style={{ borderRadius: 20, padding: 20, gap: 10 }}>
          <View style={{ position: "absolute", top: -12, alignSelf: "center", zIndex: 1 }}>
            <View style={{ backgroundColor: "#5B21B6", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 }}>
              <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 12 }}>
                {isAr ? "🔥 وفّر ١٠٪" : "🔥 SAVE 10%"}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: isAr ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <View style={{ gap: 2 }}>
              <Text style={{ fontWeight: "800", fontSize: 17, color: "#FFF" }}>{isAr ? "٦ أشهر" : "6 Months"}</Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>{isAr ? "للمتعلمين الجادين" : "For committed learners"}</Text>
            </View>
            <View style={{ alignItems: isAr ? "flex-start" : "flex-end" }}>
              <Text style={{ fontWeight: "900", fontSize: 22, color: "#FFF" }}>{sixMonths}</Text>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>{isAr ? `${sixPerMonth}/شهر` : `${sixPerMonth}/mo`}</Text>
            </View>
          </View>
          <Pressable
            disabled={loading}
            onPress={() => subscribe("6months")}
            style={({ pressed }) => ({
              backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 14, paddingVertical: 13, alignItems: "center",
              borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)", opacity: pressed || loading ? 0.85 : 1,
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
        <LinearGradient colors={["#FF6B35", "#FFA76A"]} style={{ borderRadius: 20, padding: 20, gap: 10 }}>
          <View style={{ position: "absolute", top: -12, alignSelf: "center", zIndex: 1 }}>
            <View style={{ backgroundColor: "#C2410C", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 }}>
              <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 12 }}>
                {isAr ? "⭐ الأكثر شعبية · وفّر ٢١٪" : "⭐ MOST POPULAR · SAVE 21%"}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: isAr ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <View style={{ gap: 2 }}>
              <Text style={{ fontWeight: "800", fontSize: 17, color: "#FFF" }}>{isAr ? "سنوي" : "Yearly"}</Text>
              <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 12 }}>{isAr ? "أفضل قيمة" : "Best value"}</Text>
            </View>
            <View style={{ alignItems: isAr ? "flex-start" : "flex-end" }}>
              <Text style={{ fontWeight: "900", fontSize: 22, color: "#FFF" }}>{yearly}</Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 11 }}>{isAr ? `${yearlyPerMonth}/شهر` : `${yearlyPerMonth}/mo`}</Text>
            </View>
          </View>
          <Pressable
            disabled={loading}
            onPress={() => subscribe("yearly")}
            style={({ pressed }) => ({
              backgroundColor: "#FFF", borderRadius: 14, paddingVertical: 13, alignItems: "center",
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

        <Text style={{ textAlign: "center", color: c.mutedForeground, fontSize: 12, lineHeight: 20 }}>
          {isAr
            ? "لا رسوم خفية. إلغاء في أي وقت. بيانات طفلك آمنة وخاصة دائماً."
            : "No hidden fees. Cancel anytime. Your child's data is always safe and private."}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
