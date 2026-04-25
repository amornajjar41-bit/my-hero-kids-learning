import React from "react";
import { Pressable, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useT } from "@/hooks/useT";
import { trialDaysLeft } from "@/lib/utils";

type Props = { onUpgrade: () => void };

export function TrialBanner({ onUpgrade }: Props) {
  const c = useColors();
  const t = useT();
  const { profile } = useApp();
  if (!profile || profile.isPaid) return null;
  const days = trialDaysLeft(profile.trialStartedAt);
  const ended = days <= 0;

  return (
    <Pressable onPress={onUpgrade}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          padding: 14,
          backgroundColor: ended ? c.destructive : c.yellow,
          borderRadius: c.radius,
        }}
      >
        <Text style={{ fontSize: 24 }}>{ended ? "🔒" : "🎁"}</Text>
        <Text
          style={{
            flex: 1,
            color: ended ? "#FFF" : "#5B3700",
            fontWeight: "700",
            fontSize: 14,
          }}
        >
          {ended
            ? t("trialEnded")
            : `${t("trialBannerHave")} ${days} ${t("trialBannerLeft")}`}
        </Text>
      </View>
    </Pressable>
  );
}
