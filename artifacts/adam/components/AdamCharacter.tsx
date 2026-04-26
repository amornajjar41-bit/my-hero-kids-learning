import React, { useEffect, useRef } from "react";
import { Animated, Easing, View, type ViewStyle } from "react-native";
import Svg, { Circle, Ellipse, G, Path, Rect, Line } from "react-native-svg";

export type CharacterPose =
  | "normal"
  | "talking"
  | "thinking"
  | "happy"
  | "excited"
  | "sleeping";

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

type Props = {
  hero?: "boy" | "girl";
  size?: number;
  pose?: CharacterPose;
  bobbing?: boolean;
  style?: ViewStyle;
};

// ViewBox canvas
const VW = 200;
const VH = 320;

// ── Colour palettes ──────────────────────────────────────────────────────────
const BOY = {
  skin: "#F5C5A0", skinShad: "#E0A87A",
  hair: "#6B3A1F", hairHigh: "#9B5930", hairShad: "#4A2510",
  mask: "#1D4ED8", maskRim: "#1E40AF",
  suit: "#2563EB", suitShad: "#1D4ED8", suitEdge: "#1E40AF",
  cape: "#EF4444", capeShad: "#B91C1C", capeEdge: "#7F1D1D",
  glove: "#374151", gloveShad: "#1F2937",
  belt: "#1F2937", buckle: "#F59E0B", buckleHigh: "#FDE68A",
  boot: "#EF4444", bootShad: "#B91C1C",
  eye: "#2563EB", eyeShad: "#1D4ED8",
  iris: "#60A5FA",
};

const GIRL = {
  skin: "#F5C5A0", skinShad: "#E0A87A",
  hair: "#C07A2A", hairHigh: "#F0B060", hairShad: "#7A4A10",
  mask: "#9333EA", maskRim: "#7E22CE",
  suit: "#EC4899", suitShad: "#BE185D", suitEdge: "#9D174D",
  cape: "#9333EA", capeShad: "#6B21A8", capeEdge: "#4C1D95",
  glove: "#BE185D", gloveShad: "#9D174D",
  belt: "#1F2937", buckle: "#F59E0B", buckleHigh: "#FDE68A",
  boot: "#9333EA", bootShad: "#6B21A8",
  eye: "#9333EA", eyeShad: "#7E22CE",
  iris: "#C084FC",
};

// ── Hair paths ───────────────────────────────────────────────────────────────
function BoyHair({ c }: { c: typeof BOY }) {
  return (
    <G>
      {/* Main hair cap */}
      <Path
        d="M 56,98 C 50,78 50,45 62,30 C 72,18 88,14 100,14 C 112,14 128,18 138,30 C 150,45 150,78 144,98 C 140,80 128,66 120,64 C 110,60 100,60 90,64 C 72,66 60,80 56,98 Z"
        fill={c.hair}
      />
      {/* Left side sideburn/wave */}
      <Path
        d="M 56,98 C 50,82 48,60 54,42 C 50,58 50,78 56,98 Z"
        fill={c.hairShad}
      />
      {/* Right side */}
      <Path
        d="M 144,98 C 150,82 152,60 146,42 C 150,58 150,78 144,98 Z"
        fill={c.hairShad}
      />
      {/* Front wave - left bump */}
      <Path
        d="M 56,62 C 52,48 54,32 64,26 C 56,34 52,50 58,64 Z"
        fill={c.hair}
      />
      {/* Front wave - right bump */}
      <Path
        d="M 144,62 C 148,48 146,32 136,26 C 144,34 148,50 142,64 Z"
        fill={c.hair}
      />
      {/* Top center crown */}
      <Path
        d="M 80,18 C 86,12 100,10 114,16 C 100,11 84,13 80,18 Z"
        fill={c.hairHigh}
        opacity={0.7}
      />
      {/* Hair highlight sheen */}
      <Path
        d="M 72,36 C 80,26 100,22 116,28 C 98,22 78,28 72,36 Z"
        fill={c.hairHigh}
        opacity={0.5}
      />
    </G>
  );
}

