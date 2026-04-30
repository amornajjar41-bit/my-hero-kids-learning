import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Speech from "expo-speech";

import { AdamCharacter } from "@/components/AdamCharacter";
import { Confetti } from "@/components/Confetti";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useT } from "@/hooks/useT";

export default function BirthdayCelebration() {
  const c = useColors();
  const router = useRouter();
  const t = useT();
  const { profile } = useApp();

  useEffect(() => {
    const name = profile?.childName ?? "";
    const hero = profile?.hero ?? "boy";
    const msg = `Happy birthday ${name}! You are the best hero in the whole world! May all your wishes come true!`;

    const timer = setTimeout(() => {
      Speech.speak(msg, {
        language: "en-US",
        rate: 0.85,
        pitch: hero === "girl" ? 1.2 : 0.95,
      });
    }, 800);

    return () => {
      clearTimeout(timer);
      Speech.stop();
    };
  }, [profile]);

  const hero = profile?.hero ?? "boy";

  return (
    <LinearGradient colors={["#FF6FB5", "#FFD93D", "#4FD1C5"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Confetti count={130} />
        <View style={{ flex: 1, padding: 24, justifyContent: "space-between" }}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 8 }}>

            <View style={{ flexDirection: "row", gap: 6 }}>
              {["🎈", "🎉", "🎂", "🎉", "🎈"].map((e, i) => (
                <Text key={i} style={{ fontSize: 30 }}>{e}</Text>
              ))}
            </View>

            <View style={{ position: "relative", marginTop: 8 }}>
              <View style={{ position: "absolute", top: -32, left: 0, right: 0, alignItems: "center", zIndex: 10 }}>
                <Text style={{ fontSize: 52 }}>🎩</Text>
              </View>
              <AdamCharacter hero={profile?.hero} size={160} pose="excited" />
            </View>

            <Text style={{
              color: "#FFF", fontWeight: "900", fontSize: 32, textAlign: "center", marginTop: 16,
              textShadowColor: "rgba(0,0,0,0.25)", textShadowRadius: 8,
            }}>
              🎂 Happy Birthday!
            </Text>

            {!!profile?.childName && (
              <Text style={{
                color: "#FFF", fontWeight: "800", fontSize: 26, textAlign: "center",
                textShadowColor: "rgba(0,0,0,0.2)", textShadowRadius: 6,
              }}>
                {profile.childName}! 🌟
              </Text>
            )}

            <Text style={{
              color: "#FFF", fontSize: 16, textAlign: "center", marginTop: 8, opacity: 0.95, lineHeight: 24,
            }}>
              {hero === "girl"
                ? "Your birthday is the most magical day of the year, superstar! ✨"
                : "Your birthday is the most epic day of the year, champion! ✨"}
            </Text>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              {["⭐", "🌟", "💫", "🌟", "⭐"].map((s, i) => (
                <Text key={i} style={{ fontSize: 22 }}>{s}</Text>
              ))}
            </View>
          </View>

          <PrimaryButton
            title="Let's celebrate! 🎉"
            fullWidth
            onPress={() => router.back()}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
