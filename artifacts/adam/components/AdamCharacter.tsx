import React, { useEffect, useRef } from "react";
import { Animated, Easing, View, type ViewStyle } from "react-native";

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
  pose?: CharacterPose;
  style?: ViewStyle;
  bobbing?: boolean;
};

// ── Base design canvas ──────────────────────────────────────────────────────
const B_W = 160;
const B_H = 300;

const SKIN = "#FFCBA4";
const EYE_WHITE = "#FFFFFF";
const EYE_PUPIL = "#1E293B";
const MOUTH_C = "#E07070";
const SHOE_C = "#1E293B";
const SHADOW_C = "rgba(0,0,0,0.10)";

const THEME = {
  boy: {
    costume: "#3B82F6",
    costumeDark: "#1D4ED8",
    hair: "#3D1C02",
    hairHL: "#6B3A2A",
    mask: "#1E40AF",
    star: "#FCD34D",
  },
  girl: {
    costume: "#EC4899",
    costumeDark: "#9D174D",
    hair: "#7C2D92",
    hairHL: "#A855F7",
    mask: "#831843",
    star: "#FDE047",
  },
};

// Dimensions
const HEAD_D = 86;
const NECK_W = 22;
const NECK_H = 16;
const BODY_W = 78;
const BODY_H = 88;
const ARM_W = 22;
const ARM_H = 66;
const LEG_W = 26;
const LEG_H = 72;
const SHOE_W = 32;
const SHOE_H = 16;
const EYE_D = 14;
const PUPIL_D = 8;
const MOUTH_W = 26;
const MOUTH_MAX_H = 16;

// Positions
const HEAD_TOP = 2;
const HEAD_LEFT = (B_W - HEAD_D) / 2;
const NECK_TOP = HEAD_TOP + HEAD_D - 6;
const NECK_LEFT = (B_W - NECK_W) / 2;
const BODY_TOP = NECK_TOP + NECK_H - 4;
const BODY_LEFT = (B_W - BODY_W) / 2;
const SHOULDER_Y = BODY_TOP + 6;
const L_ARM_LEFT = BODY_LEFT - ARM_W + 4;
const R_ARM_LEFT = BODY_LEFT + BODY_W - 4;
const LEG_TOP = BODY_TOP + BODY_H - 14;
const L_LEG_LEFT = BODY_LEFT + 6;
const R_LEG_LEFT = BODY_LEFT + BODY_W - LEG_W - 6;
const SHOE_TOP = LEG_TOP + LEG_H - 4;
const L_SHOE_LEFT = L_LEG_LEFT - 4;
const R_SHOE_LEFT = R_LEG_LEFT - 4;
const SHADOW_TOP = SHOE_TOP + SHOE_H;

// Eye positions inside head
const EYE_Y = HEAD_D * 0.40;
const L_EYE_X = HEAD_D * 0.18;
const R_EYE_X = HEAD_D * 0.52;
const MOUTH_Y = HEAD_D * 0.66;
const MOUTH_X = (HEAD_D - MOUTH_W) / 2;

