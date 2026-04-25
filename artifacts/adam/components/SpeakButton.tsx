import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Platform, Pressable, View } from "react-native";

import { speak } from "@/lib/audio";
import { useColors } from "@/hooks/useColors";

type Props = {
  text: string;
  voice?: "echo" | "nova";
  size?: number;
};

export function SpeakButton({ text, voice = "echo", size = 36 }: Props) {
  const c = useColors();
  const [busy, setBusy] = useState(false);

  return (
    <Pressable
      onPress={async () => {
        if (Platform.OS !== "web") {
          Haptics.selectionAsync().catch(() => {});
        }
        setBusy(true);
        try {
          await speak(text, voice);
        } catch (e) {
          console.warn("speak failed", e);
        } finally {
          setBusy(false);
        }
      }}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c.accent,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View>
        <Ionicons
          name={busy ? "volume-high" : "volume-medium"}
          size={size * 0.55}
          color={c.accentForeground}
        />
      </View>
    </Pressable>
  );
}
