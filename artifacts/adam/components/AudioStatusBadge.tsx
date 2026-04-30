/**
 * AudioStatusBadge — dev-mode only overlay that shows current AudioManager state.
 * Renders nothing in production. Place it in any screen that plays audio.
 */
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { addAudioStateListener, getAudioState, type AudioState } from "@/lib/audio";

const STATE_COLOR: Record<AudioState, string> = {
  idle: "#6B7280",
  loading: "#F59E0B",
  playing: "#10B981",
  error: "#EF4444",
};

const STATE_LABEL: Record<AudioState, string> = {
  idle: "● idle",
  loading: "↻ loading",
  playing: "▶ playing",
  error: "✕ error",
};

export function AudioStatusBadge() {
  if (!__DEV__) return null;

  const [state, setState] = useState<AudioState>(getAudioState());

  useEffect(() => {
    const unsub = addAudioStateListener(setState);
    return unsub;
  }, []);

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        backgroundColor: "rgba(0,0,0,0.65)",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        zIndex: 9999,
      }}
    >
      <Text style={{ color: STATE_COLOR[state], fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>
        {STATE_LABEL[state]}
      </Text>
    </View>
  );
}
