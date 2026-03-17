import { useState } from "react";

const initialData = {
  "Architectuur": [
    { id: "arch-1", name: "Toetsen concept", steps: [false, false, false, false, false, false] },
    { id: "arch-2", name: "Auth. Layer", steps: [false, false, false, false, false, false] },
    { id: "arch-3", name: "UI Layer", steps: [false, false, false, false, false, false] },
    { id: "arch-4", name: "Logic Layer", steps: [false, false, false, false, false, false] },
    { id: "arch-5", name: "Database Layer", steps: [false, false, false, false, false, false] },
    { id: "arch-6", name: "(Web) Services", steps: [false, false, false, false, false, false] },
  ],
  "Tooling": [
    { id: "tool-1", name: "DevOps", steps: [false, false, false, false, false, false] },
    { id: "tool-2", name: "Prototyping", steps: [false, false, false, false, false, false] },
    { id: "tool-3", name: "FrontEnd", steps: [false, false, false, false, false, false] },
    { id: "tool-4", name: "BackEnd", steps: [false, false, false, false, false, false] },
    { id: "tool-5", name: "Testing", steps: [false, false, false, false, false, false] },
    { id: "tool-6", name: "Deployment", steps: [false, false, false, false, false, false] },
  ],
};

const stepLabels = ["Idee", "Analyse", "Design", "Bouw", "Test", "Done ✓"];
const epicColors = {
  "Architectuur": { accent: "#00C9A7", dim: "#004D3F", glow: "rgba(0,201,167,0.35)" },
  "Tooling":      { accent: "#FF6B6B", dim: "#5A1A1A", glow: "rgba(255,107,107,0.35)" },
};