// ── Main component ──────────────────────────────────────────────────────────
export function AdamCharacter({
  hero = "boy",
  size = 200,
  pose = "normal",
  style,
}: Props) {
  const scale = size / B_H;
  const th = THEME[hero === "girl" ? "girl" : "boy"];

  // Animated values
  const bodyY    = useRef(new Animated.Value(0)).current;
  const lArmRot  = useRef(new Animated.Value(20)).current;
  const rArmRot  = useRef(new Animated.Value(-20)).current;
  const lLegY    = useRef(new Animated.Value(0)).current;
  const rLegY    = useRef(new Animated.Value(0)).current;
  const mouthH   = useRef(new Animated.Value(6)).current;
  const eyeScale = useRef(new Animated.Value(1)).current;
  const headRot  = useRef(new Animated.Value(0)).current;
  const bodyRot  = useRef(new Animated.Value(0)).current;

  // Auto-blink loop (independent of pose)
  useEffect(() => {
    let cancelled = false;
    const doBlink = () => {
      if (cancelled) return;
      Animated.sequence([
        Animated.timing(eyeScale, { toValue: 0.08, duration: 70, useNativeDriver: false }),
        Animated.timing(eyeScale, { toValue: 1, duration: 70, useNativeDriver: false }),
      ]).start(() => {
        if (!cancelled) setTimeout(doBlink, 2800 + Math.random() * 2000);
      });
    };
    const t = setTimeout(doBlink, 1200 + Math.random() * 1000);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  // Stop all pose-driven animations
  const stopAll = () => {
    bodyY.stopAnimation();
    lArmRot.stopAnimation();
    rArmRot.stopAnimation();
    lLegY.stopAnimation();
    rLegY.stopAnimation();
    mouthH.stopAnimation();
    headRot.stopAnimation();
    bodyRot.stopAnimation();
  };

  const t = (val: Animated.Value, to: number, dur = 350) =>
    Animated.timing(val, { toValue: to, duration: dur, useNativeDriver: false });

  const loop = (a: Animated.CompositeAnimation) => Animated.loop(a);

  useEffect(() => {
    stopAll();

    if (pose === "normal") {
      loop(Animated.sequence([
        t(bodyY, -5, 1100),
        t(bodyY, 0, 1100),
      ])).start();
      t(lArmRot, 20, 400).start();
      t(rArmRot, -20, 400).start();
      t(mouthH, 5, 200).start();
      t(headRot, 0, 300).start();
      t(bodyRot, 0, 300).start();
    }

    if (pose === "talking") {
      loop(Animated.sequence([t(bodyY, -3, 280), t(bodyY, 0, 280)])).start();
      loop(Animated.sequence([t(mouthH, MOUTH_MAX_H, 180), t(mouthH, 4, 180)])).start();
      loop(Animated.sequence([t(lArmRot, -25, 350), t(lArmRot, 20, 350)])).start();
      t(rArmRot, -15, 300).start();
    }

    if (pose === "thinking") {
      loop(Animated.sequence([t(bodyY, -2, 1600), t(bodyY, 2, 1600)])).start();
      t(headRot, -12, 450).start();
      t(rArmRot, -80, 500).start();
      t(lArmRot, 30, 300).start();
      t(mouthH, 4, 200).start();
    }

    if (pose === "happy") {
      loop(Animated.sequence([
        t(bodyY, -14, 360),
        t(bodyY, 0, 360),
      ])).start();
      loop(Animated.sequence([t(lArmRot, -100, 320), t(lArmRot, -60, 320)])).start();
      loop(Animated.sequence([t(rArmRot, 100, 320), t(rArmRot, 60, 320)])).start();
      loop(Animated.sequence([t(lLegY, -10, 320), t(lLegY, 0, 320)])).start();
      loop(Animated.sequence([t(rLegY, 0, 320), t(rLegY, -10, 320)])).start();
      t(mouthH, 12, 200).start();
      t(headRot, 0, 200).start();
    }

    if (pose === "excited") {
      loop(Animated.sequence([
        t(bodyY, -22, 260),
        t(bodyY, 0, 260),
      ])).start();
      loop(Animated.sequence([
        t(lArmRot, -130, 220),
        t(lArmRot, -20, 220),
      ])).start();
      loop(Animated.sequence([
        t(rArmRot, 130, 220),
        t(rArmRot, 20, 220),
      ])).start();
      loop(Animated.sequence([t(lLegY, -18, 220), t(lLegY, 0, 220)])).start();
      loop(Animated.sequence([t(rLegY, 0, 220), t(rLegY, -18, 220)])).start();
      loop(Animated.sequence([t(bodyRot, -8, 200), t(bodyRot, 8, 200)])).start();
      t(mouthH, MOUTH_MAX_H, 200).start();
    }

    if (pose === "sleeping") {
      loop(Animated.sequence([t(bodyY, -2, 2200), t(bodyY, 3, 2200)])).start();
      t(lArmRot, 45, 600).start();
      t(rArmRot, -45, 600).start();
      t(headRot, 12, 700).start();
      t(mouthH, 6, 400).start();
      Animated.timing(eyeScale, { toValue: 0.05, duration: 500, useNativeDriver: false }).start();
    }
  }, [pose]);

  // Interpolated rotation strings
  const lArmDeg = lArmRot.interpolate({ inputRange: [-180, 180], outputRange: ["-180deg", "180deg"] });
  const rArmDeg = rArmRot.interpolate({ inputRange: [-180, 180], outputRange: ["-180deg", "180deg"] });
  const headDeg = headRot.interpolate({ inputRange: [-45, 45], outputRange: ["-45deg", "45deg"] });
  const bodyDeg = bodyRot.interpolate({ inputRange: [-20, 20], outputRange: ["-20deg", "20deg"] });

  const renderHair = () => {
    if (hero === "boy") {
      return (
        <>
          <View style={{ position: "absolute", top: -3, left: 8, right: 8, height: 30, borderRadius: 28, backgroundColor: th.hair }} />
          <View style={{ position: "absolute", top: 4, left: -2, width: 14, height: 26, borderRadius: 10, backgroundColor: th.hair }} />
          <View style={{ position: "absolute", top: 4, right: -2, width: 14, height: 22, borderRadius: 10, backgroundColor: th.hair }} />
        </>
      );
    }
    return (
      <>
        <View style={{ position: "absolute", top: -6, left: 6, right: 6, height: 34, borderRadius: 30, backgroundColor: th.hair }} />
        <View style={{ position: "absolute", top: -14, left: HEAD_D / 2 - 15, width: 30, height: 30, borderRadius: 15, backgroundColor: th.hair }} />
        <View style={{ position: "absolute", top: 4, right: -4, width: 12, height: 36, borderRadius: 8, backgroundColor: th.hairHL }} />
      </>
    );
  };

  const renderStarOrBadge = () => (
    <View style={{ alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 17, backgroundColor: th.star }}>
      <View style={{ width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 14, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: "#FFF" }} />
    </View>
  );

  const containerW = B_W * scale;
  const containerH = (B_H + 20) * scale;

  return (
    <View style={[{ width: containerW, height: containerH, overflow: "visible" }, style]}>
      <View
        style={{
          width: B_W,
          height: B_H + 20,
          transform: [
            { translateX: -(B_W * (1 - scale)) / 2 },
            { translateY: -((B_H + 20) * (1 - scale)) / 2 },
            { scale },
          ],
        }}
      >
        {/* All character parts move together with body bob */}
        <Animated.View
          style={{
            position: "absolute",
            left: 0, top: 0,
            width: B_W, height: B_H + 20,
            transform: [{ translateY: bodyY }, { rotate: bodyDeg }],
          }}
        >
          {/* Shadow */}
          <View style={{
            position: "absolute",
            width: 70, height: 14,
            borderRadius: 7,
            backgroundColor: SHADOW_C,
            top: SHADOW_TOP,
            left: (B_W - 70) / 2,
            zIndex: 0,
          }} />

          {/* Cape behind body */}
          <View style={{
            position: "absolute",
            width: BODY_W + 20, height: BODY_H * 0.9,
            borderRadius: 8,
            backgroundColor: th.costumeDark,
            top: BODY_TOP + 8,
            left: BODY_LEFT - 10,
            zIndex: 1,
          }} />

          {/* Left Arm */}
          <Animated.View style={{
            position: "absolute",
            width: ARM_W, height: ARM_H,
            borderRadius: ARM_W / 2,
            backgroundColor: th.costume,
            top: SHOULDER_Y,
            left: L_ARM_LEFT,
            zIndex: 3,
            transform: [
              { translateY: -(ARM_H / 2) },
              { rotate: lArmDeg },
              { translateY: ARM_H / 2 },
            ],
          }}>
            {/* Hand */}
            <View style={{
              position: "absolute", bottom: -8,
              width: ARM_W + 2, height: ARM_W + 2,
              borderRadius: (ARM_W + 2) / 2,
              backgroundColor: SKIN,
              left: -1,
            }} />
          </Animated.View>

          {/* Right Arm */}
          <Animated.View style={{
            position: "absolute",
            width: ARM_W, height: ARM_H,
            borderRadius: ARM_W / 2,
            backgroundColor: th.costume,
            top: SHOULDER_Y,
            left: R_ARM_LEFT,
            zIndex: 3,
            transform: [
              { translateY: -(ARM_H / 2) },
              { rotate: rArmDeg },
              { translateY: ARM_H / 2 },
            ],
          }}>
            {/* Hand */}
            <View style={{
              position: "absolute", bottom: -8,
              width: ARM_W + 2, height: ARM_W + 2,
              borderRadius: (ARM_W + 2) / 2,
              backgroundColor: SKIN,
              left: -1,
            }} />
          </Animated.View>

          {/* Body / Torso */}
          <View style={{
            position: "absolute",
            width: BODY_W, height: BODY_H,
            borderRadius: 22,
            backgroundColor: th.costume,
            top: BODY_TOP, left: BODY_LEFT,
            zIndex: 4,
            alignItems: "center",
            justifyContent: "center",
          }}>
            {renderStarOrBadge()}
          </View>

          {/* Neck */}
          <View style={{
            position: "absolute",
            width: NECK_W, height: NECK_H + 4,
            backgroundColor: SKIN,
            top: NECK_TOP, left: NECK_LEFT,
            zIndex: 5,
          }} />

          {/* HEAD */}
          <Animated.View style={{
            position: "absolute",
            width: HEAD_D, height: HEAD_D,
            borderRadius: HEAD_D / 2,
            backgroundColor: SKIN,
            top: HEAD_TOP, left: HEAD_LEFT,
            zIndex: 6,
            transform: [{ rotate: headDeg }],
          }}>
            {renderHair()}

            {/* Hero mask */}
            <View style={{
              position: "absolute",
              top: EYE_Y - 6,
              left: HEAD_D * 0.08,
              right: HEAD_D * 0.08,
              height: EYE_D + 10,
              borderRadius: 6,
              backgroundColor: th.mask,
              opacity: 0.88,
              zIndex: 1,
            }} />

            {/* Left Eye */}
            <View style={{
              position: "absolute",
              width: EYE_D, height: EYE_D,
              borderRadius: EYE_D / 2,
              backgroundColor: EYE_WHITE,
              top: EYE_Y, left: L_EYE_X,
              zIndex: 2,
              alignItems: "center", justifyContent: "center",
            }}>
              <Animated.View style={{
                width: PUPIL_D, height: PUPIL_D,
                borderRadius: PUPIL_D / 2,
                backgroundColor: EYE_PUPIL,
                transform: [{ scaleY: eyeScale }],
              }} />
              <View style={{
                position: "absolute", top: 2, left: 2,
                width: 4, height: 4, borderRadius: 2,
                backgroundColor: "#FFFFFF88",
              }} />
            </View>

            {/* Right Eye */}
            <View style={{
              position: "absolute",
              width: EYE_D, height: EYE_D,
              borderRadius: EYE_D / 2,
              backgroundColor: EYE_WHITE,
              top: EYE_Y, left: R_EYE_X,
              zIndex: 2,
              alignItems: "center", justifyContent: "center",
            }}>
              <Animated.View style={{
                width: PUPIL_D, height: PUPIL_D,
                borderRadius: PUPIL_D / 2,
                backgroundColor: EYE_PUPIL,
                transform: [{ scaleY: eyeScale }],
              }} />
              <View style={{
                position: "absolute", top: 2, left: 2,
                width: 4, height: 4, borderRadius: 2,
                backgroundColor: "#FFFFFF88",
              }} />
            </View>

            {/* Mouth */}
            <Animated.View style={{
              position: "absolute",
              width: MOUTH_W, height: mouthH,
              borderRadius: 8,
              backgroundColor: MOUTH_C,
              top: MOUTH_Y, left: MOUTH_X,
              zIndex: 2,
            }}>
              {/* Teeth */}
              <Animated.View style={{
                position: "absolute", top: 0, left: 4,
                width: MOUTH_W - 8, height: 6,
                borderRadius: 3,
                backgroundColor: "#FFF",
                opacity: mouthH.interpolate({ inputRange: [4, 10], outputRange: [0, 1] }),
              }} />
            </Animated.View>

            {/* Blush cheeks */}
            <View style={{ position: "absolute", width: 12, height: 7, borderRadius: 6, backgroundColor: "rgba(255,130,130,0.35)", top: EYE_Y + EYE_D + 2, left: 6 }} />
            <View style={{ position: "absolute", width: 12, height: 7, borderRadius: 6, backgroundColor: "rgba(255,130,130,0.35)", top: EYE_Y + EYE_D + 2, right: 6 }} />
          </Animated.View>

          {/* Left Leg */}
          <Animated.View style={{
            position: "absolute",
            width: LEG_W, height: LEG_H,
            borderRadius: LEG_W / 2,
            backgroundColor: th.costumeDark,
            top: LEG_TOP, left: L_LEG_LEFT,
            zIndex: 2,
            transform: [{ translateY: lLegY }],
          }} />

          {/* Right Leg */}
          <Animated.View style={{
            position: "absolute",
            width: LEG_W, height: LEG_H,
            borderRadius: LEG_W / 2,
            backgroundColor: th.costumeDark,
            top: LEG_TOP, left: R_LEG_LEFT,
            zIndex: 2,
            transform: [{ translateY: rLegY }],
          }} />

          {/* Left Shoe */}
          <View style={{
            position: "absolute",
            width: SHOE_W, height: SHOE_H,
            borderRadius: SHOE_H / 2,
            backgroundColor: SHOE_C,
            top: SHOE_TOP, left: L_SHOE_LEFT,
            zIndex: 3,
          }} />

          {/* Right Shoe */}
          <View style={{
            position: "absolute",
            width: SHOE_W, height: SHOE_H,
            borderRadius: SHOE_H / 2,
            backgroundColor: SHOE_C,
            top: SHOE_TOP, left: R_SHOE_LEFT,
            zIndex: 3,
          }} />
        </Animated.View>
      </View>
    </View>
  );
}
