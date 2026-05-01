import { useRive, useStateMachineInput } from "@rive-app/react-canvas";
import { useState } from "react";

const ANIMATIONS = [
  { label: "▶ Play Timeline", action: "timeline" },
];

const STATE_MACHINE = "State Machine 1";

export default function RiveCharacter() {
  const [log, setLog] = useState<string[]>([]);

  const { rive, RiveComponent } = useRive({
    src: "/character.riv",
    stateMachines: STATE_MACHINE,
    autoplay: true,
    onLoad: () => addLog("✅ Rive file loaded"),
    onStateChange: (e) => addLog(`🔄 State: ${(e as any).data?.join(", ")}`),
    onPlay: (e) => addLog(`▶ Playing: ${(e as any).data}`),
  });

  function addLog(msg: string) {
    setLog((prev) => [`${new Date().toLocaleTimeString()} — ${msg}`, ...prev.slice(0, 9)]);
  }

  function playTimeline() {
    if (!rive) return;
    try {
      const names = rive.animationNames;
      addLog(`🎞 Animations found: ${names?.join(", ") || "none"}`);
      names?.forEach((n) => rive.play(n));
    } catch (e) {
      addLog(`⚠️ ${e}`);
    }
  }

  function logStates() {
    if (!rive) return;
    const sm = rive.stateMachineNames;
    const anim = rive.animationNames;
    addLog(`📋 State machines: ${sm?.join(", ") || "none"}`);
    addLog(`🎞 Animations: ${anim?.join(", ") || "none"}`);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "24px",
      fontFamily: "system-ui, sans-serif",
      color: "white",
    }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: "#e2e8f0" }}>
        Rive Character Preview
      </h1>
      <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>
        character-customization-ui.riv
      </p>

      {/* Character canvas */}
      <div style={{
        width: 480, height: 480,
        background: "rgba(255,255,255,0.05)",
        borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.1)",
        overflow: "hidden",
        marginBottom: 20,
      }}>
        <RiveComponent style={{ width: "100%", height: "100%" }} />
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 16 }}>
        <button onClick={playTimeline} style={btnStyle("#6366f1")}>
          ▶ Play All Animations
        </button>
        <button onClick={logStates} style={btnStyle("#0891b2")}>
          🔍 Inspect Animations &amp; States
        </button>
        <button onClick={() => rive?.pause()} style={btnStyle("#475569")}>
          ⏸ Pause
        </button>
        <button onClick={() => rive?.reset()} style={btnStyle("#475569")}>
          ↺ Reset
        </button>
      </div>

      {/* Log output */}
      <div style={{
        width: "100%", maxWidth: 520,
        background: "rgba(0,0,0,0.4)",
        borderRadius: 12,
        padding: "12px 16px",
        fontSize: 12,
        color: "#94a3b8",
        minHeight: 80,
        lineHeight: 1.7,
      }}>
        {log.length === 0
          ? <span style={{ color: "#475569" }}>Loading Rive file… click Inspect to see what animations exist.</span>
          : log.map((l, i) => <div key={i}>{l}</div>)
        }
      </div>
    </div>
  );
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "10px 18px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  };
}
