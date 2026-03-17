import { useState } from "react";

// steps: 0 = default, 1 = blue (in progress), 2 = green (done)
const initialData = {
  "Architectuur": [
    { id: "arch-1", name: "Toetsen concept", steps: [0, 0, 0, 0, 0, 0] },
    { id: "arch-2", name: "Auth. Layer", steps: [0, 0, 0, 0, 0, 0] },
    { id: "arch-3", name: "UI Layer", steps: [0, 0, 0, 0, 0, 0] },
    { id: "arch-4", name: "Logic Layer", steps: [0, 0, 0, 0, 0, 0] },
    { id: "arch-5", name: "Database Layer", steps: [0, 0, 0, 0, 0, 0] },
    { id: "arch-6", name: "(Web) Services", steps: [0, 0, 0, 0, 0, 0] },
  ],
  "Tooling": [
    { id: "tool-1", name: "DevOps", steps: [0, 0, 0, 0, 0, 0] },
    { id: "tool-2", name: "Prototyping", steps: [0, 0, 0, 0, 0, 0] },
    { id: "tool-3", name: "FrontEnd", steps: [0, 0, 0, 0, 0, 0] },
    { id: "tool-4", name: "BackEnd", steps: [0, 0, 0, 0, 0, 0] },
    { id: "tool-5", name: "Testing", steps: [0, 0, 0, 0, 0, 0] },
    { id: "tool-6", name: "Deployment", steps: [0, 0, 0, 0, 0, 0] },
  ],
};

const stepLabels = ["Idee", "Analyse", "Design", "Bouw", "Test", "Done ✓"];
// Project Nautica brand colors: navy #1B2F5E, light-blue #4AB8D8, orange #F5A623
const epicColors = {
  "Architectuur": { accent: "#4AB8D8", dim: "#0E2A3A", glow: "rgba(74,184,216,0.35)" },
  "Tooling":      { accent: "#F5A623", dim: "#3D2800", glow: "rgba(245,166,35,0.35)" },
};

