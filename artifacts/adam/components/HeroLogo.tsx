import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, View } from "react-native";

/**
 * My Hero brand logo — clean, modern, premium.
 * Supports "sm" | "md" | "lg" sizes and "row" | "column" layouts.
 */
export function HeroLogo({
  size = "md",
  layout = "row",
  dark = false,
}: {
  size?: "sm" | "md" | "lg";
  layout?: "row" | "column";
  dark?: boolean;
}) {
  const scale = size === "sm" ? 0.62 : size === "lg" ? 1.45 : 1;

  const badgeSize  = 52 * scale;
  const starSize   = 24 * scale;
  const titleSize  = 24 * scale;
  const subSize    = 10.5 * scale;
  const gap        = layout === "column" ? 10 * scale : 14 * scale;

  const titleColor = dark ? "#FFFFFF" : "#1A2E6C";
  const tagColor   = dark ? "rgba(255,255,255,0.75)" : "#F97316";

  return (
    <View
      style={{
        flexDirection: layout === "column" ? "column" : "row",
        alignItems: "center",
        gap,
      }}
    >
      {/* ── Badge icon ─────────────────────────────────────────────── */}
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        {/* Soft outer glow ring */}
        <View
          style={{
            position: "absolute",
            width: badgeSize + 14,
            height: badgeSize + 14,
            borderRadius: (badgeSize + 14) / 2,
            backgroundColor: "#6D28D9",
            opacity: 0.18,
          }}
        />
        {/* Inner gradient badge */}
        <LinearGradient
          colors={["#7C3AED", "#4338CA", "#1E3A8A"]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize * 0.32,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#4338CA",
            shadowOpacity: 0.55,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 10,
          }}
        >
          {/* Subtle white shine top-left */}
          <View
            style={{
              position: "absolute",
              top: 5,
              left: 7,
              width: badgeSize * 0.45,
              height: badgeSize * 0.25,
              backgroundColor: "rgba(255,255,255,0.18)",
              borderRadius: 6,
            }}
          />
          <Text style={{ fontSize: starSize, lineHeight: starSize * 1.25 }}>⭐</Text>
        </LinearGradient>
      </View>

      {/* ── Text stack ─────────────────────────────────────────────── */}
      <View style={{ alignItems: layout === "column" ? "center" : "flex-start", gap: 2 }}>
        {/* Brand name */}
        <Text
          style={{
            fontSize: titleSize,
            fontWeight: "900",
            color: titleColor,
            letterSpacing: 0.8,
            lineHeight: titleSize * 1.15,
          }}
        >
          My Hero
        </Text>

        {/* Tagline with fine rule separators */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 * scale }}>
          {layout === "column" && (
            <View
              style={{
                width: 22 * scale,
                height: 1.2,
                backgroundColor: tagColor,
                opacity: 0.5,
                borderRadius: 1,
              }}
            />
          )}
          <Text
            style={{
              fontSize: subSize,
              fontWeight: "700",
              color: tagColor,
              letterSpacing: 1.8,
              textTransform: "uppercase",
            }}
          >
            Smart Learning
          </Text>
          {layout === "column" && (
            <View
              style={{
                width: 22 * scale,
                height: 1.2,
                backgroundColor: tagColor,
                opacity: 0.5,
                borderRadius: 1,
              }}
            />
          )}
        </View>
      </View>
    </View>
  );
}