function GirlHair({ c }: { c: typeof GIRL }) {
  return (
    <G>
      {/* Main hair cap */}
      <Path
        d="M 56,98 C 50,78 50,44 64,28 C 74,16 88,12 100,12 C 112,12 126,16 136,28 C 150,44 150,78 144,98 C 140,80 128,66 120,64 C 110,60 100,60 90,64 C 72,66 60,80 56,98 Z"
        fill={c.hair}
      />
      {/* Long flowing hair - right side */}
      <Path
        d="M 144,98 C 148,115 150,140 148,165 C 155,145 155,115 144,98 Z"
        fill={c.hair}
      />
      {/* Long flowing hair - left side */}
      <Path
        d="M 56,98 C 52,115 50,140 52,165 C 45,145 45,115 56,98 Z"
        fill={c.hair}
      />
      {/* Top bun */}
      <Ellipse cx="122" cy="18" rx="18" ry="16" fill={c.hair} />
      <Ellipse cx="122" cy="18" rx="14" ry="12" fill={c.hairHigh} opacity={0.5} />
      {/* Bun connection */}
      <Path d="M 108,24 C 112,20 118,18 130,22 C 122,18 108,22 108,28 Z" fill={c.hair} />
      {/* Hair highlight */}
      <Path
        d="M 68,32 C 76,22 96,16 114,20 C 96,14 74,22 68,32 Z"
        fill={c.hairHigh}
        opacity={0.55}
      />
      {/* Ponytail strand at right */}
      <Path
        d="M 140,60 C 148,70 155,90 153,115 C 150,90 146,68 140,60 Z"
        fill={c.hairShad}
        opacity={0.8}
      />
    </G>
  );
}

