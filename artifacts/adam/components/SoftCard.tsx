import React from "react";
import { View, type ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  color?: string;
  padded?: boolean;
};

export function SoftCard({ children, style, color, padded = true }: Props) {
  const c = useColors();
  return (
    <View
      style={[
        {
          backgroundColor: color ?? c.card,
          borderRadius: c.radius,
          padding: padded ? 18 : 0,
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