export default function StepTracker() {
  const [data, setData] = useState(initialData);
  const [hoveredStep, setHoveredStep] = useState(null);

  const toggleStep = (epic, featureId, stepIdx) => {
    setData(prev => ({
      ...prev,
      [epic]: prev[epic].map(f =>
        f.id === featureId
          ? { ...f, steps: f.steps.map((s, i) => i === stepIdx ? (s + 1) % 3 : s) }
          : f
      ),
    }));
  };

  // count state 2 (green) as "done" for progress
  const getProgress = (steps) => steps.filter(s => s === 2).length;

  const totalSteps = Object.values(data).flat().reduce((acc, f) => acc + f.steps.length, 0);
  const doneSteps = Object.values(data).flat().reduce((acc, f) => acc + f.steps.filter(s => s === 2).length, 0);
  const globalPct = Math.round((doneSteps / totalSteps) * 100);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F5F7FA",
      fontFamily: "'DM Mono', 'Courier New', monospace",
      padding: "40px 32px",
      color: "#1B2F5E",
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
          color: #fff;
        }
        .step-dot.empty {
          background: #E8EEF5;
          color: #9AAEC8;
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
          background: #FFFFFF;
          border: 1px solid #D8E4F0;
          border-radius: 16px;
          padding: 28px;
          margin-bottom: 28px;
          transition: border-color 0.2s;
          box-shadow: 0 2px 12px rgba(27,47,94,0.07);
        }
        .epic-card:hover { border-color: #4AB8D8; }
        .feature-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #EDF2F8;
          transition: background 0.1s;
          border-radius: 6px;
        }
        .feature-row:last-child { border-bottom: none; }
        .feature-row:hover { background: #F0F5FB; padding-left: 6px; padding-right: 6px; margin: 0 -6px; }
        .global-bar-track {
          background: #E8EEF5;
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
          background: #1B2F5E;
          border: 1px solid #2A4A6A;
          color: #fff;
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
            color: "#1B2F5E",
            margin: 0,
            letterSpacing: "-0.5px",
          }}>
            Project Nautica
          </h1>
        </div>
      </div>

      {/* Step legend */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 32, flexWrap: "wrap",
      }}>
        {stepLabels.map((label, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "#FFFFFF", border: "1px solid #D8E4F0",
            borderRadius: 20, padding: "3px 10px 3px 7px",
          }}>
            <div style={{
              width: 16, height: 16, borderRadius: "50%",
              background: i < 3 ? `hsl(${195 + i * 10}, 60%, ${45 + i * 5}%)` : `hsl(${35 + (i-3) * 8}, 90%, ${50 + i * 2}%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 8, fontWeight: 600, color: "#fff",
            }}>{i + 1}</div>
            <span style={{ fontSize: 10, color: "#5A7A9A" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Epics */}
      {Object.entries(data).map(([epic, features]) => {
        const color = epicColors[epic];
        const epicDone = features.reduce((a, f) => a + f.steps.filter(s => s === 2).length, 0);
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
              <span style={{ fontSize: 9, color: "#9AAEC8", width: 130, letterSpacing: "0.08em" }}>FEATURE</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
                {stepLabels.map((label, i) => (
                  <div key={i} style={{ width: 32, textAlign: "center", fontSize: 8, color: "#9AAEC8", letterSpacing: "0.04em" }}>
                    {i + 1}
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 9, color: "#9AAEC8", width: 40, textAlign: "right", letterSpacing: "0.08em" }}>DONE</span>
            </div>

            {/* Features */}
            {features.map((feature) => {
              const done = getProgress(feature.steps);
              const pct = Math.round((done / 6) * 100);
              const allDone = feature.steps.every(s => s === 2);
              return (
                <div key={feature.id} className="feature-row">
                  {/* Feature name */}
                  <div style={{
                    width: 130, fontSize: 11, color: allDone ? color.accent : "#4A6A8A",
                    fontWeight: allDone ? "500" : "400",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    transition: "color 0.2s",
                  }}>
                    {feature.name}
                    {allDone && <span style={{ marginLeft: 5, fontSize: 9 }}>✓</span>}
                  </div>

                  {/* Step dots with connectors */}
                  <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                    {feature.steps.map((state, si) => {
                      const isBlue  = state === 1;
                      const isGreen = state === 2;
                      const dotBg    = isGreen ? "#F5A623" : isBlue ? "#4AB8D8" : "#0F2035";
                      const dotBorder= isGreen ? "#F5A623" : isBlue ? "#4AB8D8" : "#1E3A5A";
                      const dotColor = (isBlue || isGreen) ? "#fff" : "#2A4A6A";
                      const dotGlow  = isGreen ? "0 0 8px #F5A62388" : isBlue ? "0 0 8px #4AB8D888" : "none";
                      const dotLabel = isGreen ? "✓" : isBlue ? "…" : si + 1;
                      const isHovered = hoveredStep?.fid === feature.id && hoveredStep?.si === si;
                      return (
                        <div key={si} style={{ display: "flex", alignItems: "center" }}>
                          <div
                            className={`step-dot ${isGreen ? "done" : isBlue ? "done" : "empty"}`}
                            style={{
                              background: dotBg,
                              borderColor: dotBorder,
                              color: dotColor,
                              boxShadow: dotGlow,
                            }}
                            onClick={() => toggleStep(epic, feature.id, si)}
                            onMouseEnter={() => setHoveredStep({ fid: feature.id, si })}
                            onMouseLeave={() => setHoveredStep(null)}
                            title={stepLabels[si]}
                          >
                            {isHovered && (
                              <div className="tooltip">{stepLabels[si]}</div>
                            )}
                            {dotLabel}
                          </div>
                          {si < 5 && (
                            <div
                              className="connector"
                              style={{
                                background: isGreen && feature.steps[si + 1] === 2 ? "#F5A623"
                                          : isBlue  && feature.steps[si + 1] >= 1 ? "#4AB8D8"
                                          : "#D8E4F0",
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
                    color: allDone ? color.accent : done > 0 ? "#7A9AB8" : "#C0D0E0",
                  }}>
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      <div style={{ textAlign: "center", fontSize: 10, color: "#B0C4D8", marginTop: 12, letterSpacing: "0.08em" }}>
        KLIK 1× = BLAUW (bezig) · 2× = GROEN (done) · 3× = RESET
      </div>
    </div>
  );
}
