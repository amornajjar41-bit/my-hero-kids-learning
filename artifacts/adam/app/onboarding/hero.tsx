import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/PrimaryButton";
import { useColors } from "@/hooks/useColors";

const adamImg = require("@/assets/images/adam-boy.png");
const luluImg = require("@/assets/images/lulu-girl.png");

export default function HeroPick() {
  const c = useColors();
  const router = useRouter();
  const { lang } = useLocalSearchParams<{ lang: "en" | "ar" }>();
  const isAr = lang === "ar";
  const [hero, setHero] = useState<"boy" | "girl">("boy");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <View
        style={{ flex: 1, paddingHorizontal: 24, justifyContent: "space-between" }}
      >
        <View style={{ marginTop: 20 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              color: c.text,
              textAlign: "center",
            }}
          >
            {isAr ? "اختر بطلك!" : "Pick your hero!"}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: c.mutedForeground,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            {isAr
              ? "هاد البطل بيرافقك بكل الرحلة 💫"
              : "Your buddy on every adventure 💫"}
          </Text>

          <View
            style={{
              marginTop: 36,
              flexDirection: "row",
              gap: 14,
              justifyContent: "center",
            }}
          >
            {(["boy", "girl"] as const).map((opt) => {
              const selected = hero === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => setHero(opt)}
                  style={({ pressed }) => ({
                    flex: 1,
                    backgroundColor: c.card,
                    borderRadius: c.radius,
                    padding: 16,
                    alignItems: "center",
                    borderWidth: 4,
                    borderColor: selected ? c.primary : "transparent",
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <View
                    style={{
                      width: 130,
                      height: 130,
                      borderRadius: 65,
                      overflow: "hidden",
                      backgroundColor: c.muted,
                    }}
                  >
                    <Image
                      source={opt === "boy" ? adamImg : luluImg}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  </View>
                  <Text
                    style={{
                      marginTop: 14,
                      fontWeight: "800",
                      fontSize: 18,
                      color: c.text,
                    }}
                  >
                    {opt === "boy"
                      ? isAr
                        ? "آدم"
                        : "Adam"
                      : isAr
                        ? "لولو"
                        : "Lulu"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ paddingBottom: 30 }}>
          <PrimaryButton
            title={isAr ? "متابعة" : "Continue"}
            fullWidth
            onPress={() =>
              router.push({
                pathname: "/onboarding/parent",
                params: { lang, hero },
              })
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