// ── Cape paths ───────────────────────────────────────────────────────────────
function Cape({ c }: { c: typeof BOY }) {
  return (
    <G>
      {/* Main cape body */}
      <Path
        d="M 68,152 C 52,158 28,185 12,240 C 8,270 10,305 14,315 L 186,315 C 190,305 192,270 188,240 C 172,185 148,158 132,152 C 122,158 112,163 100,163 C 88,163 78,158 68,152 Z"
        fill={c.cape}
      />
      {/* Cape left fold */}
      <Path
        d="M 68,152 C 52,158 28,185 12,240 C 30,200 50,170 68,158 C 78,160 88,163 100,163 Z"
        fill={c.capeShad}
        opacity={0.55}
      />
      {/* Cape right fold */}
      <Path
        d="M 132,152 C 148,158 172,185 188,240 C 170,200 150,170 132,158 C 122,160 112,163 100,163 Z"
        fill={c.capeShad}
        opacity={0.35}
      />
      {/* Cape top collar */}
      <Path
        d="M 68,152 C 78,156 88,160 100,160 C 112,160 122,156 132,152 C 126,148 114,144 100,144 C 86,144 74,148 68,152 Z"
        fill={c.capeEdge}
        opacity={0.7}
      />
    </G>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function AdamCharacter({
  hero = "boy",
  size = 200,
  pose = "normal",
  style,
}: Props) {
  const isGirl = hero === "girl";
  const c = isGirl ? GIRL : BOY;
  const aspectRatio = VW / VH;
  const svgH = size;
  const svgW = size * aspectRatio;

  // ── Animated values ────────────────────────────────────────────────────────
  const bodyY     = useRef(new Animated.Value(0)).current;
  const lArmRot   = useRef(new Animated.Value(20)).current;
  const rArmRot   = useRef(new Animated.Value(-20)).current;
  const headRot   = useRef(new Animated.Value(0)).current;
  const mouthH    = useRef(new Animated.Value(5)).current;
  const eyeBlink  = useRef(new Animated.Value(0)).current; // 0=open,1=closed
  const lLegShift = useRef(new Animated.Value(0)).current;
  const rLegShift = useRef(new Animated.Value(0)).current;

  // ── SVG transform strings via interpolation ────────────────────────────────
  // Left arm pivots at left shoulder (65, 158)
  const lArmXf = lArmRot.interpolate({
    inputRange: [-180, 180],
    outputRange: ["rotate(-180, 65, 158)", "rotate(180, 65, 158)"],
  });
  // Right arm pivots at right shoulder (135, 158)
  const rArmXf = rArmRot.interpolate({
    inputRange: [-180, 180],
    outputRange: ["rotate(-180, 135, 158)", "rotate(180, 135, 158)"],
  });
  // Head pivots at neck base (100, 88)
  const headXf = headRot.interpolate({
    inputRange: [-30, 30],
    outputRange: ["rotate(-30, 100, 88)", "rotate(30, 100, 88)"],
  });

  // Eyelid heights (0 = open, full = closed)
  const lLidH = eyeBlink.interpolate({ inputRange: [0, 1], outputRange: [0, 26] });
  const rLidH = eyeBlink.interpolate({ inputRange: [0, 1], outputRange: [0, 26] });

  // Mouth top Y (shifts up as mouth opens to keep it anchored at top)
  const mouthTop = mouthH.interpolate({ inputRange: [3, 18], outputRange: [125, 118] });

  // ── Auto-blink ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const blink = () => {
      if (cancelled) return;
      Animated.sequence([
        Animated.timing(eyeBlink, { toValue: 1, duration: 75, useNativeDriver: false }),
        Animated.timing(eyeBlink, { toValue: 0, duration: 75, useNativeDriver: false }),
      ]).start(() => {
        if (!cancelled) setTimeout(blink, 2600 + Math.random() * 2000);
      });
    };
    const t = setTimeout(blink, 800 + Math.random() * 800);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const stopAll = () => {
    [bodyY, lArmRot, rArmRot, headRot, mouthH, lLegShift, rLegShift].forEach((v) =>
      v.stopAnimation(),
    );
  };
  const anim = (v: Animated.Value, to: number, dur = 380) =>
    Animated.timing(v, { toValue: to, duration: dur, useNativeDriver: false });
  const lp = (a: Animated.CompositeAnimation) => Animated.loop(a);
  const seq = (...steps: Animated.CompositeAnimation[]) => Animated.sequence(steps);

  // ── Pose animations ────────────────────────────────────────────────────────
  useEffect(() => {
    stopAll();
    if (pose === "normal") {
      lp(seq(anim(bodyY, -6, 1100), anim(bodyY, 0, 1100))).start();
      anim(lArmRot, 20).start();
      anim(rArmRot, -20).start();
      anim(mouthH, 5, 200).start();
      anim(headRot, 0).start();
    }
    if (pose === "talking") {
      lp(seq(anim(bodyY, -4, 280), anim(bodyY, 0, 280))).start();
      lp(seq(anim(mouthH, 18, 170), anim(mouthH, 4, 170))).start();
      lp(seq(anim(lArmRot, -30, 360), anim(lArmRot, 20, 360))).start();
      anim(rArmRot, -12).start();
    }
    if (pose === "thinking") {
      lp(seq(anim(bodyY, -3, 1500), anim(bodyY, 3, 1500))).start();
      anim(headRot, -13, 450).start();
      anim(rArmRot, -82, 500).start();
      anim(lArmRot, 35, 300).start();
      anim(mouthH, 4, 200).start();
    }
    if (pose === "happy") {
      lp(seq(anim(bodyY, -16, 340), anim(bodyY, 0, 340))).start();
      lp(seq(anim(lArmRot, -105, 300), anim(lArmRot, -65, 300))).start();
      lp(seq(anim(rArmRot, 105, 300), anim(rArmRot, 65, 300))).start();
      lp(seq(anim(lLegShift, -12, 300), anim(lLegShift, 0, 300))).start();
      lp(seq(anim(rLegShift, 0, 300), anim(rLegShift, -12, 300))).start();
      anim(mouthH, 14, 200).start();
      anim(headRot, 0, 200).start();
    }
    if (pose === "excited") {
      lp(seq(anim(bodyY, -24, 240), anim(bodyY, 0, 240))).start();
      lp(seq(anim(lArmRot, -130, 210), anim(lArmRot, -20, 210))).start();
      lp(seq(anim(rArmRot, 130, 210), anim(rArmRot, 20, 210))).start();
      lp(seq(anim(lLegShift, -20, 210), anim(lLegShift, 0, 210))).start();
      lp(seq(anim(rLegShift, 0, 210), anim(rLegShift, -20, 210))).start();
      anim(mouthH, 18, 200).start();
    }
    if (pose === "sleeping") {
      lp(seq(anim(bodyY, -3, 2200), anim(bodyY, 3, 2200))).start();
      anim(lArmRot, 48, 600).start();
      anim(rArmRot, -48, 600).start();
      anim(headRot, 14, 700).start();
      anim(mouthH, 4, 400).start();
      Animated.timing(eyeBlink, { toValue: 1, duration: 500, useNativeDriver: false }).start();
    }
  }, [pose]);

  // ── Leg translate transforms ───────────────────────────────────────────────
  const lLegXf = lLegShift.interpolate({
    inputRange: [-30, 30],
    outputRange: ["translate(0,-30)", "translate(0,30)"],
  });
  const rLegXf = rLegShift.interpolate({
    inputRange: [-30, 30],
    outputRange: ["translate(0,-30)", "translate(0,30)"],
  });

  return (
    <Animated.View
      style={[
        { width: svgW, height: svgH, overflow: "visible" },
        style,
        { transform: [{ translateY: bodyY }] },
      ]}
    >
      <Svg
        viewBox={`0 0 ${VW} ${VH}`}
        width={svgW}
        height={svgH}
        style={{ overflow: "visible" }}
      >
        {/* ── Shadow ── */}
        <Ellipse cx="100" cy="315" rx="58" ry="10" fill="rgba(0,0,0,0.13)" />

        {/* ── Cape (behind everything) ── */}
        <Cape c={c} />

        {/* ── Legs ── */}
        <AnimatedG transform={lLegXf}>
          {/* Left leg */}
          <Rect x="70" y="232" width="28" height="72" rx="14" fill={c.suit} />
          <Rect x="68" y="228" width="32" height="16" rx="8" fill={c.suitShad} />
          {/* Left boot */}
          <Ellipse cx="84" cy="304" rx="18" ry="14" fill={c.boot} />
          <Rect x="66" y="294" width="36" height="20" rx="10" fill={c.boot} />
          <Rect x="66" y="310" width="36" height="8" rx="4" fill={c.bootShad} />
        </AnimatedG>
        <AnimatedG transform={rLegXf}>
          {/* Right leg */}
          <Rect x="102" y="232" width="28" height="72" rx="14" fill={c.suit} />
          <Rect x="100" y="228" width="32" height="16" rx="8" fill={c.suitShad} />
          {/* Right boot */}
          <Ellipse cx="116" cy="304" rx="18" ry="14" fill={c.boot} />
          <Rect x="98" y="294" width="36" height="20" rx="10" fill={c.boot} />
          <Rect x="98" y="310" width="36" height="8" rx="4" fill={c.bootShad} />
        </AnimatedG>

        {/* ── Left Arm ── */}
        <AnimatedG transform={lArmXf}>
          {/* Upper arm */}
          <Rect x="40" y="158" width="26" height="68" rx="13" fill={c.suit} />
          {/* Shoulder cap */}
          <Ellipse cx="53" cy="162" rx="16" ry="12" fill={c.suitShad} />
          {/* Glove */}
          <Ellipse cx="53" cy="234" rx="17" ry="15" fill={c.glove} />
          <Ellipse cx="53" cy="232" rx="14" ry="10" fill={c.gloveShad} opacity={0.5} />
          {/* Knuckle line */}
          <Line x1="42" y1="234" x2="64" y2="234" stroke={c.gloveShad} strokeWidth="2" strokeLinecap="round" />
        </AnimatedG>

        {/* ── Right Arm ── */}
        <AnimatedG transform={rArmXf}>
          {/* Upper arm */}
          <Rect x="134" y="158" width="26" height="68" rx="13" fill={c.suit} />
          {/* Shoulder cap */}
          <Ellipse cx="147" cy="162" rx="16" ry="12" fill={c.suitShad} />
          {/* Glove */}
          <Ellipse cx="147" cy="234" rx="17" ry="15" fill={c.glove} />
          <Ellipse cx="147" cy="232" rx="14" ry="10" fill={c.gloveShad} opacity={0.5} />
          <Line x1="136" y1="234" x2="158" y2="234" stroke={c.gloveShad} strokeWidth="2" strokeLinecap="round" />
        </AnimatedG>

        {/* ── Body / Torso ── */}
        <Rect x="64" y="148" width="72" height="86" rx="16" fill={c.suit} />
        {/* Suit left shading */}
        <Path d="M 64,160 C 64,152 70,148 80,148 L 80,234 C 70,234 64,230 64,220 Z" fill={c.suitShad} opacity={0.4} />
        {/* Suit right shading */}
        <Path d="M 136,160 C 136,152 130,148 120,148 L 120,234 C 130,234 136,230 136,220 Z" fill={c.suitShad} opacity={0.25} />
        {/* Center chest line */}
        <Line x1="100" y1="152" x2="100" y2="215" stroke={c.suitEdge} strokeWidth="2" opacity={0.4} />

        {/* ── Belt ── */}
        <Rect x="64" y="214" width="72" height="20" rx="4" fill={c.belt} />
        {/* Buckle */}
        <Ellipse cx="100" cy="224" rx="14" ry="10" fill={c.buckle} />
        <Ellipse cx="100" cy="223" rx="10" ry="7" fill={c.buckleHigh} />
        <Ellipse cx="98" cy="221" rx="4" ry="3" fill="#FFF" opacity={0.4} />

        {/* ── Neck ── */}
        <Rect x="88" y="136" width="24" height="18" rx="8" fill={c.skin} />
        <Rect x="90" y="136" width="20" height="6" rx="3" fill={c.skinShad} opacity={0.3} />

        {/* ── Head ── */}
        <AnimatedG transform={headXf}>
          {/* Ear left */}
          <Ellipse cx="57" cy="94" rx="9" ry="12" fill={c.skin} />
          <Ellipse cx="57" cy="94" rx="5" ry="8" fill={c.skinShad} opacity={0.35} />
          {/* Ear right */}
          <Ellipse cx="143" cy="94" rx="9" ry="12" fill={c.skin} />
          <Ellipse cx="143" cy="94" rx="5" ry="8" fill={c.skinShad} opacity={0.35} />

          {/* Face main oval */}
          <Ellipse cx="100" cy="90" rx="44" ry="50" fill={c.skin} />
          {/* Jaw shading */}
          <Ellipse cx="100" cy="118" rx="36" ry="22" fill={c.skinShad} opacity={0.18} />
          {/* Cheekbone highlight */}
          <Ellipse cx="80" cy="78" rx="12" ry="8" fill="#FFF" opacity={0.18} />
          <Ellipse cx="120" cy="78" rx="12" ry="8" fill="#FFF" opacity={0.12} />

          {/* ── HAIR (rendered over face at top) ── */}
          {isGirl ? <GirlHair c={c as typeof GIRL} /> : <BoyHair c={c as typeof BOY} />}

          {/* ── Mask ── */}
          <Path
            d={
              // Mask band across eyes with eye-cup cutouts
              "M 56,86 " +
              "C 56,74 64,66 76,64 " +
              "C 80,63 83,64 85,66 " +
              "L 100,72 " +
              "L 115,66 " +
              "C 117,64 120,63 124,64 " +
              "C 136,66 144,74 144,86 " +
              "C 144,96 136,102 126,102 " +
              "C 122,102 118,100 116,97 " +
              "L 100,90 " +
              "L 84,97 " +
              "C 82,100 78,102 74,102 " +
              "C 64,102 56,96 56,86 Z"
            }
            fill={c.mask}
          />
          {/* Mask rim highlight */}
          <Path
            d={
              "M 56,86 C 56,74 64,66 76,64 C 80,63 83,64 85,66 L 100,72 L 115,66 C 117,64 120,63 124,64 C 136,66 144,74 144,86"
            }
            stroke={c.maskRim}
            strokeWidth="2.5"
            fill="none"
            opacity={0.6}
          />
          {/* Mask gloss */}
          <Path
            d="M 62,80 C 66,70 80,66 92,70"
            stroke="#FFF"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            opacity={0.25}
          />

          {/* ── Eyes ── */}
          {/* Left eye white */}
          <Ellipse cx="78" cy="84" rx="15" ry="16" fill="#FFFFFF" />
          {/* Left iris */}
          <Ellipse cx="78" cy="85" rx="10" ry="11" fill={c.eye} />
          {/* Left iris sheen */}
          <Ellipse cx="78" cy="85" rx="7" ry="8" fill={c.iris} opacity={0.7} />
          {/* Left pupil */}
          <Circle cx="79" cy="86" r="5.5" fill="#0F172A" />
          {/* Left highlight large */}
          <Circle cx="81" cy="81" r="3" fill="#FFFFFF" />
          {/* Left highlight small */}
          <Circle cx="76" cy="87" r="1.3" fill="#FFFFFF" opacity={0.7} />

          {/* Right eye white */}
          <Ellipse cx="122" cy="84" rx="15" ry="16" fill="#FFFFFF" />
          {/* Right iris */}
          <Ellipse cx="122" cy="85" rx="10" ry="11" fill={c.eye} />
          {/* Right iris sheen */}
          <Ellipse cx="122" cy="85" rx="7" ry="8" fill={c.iris} opacity={0.7} />
          {/* Right pupil */}
          <Circle cx="123" cy="86" r="5.5" fill="#0F172A" />
          {/* Right highlight large */}
          <Circle cx="125" cy="81" r="3" fill="#FFFFFF" />
          {/* Right highlight small */}
          <Circle cx="120" cy="87" r="1.3" fill="#FFFFFF" opacity={0.7} />

          {/* ── Eyelids (blink overlay — same color as face) ── */}
          <AnimatedRect x="63" y="68" width="30" height={lLidH} rx="14" fill={c.skin} />
          <AnimatedRect x="107" y="68" width="30" height={rLidH} rx="14" fill={c.skin} />

          {/* ── Eyebrows ── */}
          <Path
            d="M 63,69 C 68,62 86,60 92,66"
            stroke={c.hair}
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d="M 137,69 C 132,62 114,60 108,66"
            stroke={c.hair}
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* ── Nose ── */}
          <Path
            d="M 96,108 C 96,114 100,116 104,114 C 100,116 94,114 94,110"
            stroke={c.skinShad}
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />

          {/* ── Mouth ── */}
          {/* Smile base arc */}
          <Path
            d="M 86,126 C 90,133 110,133 114,126"
            stroke="#CC7070"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          {/* Animated open mouth */}
          <AnimatedRect
            x="88"
            y={mouthTop as unknown as number}
            width="24"
            height={mouthH as unknown as number}
            rx="7"
            fill="#CC5555"
          />
          {/* Teeth */}
          <AnimatedRect
            x="90"
            y={mouthTop as unknown as number}
            width="20"
            height={mouthH.interpolate({ inputRange: [3, 18], outputRange: [0, 8] }) as unknown as number}
            rx="3"
            fill="#FFFFFF"
          />

          {/* ── Cheeks ── */}
          <Ellipse cx="64" cy="108" rx="13" ry="8" fill="#FFB0B0" opacity={0.38} />
          <Ellipse cx="136" cy="108" rx="13" ry="8" fill="#FFB0B0" opacity={0.38} />
        </AnimatedG>
      </Svg>
    </Animated.View>
  );
}
