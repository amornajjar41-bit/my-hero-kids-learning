/**
 * 5B – Upgrade / Subscription screen with 3 plans and local currency.
 */
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/PrimaryButton";
import { SoftCard } from "@/components/SoftCard";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useT, useLang } from "@/hooks/useT";

// Exchange rates relative to USD (approximate)
const CURRENCY_RATES: Record<string, { symbol: string; rate: number }> = {
  USD: { symbol: "$", rate: 1 },
  EUR: { symbol: "€", rate: 0.93 },
  GBP: { symbol: "£", rate: 0.79 },
  SAR: { symbol: "ر.س", rate: 3.75 },
  AED: { symbol: "د.إ", rate: 3.67 },
  KWD: { symbol: "د.ك", rate: 0.31 },
  QAR: { symbol: "ر.ق", rate: 3.64 },
  BHD: { symbol: ".د.ب", rate: 0.376 },
  OMR: { symbol: "ر.ع", rate: 0.385 },
  JOD: { symbol: "د.أ", rate: 0.71 },
  EGP: { symbol: "ج.م", rate: 30.9 },
  TND: { symbol: "د.ت", rate: 3.1 },
  MAD: { symbol: "د.م.", rate: 10.0 },
  LBP: { symbol: "ل.ل", rate: 89500 },
  IQD: { symbol: "د.ع", rate: 1310 },
  SYP: { symbol: "ل.س", rate: 13000 },
  TRY: { symbol: "₺", rate: 32.2 },
  INR: { symbol: "₹", rate: 83.5 },
  PKR: { symbol: "₨", rate: 278 },
  MYR: { symbol: "RM", rate: 4.7 },
  IDR: { symbol: "Rp", rate: 15700 },
};

function formatPrice(usd: number, currency: string): string {
  const c = CURRENCY_RATES[currency] ?? CURRENCY_RATES.USD;
  const amount = usd * c.rate;
  // Round to reasonable precision
  const rounded = amount >= 100 ? Math.round(amount) : Math.round(amount * 10) / 10;
  return `${c.symbol}${rounded.toLocaleString()}`;
}

const features = {
  en: [
    "Unlimited homework help 📚",
    "Voice chat with your hero 🎤",
    "Photo homework upload 📷",
    "Full English & Arabic curriculum 🌍",
    "All 4 educational games 🎮",
    "Picture dictionary 📖",
    "Daily streak rewards 🏆",
    "Weekly progress report 📊",
    "Parent-controlled screen time ⏱️",
    "Complete privacy — no ads 🔒",
  ],
  ar: [
    "مساعدة واجب غير محدودة 📚",
    "محادثة صوتية مع بطلك 🎤",
    "رفع صور الواجب 📷",
    "كامل منهج الإنجليزي والعربي 🌍",
    "كل الألعاب الأربعة 🎮",
    "قاموس مصور 📖",
    "مكافآت يومية 🏆",
    "تقرير تقدم أسبوعي 📊",
    "وقت شاشة بيد الوالدين ⏱️",
    "خصوصية تامة — لا إعلانات 🔒",
  ],
} as const;

type Plan = "monthly" | "6months" | "yearly";

