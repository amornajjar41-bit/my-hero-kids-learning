import React from "react";
import { Text, View } from "react-native";

import { AdamCharacter } from "./AdamCharacter";
import { useApp } from "@/contexts/AppContext";
import { useT } from "@/hooks/useT";

export function Greeting() {
  const { profile } = useApp();
  const t = useT();

  const hour = new Date().getHours();
  const key =
    hour < 12
      ? "greetingMorning"
      : hour < 17
        ? "greetingAfternoon"
        : "greetingEvening";

  const name = profile?.childName ?? "";

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
      <AdamCharacter hero={profile?.hero} size={72} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 26, fontWeight: "900", color: "#FFD93D", letterSpacing: 0.3 }}>
            {name ? `${name}!` : t("appName")}
          </Text>
          <Text style={{ fontSize: 22 }}>⭐</Text>
        </View>
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.82)", marginTop: 3, fontWeight: "600" }}>
          {t(key as "greetingMorning")}
        </Text>
      </View>
    </View>
  );
}
