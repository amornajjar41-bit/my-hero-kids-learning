import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AdamCharacter } from "@/components/AdamCharacter";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useT } from "@/hooks/useT";
import { timeUntilMidnight } from "@/lib/utils";

export default function Blocked() {
  const c = useColors();
  const router = useRouter();
  const t = useT();
  const { profile, patchProfile } = useApp();
  const [time, setTime] = useState(timeUntilMidnight());

  useEffect(() => {
    const id = setInterval(() => setTime(timeUntilMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <LinearGradient colors={["#A78BFA", "#7CC7FF"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            padding: 24,
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <AdamCharacter hero={profile?.hero} size={160} />
            <Text
              style={{
                color: "#FFF",
                fontWeight: "800",
                fontSize: 28,
                textAlign: "center",
                marginTop: 24,
              }}
            >
              {t("blockedTitle")}
            </Text>
            <Text
              style={{
                color: "#FFF",
                opacity: 0.95,
                fontSize: 16,
                textAlign: "center",
                marginTop: 12,
              }}
            >
              {t("blockedSub")}
            </Text>
            <Text
              style={{
                color: "#FFF",
                opacity: 0.85,
                fontSize: 13,
                textAlign: "center",
                marginTop: 20,
              }}
            >
              {t("adamBackIn")}
            </Text>
            <Text
              style={{
                color: "#FFF",
                fontSize: 36,
                fontWeight: "800",
                marginTop: 6,
                fontVariant: ["tabular-nums"],
              }}
            >
              {time}
            </Text>
          </View>
          <PrimaryButton
            title={profile?.language === "ar" ? "رجوع لولي الأمر" : "Parent override"}
            variant="secondary"
            fullWidth
            onPress={async () => {
              await patchProfile({});
              router.replace("/(tabs)");
            }}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
