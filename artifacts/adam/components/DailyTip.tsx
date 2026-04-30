/**
 * 4D – Daily tip by time of day (locally stored, never AI-generated).
 */
import React, { useEffect, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type TipData = {
  icon: string;
  text: string;
  bg: string;
};

const TIPS_BY_TIME: Record<"morning" | "afternoon" | "evening", TipData> = {
  morning: {
    icon: "☀️",
    text: "Good morning! Eating breakfast gives you superpowers for learning! ☀️",
    bg: "#FEF3C7",
  },
  afternoon: {
    icon: "🧠",
    text: "Taking a short break helps your brain remember more! 🧠",
    bg: "#DBEAFE",
  },
  evening: {
    icon: "🌙",
    text: "Sleeping early makes you faster at solving puzzles tomorrow! 🌙",
    bg: "#EDE9FE",
  },
};

function getTimeOfDay(): "morning" | "afternoon" | "evening" {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  return "evening";
}

export function DailyTip() {
  const c = useColors();
  const [visible, setVisible] = useState(true);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  if (!visible) return null;

  const tod = getTimeOfDay();
  const tip = TIPS_BY_TIME[tod];

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={{
        backgroundColor: tip.bg, borderRadius: 16, padding: 14,
        flexDirection: "row", alignItems: "center", gap: 10,
      }}>
        <Text style={{ fontSize: 28 }}>{tip.icon}</Text>
        <Text style={{ flex: 1, fontSize: 13, color: "#374151", fontWeight: "600", lineHeight: 20 }}>
          {tip.text}
        </Text>
        <Pressable
          onPress={() => {
            Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(
              () => setVisible(false)
            );
          }}
          hitSlop={8}
        >
          <Text style={{ color: "#9CA3AF", fontSize: 16, fontWeight: "700" }}>✕</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
