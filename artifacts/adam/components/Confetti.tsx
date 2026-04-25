import React, { useEffect, useMemo } from "react";
import { Dimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

const COLORS = ["#FF8A4C", "#4FD1C5", "#FFD93D", "#FF6FB5", "#A78BFA", "#7BD389"];

function ConfettiPiece({ x, delay }: { x: number; delay: number }) {
  const y = useSharedValue(-20);
  const r = useSharedValue(0);
  useEffect(() => {
    const h = Dimensions.get("window").height + 40;
    y.value = withDelay(
      delay,
      withTiming(h, {
        duration: 2200 + Math.random() * 1200,
        easing: Easing.in(Easing.quad),
      }),
    );
    r.value = withDelay(
      delay,
      withTiming(360 * (Math.random() > 0.5 ? 2 : -2), {
        duration: 2400,
        easing: Easing.linear,
      }),
    );
  }, [delay, y, r]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { rotate: `${r.value}deg` }],
  }));

  const color = useMemo(
    () => COLORS[Math.floor(Math.random() * COLORS.length)],
    [],
  );

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top: 0,
          left: x,
          width: 10,
          height: 14,
          backgroundColor: color,
          borderRadius: 2,
        },
        style,
      ]}
    />
  );
}

export function Confetti({ count = 60 }: { count?: number }) {
  const pieces = useMemo(() => {
    const w = Dimensions.get("window").width;
    return Array.from({ length: count }).map((_, i) => ({
      key: i,
      x: Math.random() * w,
      delay: Math.random() * 800,
    }));
  }, [count]);

  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {pieces.map((p) => (
        <ConfettiPiece key={p.key} x={p.x} delay={p.delay} />
      ))}
    </View>
  );
}
