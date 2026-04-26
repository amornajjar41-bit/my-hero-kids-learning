import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, View, type ViewStyle } from "react-native";

const adamImg = require("@/assets/images/adam-boy.png");
const luluImg = require("@/assets/images/lulu-girl.png");

export type CharacterPose =
  | "normal"
  | "talking"
  | "thinking"
  | "happy"
  | "excited"
  | "sleeping";

type Props = {
  hero?: "boy" | "girl";
  size?: number;
  bobbing?: boolean;
  pose?: CharacterPose;
  style?: ViewStyle;
};

export function AdamCharacter({
  hero = "boy",
  size = 120,
  bobbing = true,
  pose = "normal",
  style,
}: Props) {
  // Breathing: subtle scale
  const breathe = useRef(new Animated.Value(1)).current;
  // Bounce for happy/excited
  const bounceY = useRef(new Animated.Value(0)).current;
  // Sway for thinking
  const sway = useRef(new Animated.Value(0)).current;
  // Overall Y for bobbing
  const bobY = useRef(new Animated.Value(0)).current;
  // Rotate for excited
  const rotate = useRef(new Animated.Value(0)).current;

  // Continuous breathing
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1.03,
          duration: 1800,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(breathe, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.sin),
        }),
      ]),
    ).start();
  }, [breathe]);

  // Gentle bob when bobbing=true
  useEffect(() => {
    if (!bobbing) {
      bobY.setValue(0);
      return;
    }
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobY, {
          toValue: -5,
          duration: 900,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.quad),
        }),
        Animated.timing(bobY, {
          toValue: 0,
          duration: 900,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.quad),
        }),
      ]),
    ).start();
  }, [bobbing, bobY]);

  // Pose-specific animations
  useEffect(() => {
    bounceY.stopAnimation();
    sway.stopAnimation();
    rotate.stopAnimation();
    bounceY.setValue(0);
    sway.setValue(0);
    rotate.setValue(0);

    if (pose === "happy" || pose === "excited") {
      const jumpHeight = pose === "excited" ? 18 : 10;
      const speed = pose === "excited" ? 350 : 500;
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceY, {
            toValue: -jumpHeight,
            duration: speed,
            useNativeDriver: false,
            easing: Easing.out(Easing.quad),
          }),
          Animated.timing(bounceY, {
            toValue: 0,
            duration: speed,
            useNativeDriver: false,
            easing: Easing.in(Easing.quad),
          }),
        ]),
      ).start();
    }

    if (pose === "excited") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotate, {
            toValue: 1,
            duration: 120,
            useNativeDriver: false,
          }),
          Animated.timing(rotate, {
            toValue: -1,
            duration: 120,
            useNativeDriver: false,
          }),
          Animated.timing(rotate, {
            toValue: 0,
            duration: 120,
            useNativeDriver: false,
          }),
        ]),
      ).start();
    }

    if (pose === "thinking") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(sway, {
            toValue: 4,
            duration: 700,
            useNativeDriver: false,
            easing: Easing.inOut(Easing.sin),
          }),
          Animated.timing(sway, {
            toValue: -4,
            duration: 700,
            useNativeDriver: false,
            easing: Easing.inOut(Easing.sin),
          }),
        ]),
      ).start();
    }

    if (pose === "talking") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceY, {
            toValue: -3,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(bounceY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }),
        ]),
      ).start();
    }
  }, [pose, bounceY, sway, rotate]);

  const rotateInterp = rotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-8deg", "0deg", "8deg"],
  });

  const totalY = Animated.add(bounceY, bobY);

  return (
    <Animated.View
      style={[
        { alignItems: "center" },
        style,
        {
          transform: [
            { translateY: totalY as unknown as number },
            { translateX: sway as unknown as number },
            { rotate: rotateInterp },
            { scale: breathe as unknown as number },
          ],
        },
      ]}
    >
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
