import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AdamCharacter } from "@/components/AdamCharacter";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useColors } from "@/hooks/useColors";

export default function Welcome() {
  const c = useColors();
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "ar">("en");

  const isAr = lang === "ar";

  return (
    <LinearGradient
      colors={["#FFE4B0", "#FFF6E5"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            paddingHorizontal: 24,
            justifyContent: "space-between",
          }}
        >
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <AdamCharacter size={170} />
            <Text
              style={{
                fontSize: 32,
                fontWeight: "800",
                color: c.text,
                marginTop: 28,
                textAlign: "center",
              }}
            >
              {isAr ? "أهلاً يا بطل! أنا آدم!" : "Hi hero! I'm Adam!"}
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: c.mutedForeground,
                marginTop: 12,
                textAlign: "center",
              }}
            >
              {isAr ? "اختر لغتك لنبدأ المغامرة" : "Pick your language to start"}
            </Text>
          </View>

          <View style={{ gap: 14, paddingBottom: 30 }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              {(["en", "ar"] as const).map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => setLang(opt)}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 22,
                    borderRadius: c.radius,
                    backgroundColor: lang === opt ? c.primary : c.card,
                    alignItems: "center",
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ fontSize: 36 }}>
                    {opt === "en" ? "🇬🇧" : "🇸🇦"}
                  </Text>
                  <Text
                    style={{
                      marginTop: 6,
                      fontWeight: "800",
                      color: lang === opt ? "#FFF" : c.text,
                    }}
                  >
                    {opt === "en" ? "English" : "العربية"}
                  </Text>
                </Pressable>
              ))}
            </View>
            <PrimaryButton
              title={isAr ? "متابعة" : "Continue"}
              fullWidth
              onPress={() =>
                router.push({
                  pathname: "/onboarding/hero",
                  params: { lang },
                })
              }
            />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
