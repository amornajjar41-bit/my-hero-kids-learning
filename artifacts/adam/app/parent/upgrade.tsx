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

const features = {
  en: [
    "Unlimited homework help",
    "Voice chat with Adam",
    "Photo homework upload",
    "Full English & Arabic curriculum",
    "All 4 educational games",
    "Picture dictionary",
    "Daily streak rewards",
    "Weekly progress report",
  ],
  ar: [
    "مساعدة واجب غير محدودة",
    "محادثة صوتية مع آدم",
    "رفع صور الواجب",
    "كامل منهج الإنجليزي والعربي",
    "كل الألعاب الأربعة",
    "قاموس مصور",
    "مكافآت يومية",
    "تقرير تقدم أسبوعي",
  ],
} as const;

export default function Upgrade() {
  const c = useColors();
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const { patchProfile } = useApp();
  const [plan, setPlan] = useState<"yearly" | "monthly">("yearly");

  const subscribe = async () => {
    await patchProfile({ isPaid: true, paidPlan: plan });
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      <View
        style={{
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: c.card,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="close" size={20} color={c.text} />
        </Pressable>
        <Text style={{ fontWeight: "800", fontSize: 22, color: c.text, flex: 1 }}>
          ✨ {t("upgradeTitle")}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }}>
        <LinearGradient
          colors={[c.primary, "#FFB17A"]}
          style={{ borderRadius: c.radius, padding: 22, alignItems: "center" }}
        >
          <Text style={{ fontSize: 50 }}>🚀</Text>
          <Text
            style={{
              color: "#FFF",
              fontWeight: "800",
              fontSize: 22,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            {lang === "ar" ? "افتح كل قدرات آدم" : "Unlock Adam's full powers"}
          </Text>
        </LinearGradient>

        <Pressable onPress={() => setPlan("yearly")}>
          <SoftCard
            color={plan === "yearly" ? c.primary : c.card}
            style={{
              borderWidth: 3,
              borderColor: plan === "yearly" ? c.primary : "transparent",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Ionicons
                name={plan === "yearly" ? "radio-button-on" : "radio-button-off"}
                size={22}
                color={plan === "yearly" ? "#FFF" : c.text}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontWeight: "800",
                    color: plan === "yearly" ? "#FFF" : c.text,
                    fontSize: 18,
                  }}
                >
                  {t("yearly")}
                </Text>
                <Text
                  style={{
                    color: plan === "yearly" ? "#FFF" : c.mutedForeground,
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  {t("bestValue")}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text
                  style={{
                    fontWeight: "800",
                    color: plan === "yearly" ? "#FFF" : c.text,
                    fontSize: 22,
                  }}
                >
                  $189
                </Text>
                <Text
                  style={{
                    color: plan === "yearly" ? "#FFF" : c.mutedForeground,
                    fontSize: 11,
                  }}
                >
                  {t("perYear")}
                </Text>
              </View>
            </View>
          </SoftCard>
        </Pressable>

        <Pressable onPress={() => setPlan("monthly")}>
          <SoftCard
            color={plan === "monthly" ? c.primary : c.card}
            style={{
              borderWidth: 3,
              borderColor: plan === "monthly" ? c.primary : "transparent",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Ionicons
                name={plan === "monthly" ? "radio-button-on" : "radio-button-off"}
                size={22}
                color={plan === "monthly" ? "#FFF" : c.text}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontWeight: "800",
                    color: plan === "monthly" ? "#FFF" : c.text,
                    fontSize: 18,
                  }}
                >
                  {t("monthly")}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text
                  style={{
                    fontWeight: "800",
                    color: plan === "monthly" ? "#FFF" : c.text,
                    fontSize: 22,
                  }}
                >
                  $19.99
                </Text>
                <Text
                  style={{
                    color: plan === "monthly" ? "#FFF" : c.mutedForeground,
                    fontSize: 11,
                  }}
                >
                  {t("perMonth")}
                </Text>
              </View>
            </View>
          </SoftCard>
        </Pressable>

        <SoftCard>
          <Text style={{ fontWeight: "800", color: c.text }}>
            🎁 {t("whatsIncluded")}
          </Text>
          <View style={{ marginTop: 10, gap: 8 }}>
            {features[lang].map((f) => (
              <View
                key={f}
                style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
              >
                <Ionicons name="checkmark-circle" size={20} color={c.green} />
                <Text style={{ color: c.text, fontSize: 14 }}>{f}</Text>
              </View>
            ))}
          </View>
        </SoftCard>

        <PrimaryButton title={t("upgradeNow")} fullWidth onPress={subscribe} />
        <Text
          style={{
            textAlign: "center",
            color: c.mutedForeground,
            fontSize: 11,
          }}
        >
          {lang === "ar"
            ? "تجريبي — لا يتم تحصيل أي رسوم في هذا الإصدار"
            : "Demo — no charges applied in this build"}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
