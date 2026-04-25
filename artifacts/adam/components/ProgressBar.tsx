import React from "react";
import { View } from "react-native";

import { useColors } from "@/hooks/useColors";

export function ProgressBar({ value }: { value: number }) {
  const c = useColors();
  const v = Math.max(0, Math.min(1, value));
  return (
    <View
      style={{
        height: 10,
        backgroundColor: c.muted,
        borderRadius: 5,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${v * 100}%`,
          backgroundColor: c.primary,
          borderRadius: 5,
        }}
      />
    </View>
  );
}
