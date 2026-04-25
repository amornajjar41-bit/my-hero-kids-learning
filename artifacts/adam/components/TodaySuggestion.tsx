import React from "react";
import { Pressable, Text, View } from "react-native";

import { SoftCard } from "./SoftCard";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/hooks/useT";

type Props = {
  emoji: string;
  title: string;
  subtitle: string;
  cta: string;
  onPress: () => void;
};

export function TodaySuggestion({ emoji, title, subtitle, cta, onPress }: Props) {
  const c = useColors();
  const t = useT();
  return (
    <SoftCard color={c.accent} padded>
      <Text
        style={{
          color: c.accentForeground,
          fontSize: 13,
          fontWeight: "700",
          opacity: 0.85,
          letterSpacing: 0.4,
          textTransform: "uppercase",
        }}
      >
        {t("todaysSuggestion")}
      </Text>
      <View
        style={{
          marginTop: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 44 }}>{emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text
            style={{ color: c.accentForeground, fontSize: 18, fontWeight: "800" }}
          >
            {title}
          </Text>
          <Text
            style={{
              color: c.accentForeground,
              fontSize: 13,
              opacity: 0.85,
              marginTop: 2,
            }}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          marginTop: 14,
          backgroundColor: "#FFF",
          paddingVertical: 12,
          borderRadius: 14,
          alignItems: "center",
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text style={{ fontWeight: "800", color: c.accentForeground }}>
          {cta} →
        </Text>
      </Pressable>
    </SoftCard>
  );
}
