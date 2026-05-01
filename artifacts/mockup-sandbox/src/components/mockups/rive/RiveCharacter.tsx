import { useEffect, useRef, useState } from "react";
import { Rive, Layout, Fit, Alignment } from "@rive-app/canvas";

export default function RiveCharacter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const riveRef = useRef<Rive | null>(null);
  const [log, setLog] = useState<string[]>(["Initialising Rive…"]);
  const [ready, setReady] = useState(false);
  const [animNames, setAnimNames] = useState<string[]>([]);
  const [smNames, setSmNames] = useState<string[]>([]);

  function addLog(msg: string) {
    setLog((p) => [`${new Date().toLocaleTimeString()} — ${msg}`, ...p.slice(0, 12)]);
  }

  useEffect(() => {
    if (!canvasRef.current) return;

    const r = new Rive({
      src: "character.riv",
      canvas: canvasRef.current,
      autoplay: true,
      layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
      onLoad() {
        const anims = r.animationNames;
        const sms = r.stateMachineNames;
        setAnimNames(anims);
        setSmNames(sms);
        setReady(true);
        addLog(`✅ Loaded! Animations: [${anims.join(", ") || "none"}]`);
        addLog(`🎛 State Machines: [${sms.join(", ") || "none"}]`);
        r.play();
      },
      onLoadError() {
        addLog("❌ Failed to load .riv file");
      },
      onPlay(e) {
        addLog(`▶ Playing: ${e.data.join(", ")}`);
      },
      onPause(e) {
        addLog(`⏸ Paused: ${e.data.join(", ")}`);
      },
      onStop(e) {
        addLog(`⏹ Stopped: ${e.data.join(", ")}`);
      },
      onStateChange(e) {
        addLog(`🔄 State changed: ${e.data.join(", ")}`);
      },
    });

    riveRef.current = r;
    return () => { r.cleanup(); };
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f3460 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "20px 16px",
      fontFamily: "system-ui, sans-serif",
      color: "white",
    }}>
      <h1 style={{ fontSize: 18, fontWeight: 800, marginBottom: 2, color: "#e2e8f0" }}>
        Rive Character Preview
      </h1>
      <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
        character-customization-ui.riv
      </p>

      {/* Canvas */}
      <div style={{
        width: "100%", maxWidth: 480, aspectRatio: "1",
        background: "rgba(255,255,255,0.04)",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
        marginBottom: 16,
        position: "relative",
      }}>
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block" }}
          width={480}
          height={480}
        />
        {!ready && (
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
            color: "#64748b", fontSize: 14,
          }}>
            Loading…
          </div>
        )}
      </div>

      {/* Animation buttons */}
      {animNames.length > 0 && (
        <div style={{ marginBottom: 10, textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>ANIMATIONS</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {animNames.map((name) => (
              <button key={name} onClick={() => { riveRef.current?.play(name); addLog(`▶ ${name}`); }}
                style={btn("#6366f1")}>{name}</button>
            ))}
          </div>
        </div>
      )}

      {/* State machine buttons */}
      {smNames.length > 0 && (
        <div style={{ marginBottom: 10, textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>STATE MACHINES</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {smNames.map((name) => (
              <button key={name} onClick={() => { riveRef.current?.play(name); addLog(`🎛 ${name}`); }}
                style={btn("#0891b2")}>{name}</button>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 14 }}>
        <button onClick={() => riveRef.current?.play()} style={btn("#22c55e")}>▶ Play All</button>
        <button onClick={() => riveRef.current?.pause()} style={btn("#f59e0b")}>⏸ Pause</button>
        <button onClick={() => riveRef.current?.reset()} style={btn("#475569")}>↺ Reset</button>
      </div>

      {/* Log */}
      <div style={{
        width: "100%", maxWidth: 480,
        background: "rgba(0,0,0,0.5)",
        borderRadius: 12, padding: "10px 14px",
        fontSize: 11, color: "#94a3b8", lineHeight: 1.8,
        maxHeight: 160, overflowY: "auto",
      }}>
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}

function btn(bg: string): React.CSSProperties {
  return {
    background: bg, color: "white", border: "none",
    borderRadius: 8, padding: "8px 14px",
    fontSize: 12, fontWeight: 700, cursor: "pointer",
  };
}
