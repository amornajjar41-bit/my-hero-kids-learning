import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, View, Text, type ViewStyle } from "react-native";

const adamImg = require("@/assets/images/adam-transparent.png");
const luluImg = require("@/assets/images/sara-transparent.png");

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
  size = 140,
  bobbing = true,
  pose = "normal",
  style,
}: Props) {
  // Breathing: subtle scale
  const breathe = useRef(new Animated.Value(1)).current;
  // Bounce for happy/excited/talking
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
          toValue: -6,
          duration: 950,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.quad),
        }),
        Animated.timing(bobY, {
          toValue: 0,
          duration: 950,
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

  // Thought bubble sizing relative to character
  const bubbleW = Math.round(size * 0.56);
  const bubbleH = Math.round(size * 0.48);
  const dot1 = Math.round(size * 0.13);
  const dot2 = Math.round(size * 0.086);
  const dot3 = Math.round(size * 0.056);

  return (
    <View style={[{ alignItems: "center" }, style]}>
      {/* ── THOUGHT BUBBLE (thinking pose only) ──
          Layout top→bottom: cloud → large dot → medium dot → small dot
          Offset right so it looks like it flows from the head naturally */}
      {pose === "thinking" && (
        <View
          style={{
            alignItems: "flex-start",
            marginLeft: size * 0.32,
            marginBottom: size * 0.04,
          }}
        >
          {/* Main cloud */}
          <View
            style={{
              width: bubbleW,
              height: bubbleH,
              borderRadius: bubbleW * 0.5,
              backgroundColor: "rgba(255,255,255,0.95)",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.14,
              shadowRadius: 10,
              elevation: 5,
            }}
          >
            <Text style={{ fontSize: Math.round(size * 0.22) }}>🤔</Text>
          </View>
          {/* Large connector dot */}
          <View
            style={{
              width: dot1, height: dot1,
              borderRadius: dot1 / 2,
              backgroundColor: "rgba(255,255,255,0.95)",
              marginTop: Math.round(size * 0.03),
              marginLeft: Math.round(size * 0.06),
              elevation: 3,
            }}
          />
          {/* Medium connector dot */}
          <View
            style={{
              width: dot2, height: dot2,
              borderRadius: dot2 / 2,
              backgroundColor: "rgba(255,255,255,0.95)",
              marginTop: Math.round(size * 0.02),
              marginLeft: Math.round(size * 0.03),
              elevation: 2,
            }}
          />
          {/* Small connector dot — closest to head */}
          <View
            style={{
              width: dot3, height: dot3,
              borderRadius: dot3 / 2,
              backgroundColor: "rgba(255,255,255,0.95)",
              marginTop: Math.round(size * 0.015),
              elevation: 1,
            }}
          />
        </View>
      )}

      {/* ── CHARACTER IMAGE ── */}
      <Animated.View
        style={{
          transform: [
            { translateY: totalY as unknown as number },
            { translateX: sway as unknown as number },
            { rotate: rotateInterp },
            { scale: breathe as unknown as number },
          ],
        }}
      >
        {/* Soft radial glow — ensures character is visible on any dark background */}
        <View
          style={{
            position: "absolute",
            width: size * 0.88,
            height: size * 0.88,
            borderRadius: (size * 0.88) / 2,
            backgroundColor: hero === "girl"
              ? "rgba(255,180,230,0.28)"
              : "rgba(180,215,255,0.22)",
            alignSelf: "center",
            top: size * 0.06,
          }}
        />
        <Image
          source={hero === "girl" ? luluImg : adamImg}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}
