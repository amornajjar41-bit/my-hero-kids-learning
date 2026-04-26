import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, View } from "react-native";

/**
 * Professional My Hero shield logo.
 * Shield shape = pentagon using border-radius trick on a rotated square (CSS polygon).
 * On React Native we approximate with a diamond/shield using two overlapping views.
 */
export function HeroLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const scale = size === "sm" ? 0.65 : size === "lg" ? 1.4 : 1;
  const shieldW = 56 * scale;
  const shieldH = 64 * scale;
  const starSize = 26 * scale;
  const textSize = 22 * scale;
  const subSize  = 11 * scale;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 * scale }}>
      {/* Shield icon */}
      <View style={{ width: shieldW, height: shieldH, alignItems: "center", justifyContent: "center" }}>
        {/* Outer shadow glow */}
        <View style={{
          position: "absolute",
          width: shieldW + 8, height: shieldH + 8,
          borderRadius: 14 * scale,
          backgroundColor: "#f97316",
          opacity: 0.25,
          top: -4, left: -4,
        }} />
        {/* Shield body */}
        <LinearGradient
          colors={["#f97316", "#ea580c", "#1e3a8a"]}
          locations={[0, 0.45, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.3, y: 1 }}
          style={{
            width: shieldW,
            height: shieldH,
            borderRadius: 12 * scale,
            borderBottomLeftRadius: shieldW / 2,
            borderBottomRightRadius: shieldW / 2,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: "rgba(255,255,255,0.3)",
          }}
        >
          {/* Inner highlight stripe */}
          <View style={{
            position: "absolute",
            top: 6, left: 10, right: 10, height: 18,
            backgroundColor: "rgba(255,255,255,0.12)",
            borderRadius: 6,
          }} />
          <Text style={{ fontSize: starSize, lineHeight: starSize * 1.2 }}>⭐</Text>
        </LinearGradient>
      </View>

      {/* Text */}
      <View>
        <Text
          style={{
            fontSize: textSize,
            fontWeight: "900",
            color: "#1e3a8a",
            letterSpacing: 1,
            lineHeight: textSize * 1.1,
          }}
        >
          My Hero
        </Text>
        <Text style={{ fontSize: subSize, fontWeight: "700", color: "#f97316", letterSpacing: 0.5 }}>
          Smart Learning
        </Text>
      </View>
    </View>
  );
}
