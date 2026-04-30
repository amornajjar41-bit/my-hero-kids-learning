import React from "react";
import { Text, View } from "react-native";

import { AdamCharacter } from "./AdamCharacter";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useT } from "@/hooks/useT";

export function Greeting() {
  const c = useColors();
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
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <AdamCharacter hero={profile?.hero} size={70} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: c.text }}>
          {name ? `${name}!` : t("appName")}
        </Text>
        <Text style={{ fontSize: 14, color: c.mutedForeground, marginTop: 4 }}>
          {t(key as "greetingMorning")}
        </Text>
      </View>
    </View>
  );
}
