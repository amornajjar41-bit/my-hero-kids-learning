import React from "react";
import { Text, View } from "react-native";

import { SoftCard } from "./SoftCard";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/hooks/useT";

export function StreakCard({ streak, stars }: { streak: number; stars: number }) {
  const c = useColors();
  const t = useT();
  return (
    <SoftCard style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: c.yellow,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 28 }}>🔥</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: c.text }}>
          {streak} {t("streak")}
        </Text>
        <Text style={{ fontSize: 14, color: c.mutedForeground, marginTop: 2 }}>
          ⭐ {stars} {t("totalStars")}
        </Text>
      </View>
    </SoftCard>
  );
}