export default function StepTracker() {
  const [data, setData] = useState(initialData);
  const [hoveredStep, setHoveredStep] = useState(null);

  const toggleStep = (epic, featureId, stepIdx) => {
    setData(prev => ({
      ...prev,
      [epic]: prev[epic].map(f =>
        f.id === featureId
          ? { ...f, steps: f.steps.map((s, i) => i === stepIdx ? !s : s) }
          : f
      ),
    }));
  };

  const getProgress = (steps) => steps.filter(Boolean).length;

  const totalSteps = Object.values(data).flat().reduce((acc, f) => acc + f.steps.length, 0);
  const doneSteps = Object.values(data).flat().reduce((acc, f) => acc + f.steps.filter(Boolean).length, 0);
  const globalPct = Math.round((doneSteps / totalSteps) * 100);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0E1A",
      fontFamily: "'DM Mono', 'Courier New', monospace",
      padding: "40px 32px",
      color: "#C8D0E0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; }
        .step-dot {
          width: 32px; height: 32px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0;
          transition: all 0.18s ease;
          position: relative;
        }
        .step-dot:hover { transform: scale(1.18); }
        .step-dot.done {
          color: #0A0E1A;
        }
        .step-dot.empty {
          background: #13182B;
          color: #3A4460;
        }
        .connector {
          height: 2px;
          flex: 1;
          max-width: 12px;
          min-width: 6px;
          border-radius: 2px;
          transition: background 0.2s;
        }
        .epic-card {
          background: #10152A;
          border: 1px solid #1C2340;
          border-radius: 16px;
          padding: 28px;
          margin-bottom: 28px;
          transition: border-color 0.2s;
        }
        .epic-card:hover { border-color: #2A3260; }
        .feature-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #141928;
          transition: background 0.1s;
          border-radius: 6px;
        }
        .feature-row:last-child { border-bottom: none; }
        .feature-row:hover { background: #13182B; padding-left: 6px; padding-right: 6px; margin: 0 -6px; }
        .global-bar-track {
          background: #13182B;
          border-radius: 999px;
          height: 8px;
          overflow: hidden;
          flex: 1;
        }
        .tooltip {
          position: absolute;
          bottom: 38px;
          left: 50%;
          transform: translateX(-50%);
          background: #1C2340;
          border: 1px solid #2A3260;
          color: #C8D0E0;
          font-size: 9px;
          padding: 4px 7px;
          border-radius: 5px;
          white-space: nowrap;
          pointer-events: none;
          z-index: 10;
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 8 }}>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 28,
            fontWeight: 800,
            color: "#FFFFFF",
            margin: 0,
            letterSpacing: "-0.5px",
          }}>
            Feature Tracker
          </h1>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: "#3A4460",
            marginBottom: 4,
            letterSpacing: "0.1em",
          }}>
            6 STAPPEN NAAR DONE
          </span>
        </div>

        {/* Global progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="global-bar-track">
            <div style={{
              height: "100%",
              width: `${globalPct}%`,
              background: "linear-gradient(90deg, #00C9A7, #FF6B6B)",
              borderRadius: 999,
              transition: "width 0.4s ease",
            }} />
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: "#fff", minWidth: 36 }}>
            {globalPct}%
          </span>
          <span style={{ fontSize: 11, color: "#3A4460" }}>{doneSteps}/{totalSteps} stappen</span>
        </div>
      </div>

      {/* Step legend */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 32, flexWrap: "wrap",
      }}>
        {stepLabels.map((label, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "#10152A", border: "1px solid #1C2340",
            borderRadius: 20, padding: "3px 10px 3px 7px",
          }}>
            <div style={{
              width: 16, height: 16, borderRadius: "50%",
              background: `hsl(${i * 40 + 160}, 60%, 50%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 8, fontWeight: 600, color: "#0A0E1A",
            }}>{i + 1}</div>
            <span style={{ fontSize: 10, color: "#6B7A9A" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Epics */}
      {Object.entries(data).map(([epic, features]) => {
        const color = epicColors[epic];
        const epicDone = features.reduce((a, f) => a + f.steps.filter(Boolean).length, 0);
        const epicTotal = features.length * 6;
        const epicPct = Math.round((epicDone / epicTotal) * 100);

        return (
          <div key={epic} className="epic-card" style={{ borderColor: `${color.accent}22` }}>
            {/* Epic header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: color.accent,
                boxShadow: `0 0 10px ${color.glow}`,
              }} />
              <h2 style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: color.accent,
                margin: 0,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}>
                Epic: {epic}
              </h2>
              <div style={{ flex: 1 }} />
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: color.accent,
                opacity: 0.7,
              }}>
                {epicDone}/{epicTotal} · {epicPct}%
              </div>
            </div>

            {/* Column headers */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 8, borderBottom: `1px solid ${color.dim}`, marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: "#3A4460", width: 130, letterSpacing: "0.08em" }}>FEATURE</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
                {stepLabels.map((label, i) => (
                  <div key={i} style={{ width: 32, textAlign: "center", fontSize: 8, color: "#3A4460", letterSpacing: "0.04em" }}>
                    {i + 1}
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 9, color: "#3A4460", width: 40, textAlign: "right", letterSpacing: "0.08em" }}>DONE</span>
            </div>

            {/* Features */}
            {features.map((feature) => {
              const done = getProgress(feature.steps);
              const pct = Math.round((done / 6) * 100);
              return (
                <div key={feature.id} className="feature-row">
                  {/* Feature name */}
                  <div style={{
                    width: 130, fontSize: 11, color: done === 6 ? color.accent : "#8090B0",
                    fontWeight: done === 6 ? "500" : "400",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    transition: "color 0.2s",
                  }}>
                    {feature.name}
                    {done === 6 && <span style={{ marginLeft: 5, fontSize: 9 }}>✓</span>}
                  </div>

                  {/* Step dots with connectors */}
                  <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                    {feature.steps.map((active, si) => {
                      const stepColor = `hsl(${si * 40 + 160}, 60%, 50%)`;
                      const isHovered = hoveredStep?.fid === feature.id && hoveredStep?.si === si;
                      return (
                        <div key={si} style={{ display: "flex", alignItems: "center" }}>
                          <div
                            className={`step-dot ${active ? "done" : "empty"}`}
                            style={{
                              background: active ? stepColor : "#13182B",
                              borderColor: active ? stepColor : "#1C2340",
                              color: active ? "#0A0E1A" : "#3A4460",
                              boxShadow: active ? `0 0 8px ${stepColor}66` : "none",
                            }}
                            onClick={() => toggleStep(epic, feature.id, si)}
                            onMouseEnter={() => setHoveredStep({ fid: feature.id, si })}
                            onMouseLeave={() => setHoveredStep(null)}
                            title={stepLabels[si]}
                          >
                            {isHovered && (
                              <div className="tooltip">{stepLabels[si]}</div>
                            )}
                            {active ? "✓" : si + 1}
                          </div>
                          {si < 5 && (
                            <div
                              className="connector"
                              style={{
                                background: active && feature.steps[si + 1] ? stepColor : "#1C2340",
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress % */}
                  <div style={{
                    width: 40, textAlign: "right",
                    fontSize: 10,
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    color: done === 6 ? color.accent : done > 0 ? "#6B7A9A" : "#2A3260",
                  }}>
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      <div style={{ textAlign: "center", fontSize: 10, color: "#2A3260", marginTop: 12, letterSpacing: "0.08em" }}>
        KLIK OP EEN STAP OM TE TOGGLEN · 6 STAPPEN NAAR DONE
      </div>
    </div>
  );
}
