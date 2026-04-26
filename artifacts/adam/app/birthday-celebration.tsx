import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AdamCharacter } from "@/components/AdamCharacter";
import { Confetti } from "@/components/Confetti";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useT } from "@/hooks/useT";
import { speak, stopAll } from "@/lib/audio";

export default function BirthdayCelebration() {
  const c = useColors();
  const router = useRouter();
  const t = useT();
  const { profile } = useApp();

  // Stop audio on unmount / navigation away
  useEffect(() => () => { stopAll(); }, []);

  useEffect(() => {
    const voice = profile?.hero === "girl" ? "nova" : "echo";
    const msg =
      profile?.language === "ar"
        ? `عيد ميلاد سعيد يا ${profile.childName}!`
        : `Happy birthday, ${profile?.childName ?? "hero"}!`;
    speak(msg, voice).catch(() => {});
  }, [profile]);

  return (
    <LinearGradient
      colors={["#FF6FB5", "#FFD93D", "#4FD1C5"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <Confetti count={120} />
        <View
          style={{
            flex: 1,
            padding: 24,
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 80 }}>🎂</Text>
            <AdamCharacter hero={profile?.hero} size={150} />
            <Text
              style={{
                color: "#FFF",
                fontWeight: "800",
                fontSize: 30,
                textAlign: "center",
                marginTop: 24,
                textShadowColor: "rgba(0,0,0,0.3)",
                textShadowRadius: 6,
              }}
            >
              {t("birthdayHero")}
            </Text>
            <Text
              style={{
                color: "#FFF",
                fontSize: 16,
                textAlign: "center",
                marginTop: 16,
                opacity: 0.95,
              }}
            >
              {profile?.childName ? `${profile.childName}! ` : ""}
              {t("birthdayMsg")}
            </Text>
          </View>
          <PrimaryButton
            title={t("letsGo")}
            fullWidth
            onPress={() => router.back()}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
