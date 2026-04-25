import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { stop } from "@/lib/audio";

export function SoundToggle() {
  const c = useColors();
  const { profile, patchProfile } = useApp();
  const on = profile?.soundOn ?? true;
  return (
    <Pressable
      onPress={() => {
        if (on) stop();
        patchProfile({ soundOn: !on });
      }}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: c.card,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.7 : 1,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      })}
    >
      <View>
        <Ionicons
          name={on ? "volume-high" : "volume-mute"}
          size={22}
          color={on ? c.primary : c.mutedForeground}
        />
      </View>
    </Pressable>
  );
}
