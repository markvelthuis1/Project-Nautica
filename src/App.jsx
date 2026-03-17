import { useEffect, useState } from "react";

const STORAGE_KEY = "project-nautica-tracker-v1";
const EXPANDED_STORAGE_KEY = "project-nautica-expanded-v1";

// steps: 0 = default, 1 = blue (in progress), 2 = orange (done)
const mkSteps = () => [0, 0, 0, 0, 0, 0];

const createInitialData = () => ({
  "Architectuur": [
    { id: "arch-1", name: "Toetsen concept", steps: mkSteps(), substeps: [] },
    {
      id: "arch-2", name: "Auth. Layer", steps: mkSteps(),
      substeps: [
        { id: "arch-2-a", name: "Authentication", steps: mkSteps() },
        { id: "arch-2-b", name: "Authorization",  steps: mkSteps() },
      ],
    },
    { id: "arch-3", name: "UI Layer", steps: mkSteps(), substeps: [] },
    {
      id: "arch-4", name: "Logic Layer", steps: mkSteps(), substeps: [
        { id: "arch-4-a", name: "Opdelen applicatie", steps: mkSteps() },
        { id: "arch-4-b", name: "Domein communicatie",  steps: mkSteps() },
      ],
    },
    { id: "arch-5", name: "Database Layer", steps: mkSteps(), substeps: [] },
    { id: "arch-6", name: "(Web) Services", steps: mkSteps(), substeps: [] },
  ],
  "Tooling": [
    { id: "tool-1", name: "DevOps", steps: mkSteps(), substeps: [] },
    { id: "tool-2", name: "Prototyping", steps: mkSteps(), substeps: [] },
    { id: "tool-3", name: "FrontEnd", steps: mkSteps(), substeps: [] },
    {
      id: "tool-4", name: "BackEnd", steps: mkSteps(), substeps: [
        { id: "tool-4-a", name: "Codebase", steps: mkSteps() },
      ],
    },
    { id: "tool-5", name: "Testing", steps: mkSteps(), substeps: [] },
    { id: "tool-6", name: "Deployment", steps: mkSteps(), substeps: [] },
  ],
});

const defaultExpanded = { "arch-2": true };

