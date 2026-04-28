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

  // 4D – Play happy birthday using device speech (local, no API calls)
  useEffect(() => {
    const lang = profile?.language ?? "en";
    const name = profile?.childName ?? "";
    const hero = profile?.hero ?? "boy";

    const msg = lang === "ar"
      ? `عيد ميلاد سعيد يا ${name}! أنت أجمل بطل في العالم! كل عام وأنت بخير!`
      : `Happy birthday ${name}! You are the best hero in the whole world! May all your wishes come true!`;

    const t = setTimeout(() => {
      Speech.speak(msg, {
        language: lang === "ar" ? "ar" : "en-US",
        rate: 0.85,
        pitch: hero === "girl" ? 1.2 : 0.95,
      });
    }, 800);

    return () => {
      clearTimeout(t);
      Speech.stop();
    };
  }, [profile]);

  const lang = profile?.language ?? "en";
  const hero = profile?.hero ?? "boy";

  return (
    <LinearGradient
      colors={["#FF6FB5", "#FFD93D", "#4FD1C5"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <Confetti count={130} />
        <View style={{ flex: 1, padding: 24, justifyContent: "space-between" }}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 8 }}>

            {/* Balloon row */}
            <View style={{ flexDirection: "row", gap: 6 }}>
              {["🎈", "🎉", "🎂", "🎉", "🎈"].map((e, i) => (
                <Text key={i} style={{ fontSize: 30 }}>{e}</Text>
              ))}
            </View>

            {/* Character with party hat */}
            <View style={{ position: "relative", marginTop: 8 }}>
              {/* Party hat on top of character */}
              <View style={{ position: "absolute", top: -32, left: 0, right: 0, alignItems: "center", zIndex: 10 }}>
                <Text style={{ fontSize: 52 }}>🎩</Text>
              </View>
              <AdamCharacter hero={profile?.hero} size={160} pose="wave" />
            </View>

            <Text style={{
              color: "#FFF",
              fontWeight: "900",
              fontSize: 32,
              textAlign: "center",
              marginTop: 16,
              textShadowColor: "rgba(0,0,0,0.25)",
              textShadowRadius: 8,
            }}>
              {lang === "ar"
                ? `🎂 عيد ميلاد سعيد!`
                : `🎂 Happy Birthday!`}
            </Text>

            {!!profile?.childName && (
              <Text style={{
                color: "#FFF",
                fontWeight: "800",
                fontSize: 26,
                textAlign: "center",
                textShadowColor: "rgba(0,0,0,0.2)",
                textShadowRadius: 6,
              }}>
                {profile.childName}! 🌟
              </Text>
            )}

            <Text style={{
              color: "#FFF",
              fontSize: 16,
              textAlign: "center",
              marginTop: 8,
              opacity: 0.95,
              lineHeight: 24,
            }}>
              {lang === "ar"
                ? hero === "girl"
                  ? "يوم ميلادك أجمل يوم في السنة يا بطلتي! ✨"
                  : "يوم ميلادك أجمل يوم في السنة يا بطلي! ✨"
                : hero === "girl"
                  ? "Your birthday is the most magical day of the year, superstar! ✨"
                  : "Your birthday is the most epic day of the year, champion! ✨"}
            </Text>

            {/* Stars */}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              {["⭐", "🌟", "💫", "🌟", "⭐"].map((s, i) => (
                <Text key={i} style={{ fontSize: 22 }}>{s}</Text>
              ))}
            </View>
          </View>

          <PrimaryButton
            title={lang === "ar" ? "يلا نحتفل! 🎉" : "Let's celebrate! 🎉"}
            fullWidth
            onPress={() => router.back()}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
