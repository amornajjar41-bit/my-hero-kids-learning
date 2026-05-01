import { useState, useEffect } from "react";

type Anim = "idle" | "talking" | "thinking" | "dancing" | "celebrating" | "smiling";

const BUTTONS: { a: Anim; emoji: string; label: string }[] = [
  { a: "idle", emoji: "😊", label: "Idle" },
  { a: "talking", emoji: "🗣️", label: "Talking" },
  { a: "thinking", emoji: "🤔", label: "Thinking" },
  { a: "dancing", emoji: "💃", label: "Dancing" },
  { a: "celebrating", emoji: "🎉", label: "Celebrating" },
  { a: "smiling", emoji: "😁", label: "Smiling" },
];

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #070B14; font-family: 'Nunito', sans-serif; }

  /* ── Float (idle) ── */
  @keyframes float {
    0%,100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  /* ── Breathe (idle torso) ── */
  @keyframes breathe {
    0%,100% { transform: scaleY(1) scaleX(1); }
    50% { transform: scaleY(1.025) scaleX(0.985); }
  }
  /* ── Head nod (talking) ── */
  @keyframes nod {
    0%,100% { transform: rotate(0deg) translateY(0); }
    30% { transform: rotate(-4deg) translateY(2px); }
    65% { transform: rotate(3deg) translateY(-1px); }
  }
  /* ── Head tilt (thinking) ── */
  @keyframes tilt {
    0%,100% { transform: rotate(0deg) translateX(0); }
    50% { transform: rotate(-10deg) translateX(-4px); }
  }
  /* ── Body sway (dancing) ── */
  @keyframes sway {
    0%,100% { transform: rotate(0deg) translateX(0); }
    25% { transform: rotate(-5deg) translateX(-5px); }
    75% { transform: rotate(5deg) translateX(5px); }
  }
  /* ── Arm wave left (dancing) ── */
  @keyframes waveL {
    0%,100% { transform: rotate(0deg); transform-origin: 100% 0%; }
    40% { transform: rotate(-35deg); transform-origin: 100% 0%; }
  }
  /* ── Arm wave right (dancing) ── */
  @keyframes waveR {
    0%,100% { transform: rotate(0deg); transform-origin: 0% 0%; }
    40% { transform: rotate(35deg); transform-origin: 0% 0%; }
  }
  /* ── Celebrate bounce ── */
  @keyframes bounce {
    0%,100% { transform: translateY(0) scale(1); }
    20% { transform: translateY(-22px) scale(1.04); }
    40% { transform: translateY(-6px) scale(1); }
    60% { transform: translateY(-16px) scale(1.03); }
    80% { transform: translateY(-3px) scale(1); }
  }
  /* ── Arms up (celebrating) ── */
  @keyframes armsUp {
    0%,100% { transform: rotate(-40deg); }
    50% { transform: rotate(-55deg); }
  }
  @keyframes armsUpR {
    0%,100% { transform: rotate(40deg); }
    50% { transform: rotate(55deg); }
  }
  /* ── Sparkle pop ── */
  @keyframes sparkle {
    0%,100% { opacity: 0; transform: scale(0) rotate(0deg); }
    30%,70% { opacity: 1; transform: scale(1) rotate(20deg); }
  }
  /* ── Thought bubble fade in ── */
  @keyframes thoughtIn {
    from { opacity: 0; transform: scale(0.5) translateY(8px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  /* ── Cape flow ── */
  @keyframes capeIdle {
    0%,100% { transform: skewX(0deg); }
    50% { transform: skewX(2deg) scaleX(1.01); }
  }
  @keyframes capeDance {
    0%,100% { transform: skewX(-4deg) scaleX(0.98); }
    50% { transform: skewX(6deg) scaleX(1.04); }
  }
  /* ── Cheek glow (smiling) ── */
  @keyframes cheek {
    0%,100% { opacity: 0.4; }
    50% { opacity: 0.7; }
  }
  /* ── Glow pulse (emblem) ── */
  @keyframes emblumGlow {
    0%,100% { opacity: 0.5; r: 14; }
    50% { opacity: 0.9; r: 18; }
  }
  /* ── Ground shadow ── */
  @keyframes groundShadow {
    0%,100% { rx: 28; ry: 6; opacity: 0.35; }
    50% { rx: 22; ry: 4; opacity: 0.2; }
  }
  /* ── Eye squint (smiling/celebrating) ── */
  @keyframes eyeSquint {
    0%,100% { transform: scaleY(1); }
    50% { transform: scaleY(0.7); }
  }
  /* ── Mouth talk open/close ── */
  .mouth-talk { animation: mouthTalk 0.4s ease-in-out infinite; }
  @keyframes mouthTalk { 0%,100%{} 50%{} }

  .char-float { animation: float 3s ease-in-out infinite; }
  .char-breathe { animation: breathe 2.5s ease-in-out infinite; }
  .head-nod { animation: nod 0.6s ease-in-out infinite; }
  .head-tilt { animation: tilt 2s ease-in-out infinite; }
  .body-sway { animation: sway 0.7s ease-in-out infinite; }
  .wave-l { animation: waveL 0.5s ease-in-out infinite alternate; transform-origin: 100% 10%; }
  .wave-r { animation: waveR 0.5s ease-in-out infinite alternate; transform-origin: 0% 10%; }
  .char-bounce { animation: bounce 0.8s ease-in-out infinite; }
  .arms-up-l { animation: armsUp 0.9s ease-in-out infinite; transform-origin: 85% 10%; }
  .arms-up-r { animation: armsUpR 0.9s ease-in-out infinite; transform-origin: 15% 10%; }
  .sparkle-pop { animation: sparkle 1s ease-in-out infinite; }
  .thought-in { animation: thoughtIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  .cape-idle { animation: capeIdle 2.8s ease-in-out infinite; transform-origin: 50% 0%; }
  .cape-dance { animation: capeDance 0.7s ease-in-out infinite; transform-origin: 50% 0%; }
  .cheek-glow { animation: cheek 1.5s ease-in-out infinite; }
  .emblem-glow { animation: emblumGlow 2s ease-in-out infinite; }
`;

/* ─── Gradient / Filter defs ─────────────────────── */
function Defs({ id }: { id: string }) {
  const p = id; // prefix
  return (
    <defs>
      {/* Face skin */}
      <radialGradient id={`${p}face`} cx="40%" cy="34%" r="62%">
        <stop offset="0%" stopColor="#FFE4BA" />
        <stop offset="28%" stopColor="#FFCA8A" />
        <stop offset="60%" stopColor="#F0A860" />
        <stop offset="85%" stopColor="#D8834A" />
        <stop offset="100%" stopColor="#B86030" />
      </radialGradient>
      {/* Face shadow (chin/jaw) */}
      <radialGradient id={`${p}jawShad`} cx="50%" cy="90%" r="55%">
        <stop offset="0%" stopColor="rgba(80,30,0,0.30)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
      </radialGradient>
      {/* Ear */}
      <radialGradient id={`${p}ear`} cx="30%" cy="40%" r="65%">
        <stop offset="0%" stopColor="#FFD09A" />
        <stop offset="100%" stopColor="#C87040" />
      </radialGradient>
      {/* Neck */}
      <linearGradient id={`${p}neck`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#D88040" />
        <stop offset="35%" stopColor="#FFBF70" />
        <stop offset="70%" stopColor="#EFA060" />
        <stop offset="100%" stopColor="#B06030" />
      </linearGradient>
      {/* Hair */}
      <linearGradient id={`${p}hair`} x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%" stopColor="#3A2200" />
        <stop offset="40%" stopColor="#201400" />
        <stop offset="100%" stopColor="#100A00" />
      </linearGradient>
      {/* Cape A = Adam red */}
      <linearGradient id={`${p}capeA`} x1="0%" y1="0%" x2="60%" y2="100%">
        <stop offset="0%" stopColor="#FF6B6B" />
        <stop offset="35%" stopColor="#EF4444" />
        <stop offset="70%" stopColor="#B91C1C" />
        <stop offset="100%" stopColor="#7F1D1D" />
      </linearGradient>
      {/* Cape S = Sara purple */}
      <linearGradient id={`${p}capeS`} x1="0%" y1="0%" x2="60%" y2="100%">
        <stop offset="0%" stopColor="#D946EF" />
        <stop offset="40%" stopColor="#A21CAF" />
        <stop offset="100%" stopColor="#581C87" />
      </linearGradient>
      {/* Suit A = Adam blue */}
      <linearGradient id={`${p}suitA`} x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="25%" stopColor="#3B82F6" />
        <stop offset="55%" stopColor="#1D4ED8" />
        <stop offset="85%" stopColor="#1E3A8A" />
        <stop offset="100%" stopColor="#172554" />
      </linearGradient>
      {/* Suit S = Sara purple */}
      <linearGradient id={`${p}suitS`} x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%" stopColor="#C084FC" />
        <stop offset="25%" stopColor="#A855F7" />
        <stop offset="55%" stopColor="#7C3AED" />
        <stop offset="85%" stopColor="#5B21B6" />
        <stop offset="100%" stopColor="#3B0764" />
      </linearGradient>
      {/* Gold accent */}
      <linearGradient id={`${p}gold`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="30%" stopColor="#F59E0B" />
        <stop offset="65%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#92400E" />
      </linearGradient>
      {/* Pink accent (Sara) */}
      <linearGradient id={`${p}pink`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FDE8FF" />
        <stop offset="40%" stopColor="#F472B6" />
        <stop offset="100%" stopColor="#9D174D" />
      </linearGradient>
      {/* Arm */}
      <linearGradient id={`${p}armA`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="40%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1E3A8A" />
      </linearGradient>
      <linearGradient id={`${p}armS`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#7C3AED" />
        <stop offset="40%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#4C1D95" />
      </linearGradient>
      {/* Leg */}
      <linearGradient id={`${p}legA`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#1E3A8A" />
        <stop offset="50%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#172554" />
      </linearGradient>
      <linearGradient id={`${p}legS`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#4C1D95" />
        <stop offset="50%" stopColor="#7C3AED" />
        <stop offset="100%" stopColor="#2E1065" />
      </linearGradient>
      {/* Boot */}
      <linearGradient id={`${p}boot`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="50%" stopColor="#0F172A" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>
      {/* Iris */}
      <radialGradient id={`${p}irisA`} cx="40%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#7DD3FC" />
        <stop offset="50%" stopColor="#0EA5E9" />
        <stop offset="100%" stopColor="#075985" />
      </radialGradient>
      <radialGradient id={`${p}irisS`} cx="40%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#C4B5FD" />
        <stop offset="50%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#4C1D95" />
      </radialGradient>
      {/* Star emblem */}
      <radialGradient id={`${p}star`} cx="50%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#FEF3C7" />
        <stop offset="40%" stopColor="#FCD34D" />
        <stop offset="80%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#92400E" />
      </radialGradient>
      {/* Drop shadow filter */}
      <filter id={`${p}shadow`} x="-20%" y="-10%" width="140%" height="130%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.5" />
      </filter>
      {/* Glow filter */}
      <filter id={`${p}glow`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      {/* Soft glow filter */}
      <filter id={`${p}softGlow`} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      {/* Hair light */}
      <radialGradient id={`${p}hairLight`} cx="35%" cy="20%" r="50%">
        <stop offset="0%" stopColor="rgba(120,70,10,0.6)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
      </radialGradient>
      {/* Sara hair */}
      <linearGradient id={`${p}hairS`} x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%" stopColor="#7C2D12" />
        <stop offset="40%" stopColor="#431407" />
        <stop offset="100%" stopColor="#1C0A03" />
      </linearGradient>
      <radialGradient id={`${p}hairSLight`} cx="35%" cy="20%" r="50%">
        <stop offset="0%" stopColor="rgba(180,80,30,0.5)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
      </radialGradient>
      {/* Cheek blush */}
      <radialGradient id={`${p}blush`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(255,120,100,0.55)" />
        <stop offset="100%" stopColor="rgba(255,120,100,0)" />
      </radialGradient>
      {/* Muscle highlight on torso */}
      <linearGradient id={`${p}muscleHL`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="rgba(255,255,255,0)" />
        <stop offset="40%" stopColor="rgba(255,255,255,0.12)" />
        <stop offset="60%" stopColor="rgba(255,255,255,0.08)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </linearGradient>
    </defs>
  );
}

/* ─── STAR PATH helper ────────────────────────────── */
function StarPath({ cx, cy, r, ir }: { cx: number; cy: number; r: number; ir: number }) {
  const pts: number[][] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI * 2) / 10 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : ir;
    pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  return <path d={`M ${pts.map(p => p.join(",")).join(" L ")} Z`} />;
}

/* ─── ADAM CHARACTER ─────────────────────────────── */
function AdamSVG({ anim }: { anim: Anim }) {
  const p = "ad_";
  const talking = anim === "talking";
  const thinking = anim === "thinking";
  const dancing = anim === "dancing";
  const celebrating = anim === "celebrating";
  const smiling = anim === "smiling";

  const floatClass = (dancing || celebrating) ? "" : "char-float";
  const bounceClass = celebrating ? "char-bounce" : "";
  const breatheClass = "char-breathe";
  const headClass = talking ? "head-nod" : thinking ? "head-tilt" : "";
  const bodyClass = dancing ? "body-sway" : "";
  const capeCls = dancing ? "cape-dance" : "cape-idle";
  const armLCls = dancing ? "wave-l" : celebrating ? "arms-up-l" : "";
  const armRCls = dancing ? "wave-r" : celebrating ? "arms-up-r" : "";

  // Mouth shape
  const mouthPath = talking
    ? "M 88 106 Q 100 118 112 106" // open/talking (varies)
    : smiling || celebrating
    ? "M 86 103 Q 100 116 114 103" // big smile
    : "M 88 105 Q 100 109 112 105"; // neutral / slight smile

  return (
    <svg viewBox="0 0 200 330" style={{ width: 180, height: 300, filter: `url(#${p}shadow)` }}>
      <Defs id={p} />

      {/* Ground shadow */}
      <ellipse cx="100" cy="324" rx="36" ry="7" fill="rgba(0,0,0,0.45)" />

      <g className={`${floatClass} ${bounceClass}`} style={{ transformOrigin: "100px 300px" }}>

        {/* ── CAPE BACK ── */}
        <g className={capeCls}>
          <path
            d="M 68 128 Q 28 175 32 260 Q 52 290 100 296 Q 148 290 168 260 Q 172 175 132 128 Z"
            fill={`url(#${p}capeA)`}
            opacity="0.97"
          />
          {/* Cape center shadow */}
          <path
            d="M 100 128 Q 95 195 100 260 Q 105 195 100 128 Z"
            fill="rgba(0,0,0,0.18)"
          />
          {/* Cape edge highlight left */}
          <path
            d="M 68 128 Q 38 175 42 245 Q 50 260 60 265 Q 44 200 72 138 Z"
            fill="rgba(255,255,255,0.10)"
          />
        </g>

        {/* ── LEGS ── */}
        <g className={bodyClass} style={{ transformOrigin: "100px 220px" }}>
          {/* Left leg */}
          <rect x="72" y="218" width="25" height="65" rx="8" fill={`url(#${p}legA)`} />
          {/* Left boot */}
          <rect x="68" y="272" width="32" height="22" rx="8" fill={`url(#${p}boot)`} />
          <rect x="68" y="272" width="32" height="7" rx="3" fill={`url(#${p}gold)`} opacity="0.9" />

          {/* Right leg */}
          <rect x="103" y="218" width="25" height="65" rx="8" fill={`url(#${p}legA)`} />
          {/* Right boot */}
          <rect x="100" y="272" width="32" height="22" rx="8" fill={`url(#${p}boot)`} />
          <rect x="100" y="272" width="32" height="7" rx="3" fill={`url(#${p}gold)`} opacity="0.9" />

          {/* ── TORSO ── */}
          <g className={breatheClass} style={{ transformOrigin: "100px 180px" }}>
            {/* Torso base */}
            <path
              d="M 62 135 Q 52 160 55 220 L 145 220 Q 148 160 138 135 Z"
              fill={`url(#${p}suitA)`}
            />
            {/* Muscle highlight */}
            <path
              d="M 62 135 Q 52 160 55 220 L 145 220 Q 148 160 138 135 Z"
              fill={`url(#${p}muscleHL)`}
            />
            {/* Center chest line */}
            <line x1="100" y1="140" x2="100" y2="215" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />
            {/* Pec lines */}
            <path d="M 68 158 Q 100 163 132 158" fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="1" />
            {/* Abs lines */}
            <path d="M 78 178 Q 100 181 122 178" fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="1" />
            <path d="M 80 195 Q 100 198 120 195" fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="1" />

            {/* Belt */}
            <rect x="58" y="210" width="84" height="14" rx="5" fill={`url(#${p}gold)`} />
            <rect x="92" y="208" width="16" height="18" rx="4" fill={`url(#${p}gold)`} />
            <rect x="94" y="210" width="12" height="14" rx="3" fill="#FEF3C7" opacity="0.5" />

            {/* Chest emblem GLOW */}
            <circle cx="100" cy="162" r="16" fill="rgba(255,220,50,0.15)" className="emblem-glow" />
            {/* Chest star */}
            <g fill={`url(#${p}star)`} filter={`url(#${p}glow)`}>
              <StarPath cx={100} cy={162} r={13} ir={6} />
            </g>
            {/* Star specular */}
            <ellipse cx="97" cy="157" rx="4" ry="2.5" fill="rgba(255,255,255,0.50)" opacity="0.7" />

            {/* Shoulder pads */}
            <ellipse cx="62" cy="138" rx="14" ry="9" fill="#3B82F6" />
            <ellipse cx="62" cy="138" rx="14" ry="9" fill="rgba(255,255,255,0.12)" />
            <ellipse cx="138" cy="138" rx="14" ry="9" fill="#3B82F6" />
            <ellipse cx="138" cy="138" rx="14" ry="9" fill="rgba(255,255,255,0.12)" />
          </g>

          {/* ── LEFT ARM (character's right) ── */}
          <g className={armLCls} style={{ transformOrigin: "68px 140px" }}>
            {/* Upper arm */}
            <rect x="44" y="138" width="22" height="48" rx="10" fill={`url(#${p}armA)`} />
            {/* Elbow highlight */}
            <ellipse cx="55" cy="186" rx="10" ry="6" fill="rgba(255,255,255,0.10)" />
            {/* Lower arm */}
            <rect x="46" y="183" width="20" height="42" rx="9" fill={`url(#${p}armA)`} />
            {/* Gold glove cuff */}
            <rect x="43" y="218" width="26" height="8" rx="4" fill={`url(#${p}gold)`} />
            {/* Fist */}
            <rect x="45" y="224" width="22" height="18" rx="7" fill={`url(#${p}ear)`} />
            <ellipse cx="56" cy="226" rx="8" ry="3" fill="rgba(255,255,255,0.15)" />
          </g>

          {/* ── RIGHT ARM (character's left) ── */}
          <g className={armRCls} style={{ transformOrigin: "132px 140px" }}>
            {/* Upper arm */}
            <rect x="134" y="138" width="22" height="48" rx="10" fill={`url(#${p}armA)`} />
            <ellipse cx="145" cy="186" rx="10" ry="6" fill="rgba(255,255,255,0.10)" />
            {/* Lower arm */}
            <rect x="134" y="183" width="20" height="42" rx="9" fill={`url(#${p}armA)`} />
            <rect x="131" y="218" width="26" height="8" rx="4" fill={`url(#${p}gold)`} />
            <rect x="133" y="224" width="22" height="18" rx="7" fill={`url(#${p}ear)`} />
            <ellipse cx="144" cy="226" rx="8" ry="3" fill="rgba(255,255,255,0.15)" />
          </g>
        </g>

        {/* ── HEAD GROUP ── */}
        <g className={headClass} style={{ transformOrigin: "100px 90px" }}>
          {/* Neck */}
          <rect x="88" y="112" width="24" height="26" rx="8" fill={`url(#${p}neck)`} />
          {/* Neck shadow */}
          <rect x="88" y="112" width="24" height="8" rx="4" fill="rgba(0,0,0,0.15)" />

          {/* Ear */}
          <ellipse cx="62" cy="88" rx="8" ry="11" fill={`url(#${p}ear)`} />
          <ellipse cx="63" cy="88" rx="5" ry="7" fill="rgba(180,70,20,0.4)" />

          {/* Head */}
          <ellipse cx="100" cy="80" rx="42" ry="46" fill={`url(#${p}face)`} />
          {/* Jaw shadow */}
          <ellipse cx="100" cy="80" rx="42" ry="46" fill={`url(#${p}jawShad)`} />

          {/* ── HAIR ── */}
          {/* Back hair */}
          <path d="M 58 62 Q 55 30 100 22 Q 145 30 142 62 Q 130 30 100 26 Q 70 30 58 62 Z"
            fill={`url(#${p}hair)`} />
          {/* Main hair mass */}
          <path d="M 60 68 Q 58 38 100 26 Q 142 38 140 68 Q 130 45 100 40 Q 70 45 60 68 Z"
            fill={`url(#${p}hair)`} />
          {/* Hair highlight */}
          <path d="M 60 68 Q 58 38 100 26 Q 142 38 140 68 Q 130 45 100 40 Q 70 45 60 68 Z"
            fill={`url(#${p}hairLight)`} />
          {/* Hairline strands */}
          <path d="M 72 66 Q 68 48 85 38" fill="none" stroke="rgba(60,30,0,0.4)" strokeWidth="2" />
          <path d="M 80 60 Q 78 42 95 34" fill="none" stroke="rgba(60,30,0,0.3)" strokeWidth="1.5" />

          {/* ── HERO MASK ── */}
          <path d="M 60 74 Q 63 66 75 67 L 90 72 Q 100 70 110 72 L 125 67 Q 137 66 140 74 Q 136 82 125 80 L 112 76 Q 100 78 88 76 L 75 80 Q 64 82 60 74 Z"
            fill="#0F172A" opacity="0.92" />
          {/* Mask highlight */}
          <path d="M 63 74 Q 66 68 76 69 L 88 73" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />

          {/* ── EYES ── */}
          {/* Left eye white */}
          <ellipse cx="79" cy="75" rx="10" ry="9"
            fill="white"
            style={{ transform: (smiling || celebrating) ? "scaleY(0.7)" : "scaleY(1)", transformOrigin: "79px 75px", transition: "transform 0.3s" }}
          />
          {/* Left iris */}
          <circle cx="79" cy="76" r="6" fill={`url(#${p}irisA)`}
            style={{ transform: thinking ? "translateY(-2px)" : "none", transition: "transform 0.4s" }}
          />
          <circle cx="79" cy="76" r="3.5" fill="#0C1A2E" />
          <circle cx="77" cy="73" r="2" fill="white" opacity="0.9" />
          <circle cx="81" cy="78" r="1" fill="rgba(255,255,255,0.5)" />

          {/* Right eye white */}
          <ellipse cx="121" cy="75" rx="10" ry="9"
            fill="white"
            style={{ transform: (smiling || celebrating) ? "scaleY(0.7)" : "scaleY(1)", transformOrigin: "121px 75px", transition: "transform 0.3s" }}
          />
          {/* Right iris */}
          <circle cx="121" cy="76" r="6" fill={`url(#${p}irisA)`}
            style={{ transform: thinking ? "translateY(-2px)" : "none", transition: "transform 0.4s" }}
          />
          <circle cx="121" cy="76" r="3.5" fill="#0C1A2E" />
          <circle cx="119" cy="73" r="2" fill="white" opacity="0.9" />
          <circle cx="123" cy="78" r="1" fill="rgba(255,255,255,0.5)" />

          {/* ── EYEBROWS ── */}
          <path
            d="M 68 64 Q 79 60 90 63"
            fill="none" stroke="#1C0A00" strokeWidth="4" strokeLinecap="round"
            style={{ transform: thinking ? "translateY(-3px) rotate(-5deg)" : celebrating || smiling ? "translateY(-2px)" : "none", transformOrigin: "79px 63px", transition: "transform 0.3s" }}
          />
          <path
            d="M 110 63 Q 121 60 132 64"
            fill="none" stroke="#1C0A00" strokeWidth="4" strokeLinecap="round"
            style={{ transform: thinking ? "translateY(-3px) rotate(5deg)" : celebrating || smiling ? "translateY(-2px)" : "none", transformOrigin: "121px 63px", transition: "transform 0.3s" }}
          />

          {/* ── NOSE ── */}
          <path d="M 100 85 Q 96 95 98 98 Q 100 100 102 98 Q 104 95 100 85"
            fill="rgba(160,70,20,0.20)" />
          <path d="M 94 97 Q 100 102 106 97"
            fill="none" stroke="rgba(160,70,20,0.35)" strokeWidth="1.5" strokeLinecap="round" />

          {/* ── MOUTH ── */}
          {talking ? (
            <g style={{ animation: "mouthTalk 0.38s ease-in-out infinite" }}>
              <path d="M 88 104 Q 100 118 112 104" fill="#5C1A00" />
              <path d="M 88 104 Q 100 112 112 104" fill="#FF9070" />
              <path d="M 90 104 Q 100 107 110 104" fill="white" opacity="0.8" />
            </g>
          ) : (
            <>
              <path d={mouthPath} fill="none" stroke="#8B4020" strokeWidth="2.5" strokeLinecap="round"
                style={{ transition: "d 0.3s" }}
              />
              {(smiling || celebrating) && (
                <>
                  <path d="M 86 103 Q 100 116 114 103 L 114 108 Q 100 120 86 108 Z" fill="#CC5020" opacity="0.7" />
                  <path d="M 88 104 Q 100 111 112 104" fill="white" opacity="0.7" />
                </>
              )}
            </>
          )}

          {/* Cheek blush (smiling/celebrating) */}
          {(smiling || celebrating) && (
            <>
              <ellipse cx="72" cy="90" rx="12" ry="8" fill={`url(#${p}blush)`} className="cheek-glow" />
              <ellipse cx="128" cy="90" rx="12" ry="8" fill={`url(#${p}blush)`} className="cheek-glow" />
            </>
          )}

          {/* Thinking bubble */}
          {thinking && (
            <g className="thought-in" style={{ transformOrigin: "148px 40px" }}>
              <circle cx="130" cy="55" r="4" fill="rgba(255,255,255,0.7)" />
              <circle cx="140" cy="42" r="6" fill="rgba(255,255,255,0.8)" />
              <circle cx="153" cy="30" r="9" fill="white" opacity="0.9" />
              <text x="153" y="34" textAnchor="middle" fontSize="10" fill="#1D4ED8">?</text>
            </g>
          )}
        </g>

        {/* ── CAPE FRONT EDGES (on top of arms) ── */}
        <g className={capeCls} style={{ pointerEvents: "none" }}>
          <path d="M 68 128 Q 38 168 42 235 Q 54 245 62 238 Q 50 185 74 142 Z"
            fill={`url(#${p}capeA)`} opacity="0.6" />
          <path d="M 132 128 Q 162 168 158 235 Q 146 245 138 238 Q 150 185 126 142 Z"
            fill={`url(#${p}capeA)`} opacity="0.6" />
        </g>
      </g>

      {/* Celebrating sparkles */}
      {celebrating && (
        <>
          <text x="30" y="80" fontSize="20" className="sparkle-pop" style={{ animationDelay: "0s" }}>✦</text>
          <text x="155" y="70" fontSize="16" className="sparkle-pop" style={{ animationDelay: "0.2s" }}>★</text>
          <text x="18" y="140" fontSize="14" className="sparkle-pop" style={{ animationDelay: "0.4s" }}>✦</text>
          <text x="162" y="130" fontSize="18" className="sparkle-pop" style={{ animationDelay: "0.1s" }}>★</text>
          <text x="40" y="50" fontSize="12" className="sparkle-pop" style={{ animationDelay: "0.3s" }}>⚡</text>
          <text x="148" y="55" fontSize="14" className="sparkle-pop" style={{ animationDelay: "0.5s" }}>⚡</text>
        </>
      )}
    </svg>
  );
}

/* ─── SARA CHARACTER ─────────────────────────────── */
function SaraSVG({ anim }: { anim: Anim }) {
  const p = "sa_";
  const talking = anim === "talking";
  const thinking = anim === "thinking";
  const dancing = anim === "dancing";
  const celebrating = anim === "celebrating";
  const smiling = anim === "smiling";

  const floatClass = (dancing || celebrating) ? "" : "char-float";
  const bounceClass = celebrating ? "char-bounce" : "";
  const headClass = talking ? "head-nod" : thinking ? "head-tilt" : "";
  const bodyClass = dancing ? "body-sway" : "";
  const capeCls = dancing ? "cape-dance" : "cape-idle";
  const armLCls = dancing ? "wave-l" : celebrating ? "arms-up-l" : "";
  const armRCls = dancing ? "wave-r" : celebrating ? "arms-up-r" : "";

  const mouthPath = talking
    ? "M 88 106 Q 100 118 112 106"
    : smiling || celebrating
    ? "M 86 103 Q 100 116 114 103"
    : "M 88 105 Q 100 109 112 105";

  return (
    <svg viewBox="0 0 200 330" style={{ width: 180, height: 300, filter: `url(#${p}shadow)` }}>
      <Defs id={p} />

      <ellipse cx="100" cy="324" rx="36" ry="7" fill="rgba(0,0,0,0.45)" />

      <g className={`${floatClass} ${bounceClass}`} style={{ transformOrigin: "100px 300px" }}>

        {/* ── CAPE BACK ── */}
        <g className={capeCls}>
          <path
            d="M 70 128 Q 30 175 34 255 Q 55 288 100 294 Q 145 288 166 255 Q 170 175 130 128 Z"
            fill={`url(#${p}capeS)`}
            opacity="0.97"
          />
          <path d="M 100 128 Q 95 195 100 255 Q 105 195 100 128 Z" fill="rgba(0,0,0,0.18)" />
          <path d="M 70 128 Q 40 175 44 240 Q 52 256 62 260 Q 46 198 74 140 Z" fill="rgba(255,255,255,0.10)" />
          {/* Cape star decoration */}
          <g fill={`url(#${p}star)`} opacity="0.6" transform="translate(100,200)">
            <StarPath cx={0} cy={0} r={10} ir={4} />
          </g>
        </g>

        {/* ── LEGS ── */}
        <g className={bodyClass} style={{ transformOrigin: "100px 220px" }}>
          <rect x="72" y="218" width="24" height="62" rx="8" fill={`url(#${p}legS)`} />
          {/* Boot */}
          <rect x="68" y="270" width="32" height="22" rx="8" fill={`url(#${p}boot)`} />
          <rect x="68" y="270" width="32" height="7" rx="3" fill={`url(#${p}pink)`} opacity="0.9" />

          <rect x="104" y="218" width="24" height="62" rx="8" fill={`url(#${p}legS)`} />
          <rect x="100" y="270" width="32" height="22" rx="8" fill={`url(#${p}boot)`} />
          <rect x="100" y="270" width="32" height="7" rx="3" fill={`url(#${p}pink)`} opacity="0.9" />

          {/* ── SKIRT / SUIT bottom flare ── */}
          <path d="M 60 215 Q 50 228 55 238 L 145 238 Q 150 228 140 215 Z"
            fill={`url(#${p}suitS)`} opacity="0.9" />
          <path d="M 60 215 Q 50 228 55 238 L 145 238 Q 150 228 140 215 Z"
            fill={`url(#${p}muscleHL)`} />

          {/* ── TORSO ── */}
          <g className="char-breathe" style={{ transformOrigin: "100px 175px" }}>
            <path d="M 64 135 Q 55 158 58 218 L 142 218 Q 145 158 136 135 Z" fill={`url(#${p}suitS)`} />
            <path d="M 64 135 Q 55 158 58 218 L 142 218 Q 145 158 136 135 Z" fill={`url(#${p}muscleHL)`} />

            {/* Star emblem */}
            <circle cx="100" cy="162" r="16" fill="rgba(240,180,255,0.15)" className="emblem-glow" />
            <g fill={`url(#${p}star)`} filter={`url(#${p}glow)`}>
              <StarPath cx={100} cy={162} r={13} ir={6} />
            </g>
            <ellipse cx="97" cy="157" rx="4" ry="2.5" fill="rgba(255,255,255,0.55)" opacity="0.7" />

            {/* Pink gem belt */}
            <rect x="58" y="210" width="84" height="12" rx="5" fill={`url(#${p}pink)`} />
            <rect x="92" y="208" width="16" height="16" rx="4" fill={`url(#${p}pink)`} />
            <ellipse cx="100" cy="216" rx="5" ry="4" fill="rgba(255,255,255,0.4)" />

            {/* Shoulder pads */}
            <ellipse cx="64" cy="138" rx="13" ry="8" fill="#A855F7" />
            <ellipse cx="64" cy="138" rx="13" ry="8" fill="rgba(255,255,255,0.14)" />
            <ellipse cx="136" cy="138" rx="13" ry="8" fill="#A855F7" />
            <ellipse cx="136" cy="138" rx="13" ry="8" fill="rgba(255,255,255,0.14)" />
          </g>

          {/* ── LEFT ARM ── */}
          <g className={armLCls} style={{ transformOrigin: "68px 140px" }}>
            <rect x="45" y="138" width="21" height="46" rx="10" fill={`url(#${p}armS)`} />
            <ellipse cx="55" cy="184" rx="9" ry="5" fill="rgba(255,255,255,0.10)" />
            <rect x="47" y="181" width="19" height="40" rx="9" fill={`url(#${p}armS)`} />
            <rect x="44" y="215" width="25" height="8" rx="4" fill={`url(#${p}pink)`} />
            <rect x="46" y="221" width="21" height="16" rx="7" fill={`url(#${p}ear)`} />
            <ellipse cx="56" cy="223" rx="7" ry="2.5" fill="rgba(255,255,255,0.15)" />
          </g>

          {/* ── RIGHT ARM ── */}
          <g className={armRCls} style={{ transformOrigin: "132px 140px" }}>
            <rect x="134" y="138" width="21" height="46" rx="10" fill={`url(#${p}armS)`} />
            <ellipse cx="145" cy="184" rx="9" ry="5" fill="rgba(255,255,255,0.10)" />
            <rect x="134" y="181" width="19" height="40" rx="9" fill={`url(#${p}armS)`} />
            <rect x="131" y="215" width="25" height="8" rx="4" fill={`url(#${p}pink)`} />
            <rect x="133" y="221" width="21" height="16" rx="7" fill={`url(#${p}ear)`} />
            <ellipse cx="144" cy="223" rx="7" ry="2.5" fill="rgba(255,255,255,0.15)" />
          </g>
        </g>

        {/* ── HEAD GROUP ── */}
        <g className={headClass} style={{ transformOrigin: "100px 85px" }}>
          <rect x="88" y="112" width="24" height="24" rx="8" fill={`url(#${p}neck)`} />
          <rect x="88" y="112" width="24" height="8" rx="4" fill="rgba(0,0,0,0.12)" />

          {/* Ear */}
          <ellipse cx="62" cy="86" rx="8" ry="11" fill={`url(#${p}ear)`} />
          <ellipse cx="63" cy="86" rx="5" ry="7" fill="rgba(180,70,20,0.35)" />
          {/* Ear right hidden by hair but visible on left */}

          {/* Head */}
          <ellipse cx="100" cy="78" rx="41" ry="45" fill={`url(#${p}face)`} />
          <ellipse cx="100" cy="78" rx="41" ry="45" fill={`url(#${p}jawShad)`} />

          {/* ── SARA HAIR (longer, ponytail) ── */}
          {/* Ponytail behind (back layer) */}
          <path d="M 135 60 Q 165 80 162 130 Q 158 155 148 160 Q 158 140 155 110 Q 153 85 138 68 Z"
            fill={`url(#${p}hairS)`} />
          <path d="M 135 60 Q 165 80 162 130 Q 158 155 148 160 Q 158 140 155 110 Q 153 85 138 68 Z"
            fill={`url(#${p}hairSLight)`} />
          {/* Main hair on head */}
          <path d="M 59 70 Q 57 35 100 22 Q 145 30 143 65 Q 135 42 100 38 Q 68 42 59 70 Z"
            fill={`url(#${p}hairS)`} />
          <path d="M 59 70 Q 57 35 100 22 Q 145 30 143 65 Q 135 42 100 38 Q 68 42 59 70 Z"
            fill={`url(#${p}hairSLight)`} />
          {/* Side hair sweeps */}
          <path d="M 60 72 Q 55 100 58 120 Q 52 105 55 80 Q 57 70 60 72 Z"
            fill={`url(#${p}hairS)`} />
          {/* Ponytail band */}
          <rect x="132" y="72" width="14" height="10" rx="5" fill={`url(#${p}pink)`} />

          {/* ── HERO MASK (Sara - more elegant) ── */}
          <path d="M 61 72 Q 64 64 76 65 L 91 70 Q 100 68 109 70 L 124 65 Q 136 64 139 72 Q 135 80 124 78 L 111 74 Q 100 76 89 74 L 76 78 Q 65 80 61 72 Z"
            fill="#2D0040" opacity="0.90" />
          {/* Mask star left */}
          <g fill="rgba(240,180,255,0.7)" transform="translate(74,73)">
            <StarPath cx={0} cy={0} r={4} ir={2} />
          </g>
          <g fill="rgba(240,180,255,0.7)" transform="translate(126,73)">
            <StarPath cx={0} cy={0} r={4} ir={2} />
          </g>

          {/* ── EYES ── */}
          <ellipse cx="79" cy="74" rx="10" ry="9"
            fill="white"
            style={{ transform: (smiling || celebrating) ? "scaleY(0.7)" : "scaleY(1)", transformOrigin: "79px 74px", transition: "transform 0.3s" }}
          />
          <circle cx="79" cy="75" r="6" fill={`url(#${p}irisS)`}
            style={{ transform: thinking ? "translateY(-2px)" : "none", transition: "transform 0.4s" }}
          />
          <circle cx="79" cy="75" r="3.5" fill="#0C0020" />
          <circle cx="77" cy="72" r="2" fill="white" opacity="0.9" />
          <circle cx="81" cy="77" r="1" fill="rgba(255,255,255,0.5)" />
          {/* Lashes left */}
          <path d="M 70 70 Q 72 67 75 68" fill="none" stroke="#1C0030" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 73 68 Q 76 65 79 66" fill="none" stroke="#1C0030" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 77 68 Q 81 65 83 67" fill="none" stroke="#1C0030" strokeWidth="1.5" strokeLinecap="round" />

          <ellipse cx="121" cy="74" rx="10" ry="9"
            fill="white"
            style={{ transform: (smiling || celebrating) ? "scaleY(0.7)" : "scaleY(1)", transformOrigin: "121px 74px", transition: "transform 0.3s" }}
          />
          <circle cx="121" cy="75" r="6" fill={`url(#${p}irisS)`}
            style={{ transform: thinking ? "translateY(-2px)" : "none", transition: "transform 0.4s" }}
          />
          <circle cx="121" cy="75" r="3.5" fill="#0C0020" />
          <circle cx="119" cy="72" r="2" fill="white" opacity="0.9" />
          <circle cx="123" cy="77" r="1" fill="rgba(255,255,255,0.5)" />
          {/* Lashes right */}
          <path d="M 117 68 Q 119 65 122 66" fill="none" stroke="#1C0030" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 121 67 Q 124 64 127 66" fill="none" stroke="#1C0030" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 124 68 Q 127 65 130 67" fill="none" stroke="#1C0030" strokeWidth="1.5" strokeLinecap="round" />

          {/* ── EYEBROWS (arched, feminine) ── */}
          <path d="M 68 62 Q 79 57 90 61"
            fill="none" stroke="#3D0A00" strokeWidth="3.5" strokeLinecap="round"
            style={{ transform: thinking ? "translateY(-3px) rotate(-5deg)" : celebrating || smiling ? "translateY(-2px)" : "none", transformOrigin: "79px 61px", transition: "transform 0.3s" }}
          />
          <path d="M 110 61 Q 121 57 132 62"
            fill="none" stroke="#3D0A00" strokeWidth="3.5" strokeLinecap="round"
            style={{ transform: thinking ? "translateY(-3px) rotate(5deg)" : celebrating || smiling ? "translateY(-2px)" : "none", transformOrigin: "121px 61px", transition: "transform 0.3s" }}
          />

          {/* ── NOSE ── */}
          <path d="M 100 83 Q 96 93 98 96 Q 100 98 102 96 Q 104 93 100 83"
            fill="rgba(160,70,20,0.18)" />
          <path d="M 95 96 Q 100 100 105 96"
            fill="none" stroke="rgba(160,70,20,0.28)" strokeWidth="1.5" strokeLinecap="round" />

          {/* ── MOUTH ── */}
          {talking ? (
            <g>
              <path d="M 88 104 Q 100 118 112 104" fill="#5C1A00" />
              <path d="M 88 104 Q 100 112 112 104" fill="#FF9070" />
              <path d="M 90 104 Q 100 107 110 104" fill="white" opacity="0.8" />
            </g>
          ) : (
            <>
              <path d={mouthPath} fill="none" stroke="#8B4020" strokeWidth="2.5" strokeLinecap="round" />
              {(smiling || celebrating) && (
                <>
                  <path d="M 86 103 Q 100 116 114 103 L 114 108 Q 100 120 86 108 Z" fill="#CC5020" opacity="0.7" />
                  <path d="M 88 104 Q 100 111 112 104" fill="white" opacity="0.7" />
                </>
              )}
            </>
          )}

          {/* Cheek blush */}
          {(smiling || celebrating) && (
            <>
              <ellipse cx="70" cy="88" rx="13" ry="8" fill={`url(#${p}blush)`} className="cheek-glow" />
              <ellipse cx="130" cy="88" rx="13" ry="8" fill={`url(#${p}blush)`} className="cheek-glow" />
            </>
          )}

          {/* Thinking bubble */}
          {thinking && (
            <g className="thought-in" style={{ transformOrigin: "148px 40px" }}>
              <circle cx="130" cy="53" r="4" fill="rgba(255,255,255,0.7)" />
              <circle cx="140" cy="40" r="6" fill="rgba(255,255,255,0.8)" />
              <circle cx="153" cy="28" r="9" fill="white" opacity="0.9" />
              <text x="153" y="32" textAnchor="middle" fontSize="10" fill="#7C3AED">?</text>
            </g>
          )}
        </g>

        {/* Cape front edges */}
        <g className={capeCls} style={{ pointerEvents: "none" }}>
          <path d="M 70 128 Q 40 168 44 232 Q 56 242 64 235 Q 52 182 76 142 Z"
            fill={`url(#${p}capeS)`} opacity="0.55" />
          <path d="M 130 128 Q 160 168 156 232 Q 144 242 136 235 Q 148 182 124 142 Z"
            fill={`url(#${p}capeS)`} opacity="0.55" />
        </g>
      </g>

      {/* Celebrating sparkles */}
      {celebrating && (
        <>
          <text x="28" y="78" fontSize="20" className="sparkle-pop" style={{ animationDelay: "0s" }}>✦</text>
          <text x="154" y="68" fontSize="16" className="sparkle-pop" style={{ animationDelay: "0.2s" }}>★</text>
          <text x="16" y="138" fontSize="14" className="sparkle-pop" style={{ animationDelay: "0.4s" }}>✦</text>
          <text x="160" y="128" fontSize="18" className="sparkle-pop" style={{ animationDelay: "0.1s" }}>⭐</text>
          <text x="38" y="50" fontSize="12" className="sparkle-pop" style={{ animationDelay: "0.3s" }}>💫</text>
          <text x="148" y="52" fontSize="14" className="sparkle-pop" style={{ animationDelay: "0.5s" }}>✨</text>
        </>
      )}
    </svg>
  );
}

/* ─── MAIN PREVIEW ───────────────────────────────── */
export default function HeroCharacters() {
  const [anim, setAnim] = useState<Anim>("idle");
  const [tick, setTick] = useState(0);

  // Cycle mouth open/close for talking
  useEffect(() => {
    if (anim !== "talking") return;
    const id = setInterval(() => setTick(t => t + 1), 380);
    return () => clearInterval(id);
  }, [anim]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <div style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 30% 20%, #0F1A40 0%, #070B14 50%, #0A0F1E 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        gap: 0,
      }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
            borderRadius: 20,
            padding: "6px 20px",
            marginBottom: 10,
          }}>
            <span style={{ color: "white", fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>MY HERO — CHARACTER PREVIEW</span>
          </div>
          <h1 style={{ color: "white", fontSize: 28, fontWeight: 900, margin: 0 }}>
            Adam &amp; Sara
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 4 }}>
            Tap an animation state below
          </p>
        </div>

        {/* Characters */}
        <div style={{ display: "flex", gap: 40, alignItems: "flex-end", marginBottom: 8 }}>
          {/* Adam */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.25)",
              borderRadius: 24,
              padding: "20px 16px 8px",
              position: "relative",
            }}>
              {/* Glow behind character */}
              <div style={{
                position: "absolute", inset: 0, borderRadius: 24,
                background: "radial-gradient(circle at 50% 40%, rgba(59,130,246,0.12) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />
              <AdamSVG anim={anim} key={`adam-${tick}`} />
            </div>
            <div style={{
              background: "linear-gradient(135deg, #1E3A8A, #1D4ED8)",
              borderRadius: 20,
              padding: "5px 18px",
            }}>
              <span style={{ color: "white", fontSize: 14, fontWeight: 900 }}>⚡ ADAM</span>
            </div>
          </div>

          {/* Sara */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{
              background: "rgba(168,85,247,0.08)",
              border: "1px solid rgba(168,85,247,0.25)",
              borderRadius: 24,
              padding: "20px 16px 8px",
              position: "relative",
            }}>
              <div style={{
                position: "absolute", inset: 0, borderRadius: 24,
                background: "radial-gradient(circle at 50% 40%, rgba(168,85,247,0.12) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />
              <SaraSVG anim={anim} key={`sara-${tick}`} />
            </div>
            <div style={{
              background: "linear-gradient(135deg, #5B21B6, #7C3AED)",
              borderRadius: 20,
              padding: "5px 18px",
            }}>
              <span style={{ color: "white", fontSize: 14, fontWeight: 900 }}>🌟 SARA</span>
            </div>
          </div>
        </div>

        {/* State label */}
        <div style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 12,
          padding: "6px 20px",
          marginBottom: 16,
        }}>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 700 }}>
            {BUTTONS.find(b => b.a === anim)?.emoji} {anim.toUpperCase()}
          </span>
        </div>

        {/* Animation buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", maxWidth: 420 }}>
          {BUTTONS.map(b => (
            <button
              key={b.a}
              onClick={() => setAnim(b.a)}
              style={{
                background: anim === b.a
                  ? "linear-gradient(135deg, #3B82F6, #8B5CF6)"
                  : "rgba(255,255,255,0.07)",
                border: anim === b.a ? "1px solid rgba(139,92,246,0.6)" : "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14,
                color: "white",
                fontSize: 14,
                fontWeight: 800,
                fontFamily: "inherit",
                padding: "10px 18px",
                cursor: "pointer",
                transition: "all 0.2s",
                transform: anim === b.a ? "scale(1.06)" : "scale(1)",
              }}
            >
              {b.emoji} {b.label}
            </button>
          ))}
        </div>

        {/* Footer note */}
        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 20, textAlign: "center" }}>
          GPU-shaded gradients · Rim lighting · Spring physics · 6 animation states
        </p>
      </div>
    </>
  );
}
