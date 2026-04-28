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

const PLANS = [
  {
    key: "yearly" as const,
    badge: "⭐ BEST VALUE",
    badgeAr: "⭐ الأفضل",
    savePct: 21,
    gradientColors: ["#FF6B35", "#FFA76A"] as [string, string],
    textColor: "#FFF",
  },
  {
    key: "biannual" as const,
    badge: "🔥 POPULAR",
    badgeAr: "🔥 الأكثر طلباً",
    savePct: 10,
    gradientColors: ["#8B5CF6", "#A78BFA"] as [string, string],
    textColor: "#FFF",
  },
  {
    key: "monthly" as const,
    badge: null,
    badgeAr: null,
    savePct: 0,
    gradientColors: ["#F9FAFB", "#F3F4F6"] as [string, string],
    textColor: "#1F2937",
  },
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

  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "biannual" | "yearly">("yearly");
  const [loading, setLoading] = useState(false);

  async function handleStart() {
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60, gap: 16 }}>
        {/* Header */}
        <View style={{ alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 48 }}>🎉</Text>
          <Text style={{ fontSize: 26, fontWeight: "900", color: c.text, textAlign: "center" }}>
            {isAr ? "جاهز للانطلاق!" : "Ready to Launch!"}
          </Text>
          <Text style={{ fontSize: 15, color: c.mutedForeground, textAlign: "center", lineHeight: 22 }}>
            {isAr
              ? `${(params.hero ?? profile?.hero) === "girl" ? "لولو" : "آدم"} مستعد يساعد ${params.name || profile?.childName || "طفلك"} يتفوق! 🚀`
              : `${(params.hero ?? profile?.hero) === "girl" ? "Lulu" : "Adam"} is ready to help ${params.name || profile?.childName || "your child"} shine! 🚀`}
          </Text>
        </View>

        {/* Trial badge */}
        <View style={{
          backgroundColor: "#ECFDF5",
          borderRadius: 16,
          padding: 14,
          flexDirection: isAr ? "row-reverse" : "row",
          alignItems: "center",
          gap: 10,
          borderWidth: 1,
          borderColor: "#6EE7B7",
        }}>
          <Text style={{ fontSize: 24 }}>🎓</Text>
          <Text style={{ flex: 1, color: "#065F46", fontWeight: "700", fontSize: 14, lineHeight: 20, textAlign: isAr ? "right" : "left" }}>
            {isAr ? "٧ أيام مجانية بالكامل — لا بطاقة مطلوبة الآن" : "7 days completely free — no card needed now"}
          </Text>
        </View>

        {/* Plan section title */}
        <Text style={{ fontWeight: "800", color: c.text, fontSize: 16, textAlign: isAr ? "right" : "left" }}>
          {isAr ? "اختر خطتك بعد التجربة" : "Choose your plan after trial"}
        </Text>

        {/* Plan cards */}
        {PLANS.map(({ key, badge, badgeAr, savePct, gradientColors, textColor }) => {
          const plan = PLANS_USD[key];
          const priceStr = convertPrice(plan.usd, rate, symbol);
          const selected = selectedPlan === key;
          const isLight = key === "monthly";

          return (
            <Pressable
              key={key}
              onPress={() => {
                setSelectedPlan(key);
                if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
              }}
              style={({ pressed }) => ({
                opacity: pressed ? 0.92 : 1,
                marginTop: key === "yearly" ? 12 : 0,
              })}
            >
              <LinearGradient
                colors={gradientColors}
                style={{
                  borderRadius: 20,
                  padding: 18,
                  borderWidth: selected ? 3 : 1,
                  borderColor: selected
                    ? isLight ? "#FF6B35" : "rgba(255,255,255,0.8)"
                    : isLight ? "#E5E7EB" : "transparent",
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {(isAr ? badgeAr : badge) && (
                  <View style={{
                    position: "absolute", top: -12, alignSelf: "center",
                    backgroundColor: key === "yearly" ? "#FF6B35" : "#7C3AED",
                    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4,
                  }}>
                    <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 12 }}>
                      {isAr ? badgeAr : badge}
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: isAr ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ gap: 4 }}>
                    <Text style={{ color: textColor, fontWeight: "800", fontSize: 18 }}>
                      {isAr ? plan.labelAr : plan.label}
                    </Text>
                    {savePct > 0 && (
                      <Text style={{ color: isLight ? "#059669" : "#86EFAC", fontSize: 13, fontWeight: "700" }}>
                        {isAr ? `وفّر ${savePct}%` : `Save ${savePct}%`}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: isAr ? "flex-start" : "flex-end" }}>
                    <Text style={{ color: textColor, fontWeight: "900", fontSize: 24 }}>
                      {priceStr}
                    </Text>
                    {key !== "monthly" && (
                      <Text style={{ color: isLight ? "#6B7280" : "rgba(255,255,255,0.75)", fontSize: 12 }}>
                        {isAr
                          ? `${convertPrice(plan.usd / (key === "biannual" ? 6 : 12), rate, symbol)}/شهر`
                          : `${convertPrice(plan.usd / (key === "biannual" ? 6 : 12), rate, symbol)}/mo`}
                      </Text>
                    )}
                  </View>
                </View>

                {selected && (
                  <View style={{ position: "absolute", top: 12, right: isAr ? undefined : 12, left: isAr ? 12 : undefined }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: isLight ? c.primary : "#FFF", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ color: isLight ? "#FFF" : c.primary, fontWeight: "800", fontSize: 13 }}>✓</Text>
                    </View>
                  </View>
                )}
              </LinearGradient>
            </Pressable>
          );
        })}

        {/* CTA */}
        <Pressable
          onPress={handleStart}
          disabled={loading}
          style={({ pressed }) => ({
            backgroundColor: "#FF6B35",
            borderRadius: 18,
            padding: 18,
            alignItems: "center",
            opacity: pressed || loading ? 0.85 : 1,
            shadowColor: "#FF6B35",
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 6,
            marginTop: 8,
          })}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 18 }}>
                {isAr ? "ابدأ التجربة المجانية 🚀" : "Start Free Trial 🚀"}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 4 }}>
                {isAr ? "٧ أيام مجانية · لا بطاقة مطلوبة" : "7 days free · No card required"}
              </Text>
            </>
          )}
        </Pressable>

        <Text style={{ color: c.mutedForeground, fontSize: 11, textAlign: "center" }}>
          {isAr
            ? "يمكنك الإلغاء في أي وقت. سنُذكّرك قبل انتهاء التجربة."
            : "Cancel anytime. We'll remind you before the trial ends."}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
