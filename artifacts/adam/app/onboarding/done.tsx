import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AdamCharacter } from "@/components/AdamCharacter";
import { Confetti } from "@/components/Confetti";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useT } from "@/hooks/useT";

export default function Done() {
  const c = useColors();
  const router = useRouter();
  const { profile } = useApp();
  const t = useT();

  return (
    <LinearGradient colors={["#FFE4B0", "#FFF6E5"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Confetti count={70} />
        <View
          style={{
            flex: 1,
            paddingHorizontal: 24,
            justifyContent: "space-between",
          }}
        >
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <AdamCharacter hero={profile?.hero} size={170} />
            <Text
              style={{
                fontSize: 30,
                fontWeight: "800",
                color: c.text,
                textAlign: "center",
                marginTop: 24,
              }}
            >
              {t("doneTitle")}
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: c.mutedForeground,
                textAlign: "center",
                marginTop: 10,
              }}
            >
              {t("doneSub")}
            </Text>
          </View>

          <View style={{ paddingBottom: 30 }}>
            <PrimaryButton
              title={t("letsGo")}
              fullWidth
              onPress={() => router.replace("/(tabs)")}
            />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