const loadStoredValue = (key, fallback) => {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const stepLabels = ["Vooronderzoek", "Review vooronderzoek", "Verkenning", "Onderzoek", "Review Onderzoek", "Advies schrijven ✓"];
const epicColors = {
  "Architectuur": { accent: "#4AB8D8", dim: "#D8EEF5", glow: "rgba(74,184,216,0.2)" },
  "Tooling":      { accent: "#F5A623", dim: "#FAEBD0", glow: "rgba(245,166,35,0.2)" },
};

function StepDots({ steps, onToggle, hoveredKey, onHover, hoverPrefix }) {
  return (
    <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
      {steps.map((state, si) => {
        const isBlue = state === 1;
        const isGreen = state === 2;
        const dotBg = isGreen ? "#F5A623" : isBlue ? "#4AB8D8" : "#EDF2F8";
        const dotBorder = isGreen ? "#F5A623" : isBlue ? "#4AB8D8" : "#C8D8E8";
        const dotColor = (isBlue || isGreen) ? "#fff" : "#9AAEC8";
        const dotGlow = isGreen ? "0 0 8px #F5A62388" : isBlue ? "0 0 8px #4AB8D888" : "none";
        const dotLabel = isGreen ? "✓" : isBlue ? "…" : si + 1;
        const hKey = `${hoverPrefix}-${si}`;
        const isHovered = hoveredKey === hKey;

        return (
          <div key={si} style={{ display: "flex", alignItems: "center" }}>
            <div
              className="step-dot"
              style={{ background: dotBg, borderColor: dotBorder, color: dotColor, boxShadow: dotGlow }}
              onClick={() => onToggle(si)}
              onMouseEnter={() => onHover(hKey)}
              onMouseLeave={() => onHover(null)}
              title={stepLabels[si]}
            >
              {isHovered && <div className="tooltip">{stepLabels[si]}</div>}
              {dotLabel}
            </div>
            {si < 5 && (
              <div
                className="connector"
                style={{
                  background: isGreen && steps[si + 1] === 2
                    ? "#F5A623"
                    : isBlue && steps[si + 1] >= 1
                      ? "#4AB8D8"
                      : "#D8E4F0",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PctBadge({ steps, accent }) {
  const done = steps.filter(s => s === 2).length;
  const pct = Math.round((done / 6) * 100);
  const allDone = done === 6;

  return (
    <div style={{ width: 38, textAlign: "right", fontSize: 10, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: allDone ? accent : done > 0 ? "#7A9AB8" : "#C0D0E0" }}>
      {pct}%
    </div>
  );
}

export default function StepTracker() {
  const [data, setData] = useState(() => loadStoredValue(STORAGE_KEY, createInitialData()));
  const [expanded, setExpanded] = useState(() => loadStoredValue(EXPANDED_STORAGE_KEY, defaultExpanded));
  const [hoveredKey, setHoveredKey] = useState(null);
  const [modal, setModal] = useState(null);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    window.localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(expanded));
  }, [expanded]);

  const resetTracker = () => {
    if (!window.confirm("Alles resetten en opgeslagen voortgang verwijderen?")) return;

    const freshData = createInitialData();
    setData(freshData);
    setExpanded(defaultExpanded);
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(EXPANDED_STORAGE_KEY);
  };

  const toggleFeatureStep = (epic, featureId, si) =>
    setData(prev => ({
      ...prev,
      [epic]: prev[epic].map(f =>
        f.id === featureId ? { ...f, steps: f.steps.map((s, i) => i === si ? (s + 1) % 3 : s) } : f,
      ),
    }));

  const toggleSubstep = (epic, featureId, substepId, si) =>
    setData(prev => ({
      ...prev,
      [epic]: prev[epic].map(f =>
        f.id === featureId
          ? {
              ...f,
              substeps: f.substeps.map(sub =>
                sub.id === substepId ? { ...sub, steps: sub.steps.map((s, i) => i === si ? (s + 1) % 3 : s) } : sub,
              ),
            }
          : f,
      ),
    }));

  const openModal = (epic, mode, featureId) => {
    setModal({ epic, mode, featureId });
    setNewName("");
  };

  const confirmAdd = () => {
    if (!newName.trim()) return;

    if (modal.mode === "feature") {
      const id = `f-${Date.now()}`;
      setData(prev => ({
        ...prev,
        [modal.epic]: [...prev[modal.epic], { id, name: newName.trim(), steps: mkSteps(), substeps: [] }],
      }));
    } else {
      const id = `s-${Date.now()}`;
      setData(prev => ({
        ...prev,
        [modal.epic]: prev[modal.epic].map(f =>
          f.id === modal.featureId
            ? { ...f, substeps: [...f.substeps, { id, name: newName.trim(), steps: mkSteps() }] }
            : f,
        ),
      }));
      setExpanded(e => ({ ...e, [modal.featureId]: true }));
    }

    setModal(null);
  };

  const allArrays = Object.values(data).flat().flatMap(f => [f.steps, ...f.substeps.map(s => s.steps)]);
  const totalSteps = allArrays.reduce((a, s) => a + s.length, 0);
  const doneSteps = allArrays.reduce((a, s) => a + s.filter(x => x === 2).length, 0);
  const globalPct = Math.round((doneSteps / totalSteps) * 100);

  const epicProg = (features) => {
    const arrs = features.flatMap(f => [f.steps, ...f.substeps.map(s => s.steps)]);
    const done = arrs.reduce((a, s) => a + s.filter(x => x === 2).length, 0);
    const total = arrs.reduce((a, s) => a + s.length, 0);
    return { done, total, pct: Math.round((done / total) * 100) };
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F5F7FA", fontFamily: "'DM Mono','Courier New',monospace", padding: "40px 32px", color: "#1B2F5E" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; }
        .step-dot {
          width: 28px; height: 28px; border-radius: 50%; border: 2px solid transparent;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 500; transition: all 0.18s ease; position: relative;
        }
        .step-dot:hover { transform: scale(1.18); }
        .connector { height: 2px; flex: 1; max-width: 10px; min-width: 4px; border-radius: 2px; transition: background 0.2s; }
        .epic-card { background: #fff; border: 1px solid #D8E4F0; border-radius: 16px; padding: 28px; margin-bottom: 28px; box-shadow: 0 2px 12px rgba(27,47,94,0.07); }
        .feature-row { display: flex; align-items: center; gap: 10px; padding: 9px 4px; border-bottom: 1px solid #EDF2F8; }
        .feature-row:last-of-type { border-bottom: none; }
        .substep-row { display: flex; align-items: center; gap: 10px; padding: 7px 4px 7px 16px; border-bottom: 1px dashed #EDF2F8; background: #FAFCFF; }
        .tooltip { position: absolute; bottom: 34px; left: 50%; transform: translateX(-50%); background: #1B2F5E; border: 1px solid #2A4A6A; color: #fff; font-size: 9px; padding: 3px 7px; border-radius: 5px; white-space: nowrap; pointer-events: none; z-index: 10; }
        .add-btn { background: none; border: 1px dashed #C8D8E8; border-radius: 8px; color: #9AAEC8; font-size: 10px; font-family: 'DM Mono',monospace; cursor: pointer; padding: 5px 12px; transition: all 0.15s; }
        .add-btn:hover { border-color: #4AB8D8; color: #4AB8D8; background: #F0FAFD; }
        .sub-add-btn { background: none; border: none; color: #C8D8E8; font-size: 16px; cursor: pointer; padding: 0 2px; line-height: 1; transition: color 0.15s; }
        .sub-add-btn:hover { color: #4AB8D8; }
        .expand-btn { background: none; border: none; cursor: pointer; color: #C8D8E8; font-size: 10px; padding: 0 3px; line-height: 1; transition: transform 0.2s, color 0.15s; width: 18px; flex-shrink: 0; }
        .expand-btn:hover { color: #4AB8D8; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(27,47,94,0.22); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .modal-box { background: #fff; border-radius: 14px; padding: 28px 32px; box-shadow: 0 8px 40px rgba(27,47,94,0.18); min-width: 320px; }
        .modal-title { font-family: 'Syne',sans-serif; font-weight: 700; font-size: 15px; color: #1B2F5E; margin-bottom: 4px; }
        .modal-sub { font-size: 10px; color: #9AAEC8; margin-bottom: 2px; }
        .modal-input { width: 100%; border: 1.5px solid #C8D8E8; border-radius: 8px; padding: 9px 12px; font-family: 'DM Mono',monospace; font-size: 12px; color: #1B2F5E; outline: none; margin: 12px 0 16px; }
        .modal-input:focus { border-color: #4AB8D8; }
        .modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
        .btn-primary { background: #4AB8D8; color: #fff; border: none; border-radius: 8px; padding: 8px 18px; font-family: 'DM Mono',monospace; font-size: 11px; cursor: pointer; font-weight: 500; }
        .btn-cancel { background: #EDF2F8; color: #5A7A9A; border: none; border-radius: 8px; padding: 8px 18px; font-family: 'DM Mono',monospace; font-size: 11px; cursor: pointer; }
        .header-action { background: #fff; border: 1px solid #D8E4F0; border-radius: 999px; color: #5A7A9A; font-size: 10px; font-family: 'DM Mono',monospace; cursor: pointer; padding: 7px 12px; transition: all 0.15s; }
        .header-action:hover { border-color: #F5A623; color: #F5A623; }
        .header-note { font-size: 10px; color: #9AAEC8; letter-spacing: 0.05em; }
      `}</style>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{modal.mode === "feature" ? "Nieuwe feature" : "Nieuwe substap"}</div>
            <div className="modal-sub">{modal.epic}{modal.mode === "substep" ? ` → ${data[modal.epic].find(f => f.id === modal.featureId)?.name}` : ""}</div>
            <input
              className="modal-input"
              autoFocus
              placeholder={modal.mode === "feature" ? "Feature naam..." : "Substap naam..."}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && confirmAdd()}
            />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setModal(null)}>Annuleren</button>
              <button className="btn-primary" onClick={confirmAdd}>Toevoegen</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, color: "#1B2F5E", margin: 0, letterSpacing: "-0.5px" }}>Project Nautica</h1>
          <div style={{ flex: 1 }} />
          <span className="header-note">autosave aan · alleen op deze browser</span>
          <button className="header-action" onClick={resetTracker}>reset opslag</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 32, flexWrap: "wrap", alignItems: "center" }}>
        {stepLabels.map((label, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, background: "#fff", border: "1px solid #D8E4F0", borderRadius: 20, padding: "3px 10px 3px 7px" }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: i < 3 ? `hsl(${195 + i * 10},60%,${45 + i * 5}%)` : `hsl(${35 + (i - 3) * 8},90%,${50 + i * 2}%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 600, color: "#fff" }}>{i + 1}</div>
            <span style={{ fontSize: 10, color: "#5A7A9A" }}>{label}</span>
          </div>
        ))}
      </div>

      {Object.entries(data).map(([epic, features]) => {
        const color = epicColors[epic];
        const { done: epDone, total: epTotal, pct: epPct } = epicProg(features);

        return (
          <div key={epic} className="epic-card" style={{ borderColor: `${color.accent}33` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: color.accent, boxShadow: `0 0 10px ${color.glow}` }} />
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, color: color.accent, margin: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>Epic: {epic}</h2>
              <div style={{ flex: 1 }} />
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: color.accent, opacity: 0.7 }}>{epDone}/{epTotal} · {epPct}%</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 8, borderBottom: `1px solid ${color.dim}`, marginBottom: 4 }}>
              <div style={{ width: 18 }} />
              <span style={{ fontSize: 9, color: "#9AAEC8", width: 148, letterSpacing: "0.08em" }}>FEATURE / SUBSTAP</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
                {stepLabels.map((_, i) => <div key={i} style={{ width: 28, textAlign: "center", fontSize: 8, color: "#9AAEC8" }}>{i + 1}</div>)}
              </div>
              <span style={{ fontSize: 9, color: "#9AAEC8", width: 38, textAlign: "right" }}>%</span>
              <div style={{ width: 30 }} />
            </div>

            {features.map((feature) => {
              const isExpanded = !!expanded[feature.id];
              const hasSubsteps = feature.substeps.length > 0;
              const allDone = feature.steps.every(s => s === 2);

              return (
                <div key={feature.id}>
                  <div className="feature-row">
                    <button
                      className="expand-btn"
                      style={{ transform: isExpanded ? "rotate(90deg)" : "none", opacity: hasSubsteps ? 1 : 0.3 }}
                      onClick={() => hasSubsteps && setExpanded(e => ({ ...e, [feature.id]: !e[feature.id] }))}
                    >▶</button>

                    <div style={{ width: 148, fontSize: 11, fontWeight: 500, color: allDone ? color.accent : "#1B2F5E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {feature.name}
                      {hasSubsteps && <span style={{ marginLeft: 5, fontSize: 9, color: "#9AAEC8", fontWeight: 400 }}>·{feature.substeps.length}</span>}
                    </div>

                    <StepDots steps={feature.steps} onToggle={si => toggleFeatureStep(epic, feature.id, si)} hoveredKey={hoveredKey} onHover={setHoveredKey} hoverPrefix={feature.id} />
                    <PctBadge steps={feature.steps} accent={color.accent} />

                    <button className="sub-add-btn" onClick={() => openModal(epic, "substep", feature.id)} title="Substap toevoegen">+</button>
                  </div>

                  {isExpanded && feature.substeps.map((sub, idx) => {
                    const subAllDone = sub.steps.every(s => s === 2);
                    const isLast = idx === feature.substeps.length - 1;
                    return (
                      <div key={sub.id} className="substep-row" style={{ borderBottom: isLast ? "none" : undefined }}>
                        <div style={{ width: 18, display: "flex", alignItems: "center", justifyContent: "flex-end", flexShrink: 0 }}>
                          <span style={{ fontSize: 12, color: "#C8D8E8", lineHeight: 1 }}>{isLast ? "└" : "├"}</span>
                        </div>
                        <div style={{ width: 148, fontSize: 10, color: subAllDone ? color.accent : "#5A7A9A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {sub.name}
                        </div>
                        <StepDots steps={sub.steps} onToggle={si => toggleSubstep(epic, feature.id, sub.id, si)} hoveredKey={hoveredKey} onHover={setHoveredKey} hoverPrefix={sub.id} />
                        <PctBadge steps={sub.steps} accent={color.accent} />
                        <div style={{ width: 30 }} />
                      </div>
                    );
                  })}
                </div>
              );
            })}

            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${color.dim}` }}>
              <button className="add-btn" onClick={() => openModal(epic, "feature")}>+ feature toevoegen</button>
            </div>
          </div>
        );
      })}

      <div style={{ textAlign: "center", fontSize: 10, color: "#B0C4D8", marginTop: 12, letterSpacing: "0.08em" }}>
        KLIK 1× = BLAUW · 2× = ORANJE (done) · 3× = RESET · ▶ SUBSTAPPEN · + TOEVOEGEN
      </div>
      <div style={{ textAlign: "center", fontSize: 10, color: "#B0C4D8", marginTop: 8 }}>
        VOORTGANG WORDT AUTOMATISCH OPGESLAGEN IN JE BROWSER
      </div>
    </div>
  );
}