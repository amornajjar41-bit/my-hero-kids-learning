import React, { useEffect } from "react";
import { Image, View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const adamImg = require("@/assets/images/adam-boy.png");
const luluImg = require("@/assets/images/lulu-girl.png");

type Props = {
  hero?: "boy" | "girl";
  size?: number;
  bobbing?: boolean;
  style?: ViewStyle;
};

export function AdamCharacter({
  hero = "boy",
  size = 120,
  bobbing = true,
  style,
}: Props) {
  const y = useSharedValue(0);
  useEffect(() => {
    if (!bobbing) return;
    y.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [bobbing, y]);

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View style={[{ alignItems: "center" }, aStyle, style]}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: "hidden",
          backgroundColor: "#FFF",
          shadowColor: "#000",
          shadowOpacity: 0.18,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
        }}
      >
        <Image
          source={hero === "girl" ? luluImg : adamImg}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </View>
    </Animated.View>
  );
}