export default function Upgrade() {
  const c = useColors();
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const { profile, patchProfile } = useApp();
  const [plan, setPlan] = useState<Plan>("yearly");

  const currency = profile?.currency ?? "USD";

  const prices = {
    monthly: { usd: 24.99, save: 0 },
    "6months": { usd: 135.99, save: 10 },
    yearly: { usd: 236.99, save: 21 },
  };

  const subscribe = async () => {
    await patchProfile({ isPaid: true, paidPlan: plan });
    router.back();
  };

  const planLabel = {
    monthly: lang === "ar" ? "شهري" : "Monthly",
    "6months": lang === "ar" ? "٦ أشهر" : "6 Months",
    yearly: lang === "ar" ? "سنوي" : "Yearly",
  };

  const perLabel = {
    monthly: lang === "ar" ? "/شهر" : "/month",
    "6months": lang === "ar" ? "/٦ أشهر" : "/6 months",
    yearly: lang === "ar" ? "/سنة" : "/year",
  };

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
        <Text style={{ fontWeight: "800", fontSize: 22, color: c.text, flex: 1 }}>
          ✨ {lang === "ar" ? "اشترك في My Hero" : "Upgrade My Hero"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }}>
        <LinearGradient
          colors={[c.primary, "#FFB17A"]}
          style={{ borderRadius: c.radius, padding: 22, alignItems: "center" }}
        >
          <Text style={{ fontSize: 50 }}>🚀</Text>
          <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 22, marginTop: 8, textAlign: "center" }}>
            {lang === "ar" ? "افتح كل قدرات My Hero" : "Unlock My Hero's Full Powers"}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, marginTop: 6, textAlign: "center" }}>
            {lang === "ar"
              ? "تعلم غير محدود، آمن، وممتع لطفلك"
              : "Unlimited, safe, and fun learning for your child"}
          </Text>
        </LinearGradient>

        {/* Plans */}
        {(["monthly", "6months", "yearly"] as Plan[]).map((p) => {
          const sel = plan === p;
          const pr = prices[p];
          return (
            <Pressable key={p} onPress={() => setPlan(p)}>
              <SoftCard
                color={sel ? c.primary : c.card}
                style={{
                  borderWidth: 3,
                  borderColor: sel ? c.primary : "transparent",
                  position: "relative",
                }}
              >
                {pr.save > 0 && (
                  <View style={{
                    position: "absolute", top: -10, right: 14,
                    backgroundColor: "#10B981",
                    paddingHorizontal: 10, paddingVertical: 4,
                    borderRadius: 12, zIndex: 1,
                  }}>
                    <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 11 }}>
                      {lang === "ar" ? `وفّر ${pr.save}%` : `Save ${pr.save}%`}
                    </Text>
                  </View>
                )}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Ionicons
                    name={sel ? "radio-button-on" : "radio-button-off"}
                    size={22}
                    color={sel ? "#FFF" : c.text}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "800", color: sel ? "#FFF" : c.text, fontSize: 18 }}>
                      {planLabel[p]}
                    </Text>
                    {p === "yearly" && (
                      <Text style={{ color: sel ? "rgba(255,255,255,0.85)" : c.mutedForeground, fontSize: 12, marginTop: 2 }}>
                        {lang === "ar" ? "الأوفر 🔥" : "Best value 🔥"}
                      </Text>
                    )}
                    {p === "6months" && (
                      <Text style={{ color: sel ? "rgba(255,255,255,0.85)" : c.mutedForeground, fontSize: 12, marginTop: 2 }}>
                        {lang === "ar" ? "الأكثر شعبية ⭐" : "Most popular ⭐"}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontWeight: "900", color: sel ? "#FFF" : c.text, fontSize: 22 }}>
                      {formatPrice(pr.usd, currency)}
                    </Text>
                    <Text style={{ color: sel ? "rgba(255,255,255,0.8)" : c.mutedForeground, fontSize: 12 }}>
                      {perLabel[p]}
                    </Text>
                  </View>
                </View>
              </SoftCard>
            </Pressable>
          );
        })}

        {/* What's included */}
        <SoftCard>
          <Text style={{ fontWeight: "800", color: c.text }}>
            🎁 {lang === "ar" ? "كل شيء مشمول" : "Everything Included"}
          </Text>
          <View style={{ marginTop: 10, gap: 8 }}>
            {features[lang].map((f) => (
              <View key={f} style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                <Ionicons name="checkmark-circle" size={20} color={c.green} />
                <Text style={{ color: c.text, fontSize: 14 }}>{f}</Text>
              </View>
            ))}
          </View>
        </SoftCard>

        <PrimaryButton title={lang === "ar" ? "اشترك الآن ✨" : "Subscribe Now ✨"} fullWidth onPress={subscribe} />

        <Text style={{ textAlign: "center", color: c.mutedForeground, fontSize: 11 }}>
          {lang === "ar"
            ? "تجريبي — لا يتم تحصيل أي رسوم في هذا الإصدار"
            : "Demo — no charges applied in this build"}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
