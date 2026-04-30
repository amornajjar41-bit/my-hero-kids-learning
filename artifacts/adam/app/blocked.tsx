import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AdamCharacter } from "@/components/AdamCharacter";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { timeUntilMidnight } from "@/lib/utils";

const SLEEP_MESSAGES: Record<string, string> = {
  boy: "Woah! We did SO much today! Even superheroes need to sleep! See you tomorrow champion! 😴",
  girl: "Amazing day superstar! Time to rest! I will be here tomorrow! 😴",
};

export default function Blocked() {
  const c = useColors();
  const { profile } = useApp();
  const [time, setTime] = useState(timeUntilMidnight());

  useEffect(() => {
    const id = setInterval(() => setTime(timeUntilMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  const hero = profile?.hero ?? "boy";
  const msg = SLEEP_MESSAGES[hero] ?? SLEEP_MESSAGES.boy!;
  const childName = profile?.childName ?? "";

  return (
    <LinearGradient colors={["#7C3AED", "#4F46E5", "#2563EB"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: 28, justifyContent: "center", alignItems: "center" }}>

          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16, opacity: 0.7 }}>
            {["⭐", "🌙", "✨", "🌙", "⭐"].map((s, i) => (
              <Text key={i} style={{ fontSize: 20 }}>{s}</Text>
            ))}
          </View>

          <View style={{ position: "relative", marginBottom: 8 }}>
            <AdamCharacter hero={profile?.hero} size={180} pose="happy" />
            <View style={{ position: "absolute", top: -10, right: -10 }}>
              <Text style={{ fontSize: 18, color: "#FFF", fontWeight: "800", opacity: 0.9 }}>z</Text>
            </View>
            <View style={{ position: "absolute", top: -28, right: 4 }}>
              <Text style={{ fontSize: 24, color: "#FFF", fontWeight: "800", opacity: 0.8 }}>z</Text>
            </View>
            <View style={{ position: "absolute", top: -50, right: 14 }}>
              <Text style={{ fontSize: 30, color: "#FFF", fontWeight: "800", opacity: 0.7 }}>Z</Text>
            </View>
          </View>

          {!!childName && (
            <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 22, marginBottom: 4, opacity: 0.9 }}>
              {childName}
            </Text>
          )}

          <Text style={{
            color: "#FFF", fontWeight: "800", fontSize: 20,
            textAlign: "center", marginTop: 16, lineHeight: 30, paddingHorizontal: 8,
          }}>
            {msg}
          </Text>

          <View style={{ width: 60, height: 2, backgroundColor: "rgba(255,255,255,0.4)", borderRadius: 2, marginVertical: 28 }} />

          <Text style={{ color: "#FFF", opacity: 0.8, fontSize: 13, textAlign: "center", marginBottom: 8 }}>
            Time until midnight reset
          </Text>
          <Text style={{
            color: "#FFF", fontSize: 44, fontWeight: "900",
            fontVariant: ["tabular-nums"], letterSpacing: 2,
          }}>
            {time}
          </Text>

          <View style={{
            marginTop: 24, backgroundColor: "rgba(255,255,255,0.15)",
            paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
          }}>
            <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 14 }}>
              ⏰ Back tomorrow
            </Text>
          </View>

        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
