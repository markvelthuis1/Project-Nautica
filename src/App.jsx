import { useEffect, useState } from "react";

import { createInitialData, defaultExpanded, mkSteps } from "./trackerDefaults";

const API_URL = "/api/tracker";

const stepLabels = [
  "Vooronderzoek",
  "Review vooronderzoek",
  "Verkenning",
  "Onderzoek",
  "Review Onderzoek",
  "Advies schrijven",
];

const epicColors = {
  Architectuur: { accent: "#4AB8D8", dim: "#D8EEF5", glow: "rgba(74,184,216,0.2)" },
  Tooling: { accent: "#F5A623", dim: "#FAEBD0", glow: "rgba(245,166,35,0.2)" },
};

function StepDots({ steps, onToggle, hoveredKey, onHover, hoverPrefix }) {
  return (
    <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
      {steps.map((state, si) => {
        const isBlue = state === 1;
        const isDone = state === 2;
        const dotBg = isDone ? "#F5A623" : isBlue ? "#4AB8D8" : "#EDF2F8";
        const dotBorder = isDone ? "#F5A623" : isBlue ? "#4AB8D8" : "#C8D8E8";
        const dotColor = isBlue || isDone ? "#fff" : "#9AAEC8";
        const dotGlow = isDone ? "0 0 8px #F5A62388" : isBlue ? "0 0 8px #4AB8D888" : "none";
        const dotLabel = isDone ? "OK" : isBlue ? "..." : si + 1;
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
                  background: isDone && steps[si + 1] === 2 ? "#F5A623" : isBlue && steps[si + 1] >= 1 ? "#4AB8D8" : "#D8E4F0",
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
  const done = steps.filter((s) => s === 2).length;
  const pct = Math.round((done / 6) * 100);
  const allDone = done === 6;

  return (
    <div
      style={{
        width: 38,
        textAlign: "right",
        fontSize: 10,
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        color: allDone ? accent : done > 0 ? "#7A9AB8" : "#C0D0E0",
      }}
    >
      {pct}%
    </div>
  );
}

export default function StepTracker() {
  const [data, setData] = useState(() => createInitialData());
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [hoveredKey, setHoveredKey] = useState(null);
  const [modal, setModal] = useState(null);
  const [newName, setNewName] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveMessage, setSaveMessage] = useState("Bezig met tracker laden...");

  useEffect(() => {
    let ignore = false;

    const loadTracker = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const stored = await response.json();
        if (ignore) return;

        setData(stored.data ?? createInitialData());
        setExpanded(stored.expanded ?? defaultExpanded);
        setSaveMessage("Opslag geladen uit tracker.json");
      } catch {
        if (ignore) return;

        setData(createInitialData());
        setExpanded(defaultExpanded);
        setSaveMessage("tracker.json kon niet worden geladen; standaarddata actief");
      } finally {
        if (!ignore) {
          setIsLoaded(true);
        }
      }
    };

    loadTracker();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return undefined;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setSaveMessage("Wijzigingen opslaan naar tracker.json...");

        const response = await fetch(API_URL, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data, expanded }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        setSaveMessage("Wijzigingen opgeslagen in tracker.json");
      } catch (error) {
        if (error?.name === "AbortError") return;

        setSaveMessage("Opslaan naar tracker.json is mislukt");
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [data, expanded, isLoaded]);

  const resetTracker = () => {
    if (!window.confirm("Alles resetten en opgeslagen voortgang verwijderen?")) return;

    setData(createInitialData());
    setExpanded(defaultExpanded);
    setSaveMessage("Tracker teruggezet naar standaardwaarden");
  };

  const toggleFeatureStep = (epic, featureId, si) =>
    setData((prev) => ({
      ...prev,
      [epic]: prev[epic].map((feature) =>
        feature.id === featureId
          ? { ...feature, steps: feature.steps.map((step, index) => (index === si ? (step + 1) % 3 : step)) }
          : feature,
      ),
    }));

  const toggleSubstep = (epic, featureId, substepId, si) =>
    setData((prev) => ({
      ...prev,
      [epic]: prev[epic].map((feature) =>
        feature.id === featureId
          ? {
              ...feature,
              substeps: feature.substeps.map((substep) =>
                substep.id === substepId
                  ? { ...substep, steps: substep.steps.map((step, index) => (index === si ? (step + 1) % 3 : step)) }
                  : substep,
              ),
            }
          : feature,
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
      setData((prev) => ({
        ...prev,
        [modal.epic]: [...prev[modal.epic], { id, name: newName.trim(), steps: mkSteps(), substeps: [] }],
      }));
    } else {
      const id = `s-${Date.now()}`;
      setData((prev) => ({
        ...prev,
        [modal.epic]: prev[modal.epic].map((feature) =>
          feature.id === modal.featureId
            ? { ...feature, substeps: [...feature.substeps, { id, name: newName.trim(), steps: mkSteps() }] }
            : feature,
        ),
      }));
      setExpanded((current) => ({ ...current, [modal.featureId]: true }));
    }

    setModal(null);
  };

  const allArrays = Object.values(data).flat().flatMap((feature) => [feature.steps, ...feature.substeps.map((substep) => substep.steps)]);
  const totalSteps = allArrays.reduce((count, steps) => count + steps.length, 0);
  const doneSteps = allArrays.reduce((count, steps) => count + steps.filter((step) => step === 2).length, 0);
  const globalPct = Math.round((doneSteps / totalSteps) * 100);

  const epicProg = (features) => {
    const arrays = features.flatMap((feature) => [feature.steps, ...feature.substeps.map((substep) => substep.steps)]);
    const done = arrays.reduce((count, steps) => count + steps.filter((step) => step === 2).length, 0);
    const total = arrays.reduce((count, steps) => count + steps.length, 0);
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
          <div className="modal-box" onClick={(event) => event.stopPropagation()}>
            <div className="modal-title">{modal.mode === "feature" ? "Nieuwe feature" : "Nieuwe substap"}</div>
            <div className="modal-sub">
              {modal.epic}
              {modal.mode === "substep" ? ` -> ${data[modal.epic].find((feature) => feature.id === modal.featureId)?.name}` : ""}
            </div>
            <input
              className="modal-input"
              autoFocus
              placeholder={modal.mode === "feature" ? "Feature naam..." : "Substap naam..."}
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && confirmAdd()}
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
          <span className="header-note">{saveMessage} | bestand: data/tracker.json</span>
          <button className="header-action" onClick={resetTracker}>reset opslag</button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220, height: 10, background: "#E2EBF4", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: `${globalPct}%`, height: "100%", background: "linear-gradient(90deg, #4AB8D8, #F5A623)", borderRadius: 999, transition: "width 0.25s ease" }} />
        </div>
        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700 }}>{globalPct}%</span>
        <span style={{ fontSize: 11, color: "#7A9AB8" }}>{doneSteps}/{totalSteps} stappen afgerond</span>
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
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: color.accent, opacity: 0.7 }}>{epDone}/{epTotal} | {epPct}%</span>
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
              const isExpanded = Boolean(expanded[feature.id]);
              const hasSubsteps = feature.substeps.length > 0;
              const allDone = feature.steps.every((step) => step === 2);

              return (
                <div key={feature.id}>
                  <div className="feature-row">
                    <button
                      className="expand-btn"
                      style={{ transform: isExpanded ? "rotate(90deg)" : "none", opacity: hasSubsteps ? 1 : 0.3 }}
                      onClick={() => hasSubsteps && setExpanded((current) => ({ ...current, [feature.id]: !current[feature.id] }))}
                    >
                      {">"}
                    </button>

                    <div style={{ width: 148, fontSize: 11, fontWeight: 500, color: allDone ? color.accent : "#1B2F5E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {feature.name}
                      {hasSubsteps && <span style={{ marginLeft: 5, fontSize: 9, color: "#9AAEC8", fontWeight: 400 }}>|{feature.substeps.length}</span>}
                    </div>

                    <StepDots steps={feature.steps} onToggle={(si) => toggleFeatureStep(epic, feature.id, si)} hoveredKey={hoveredKey} onHover={setHoveredKey} hoverPrefix={feature.id} />
                    <PctBadge steps={feature.steps} accent={color.accent} />

                    <button className="sub-add-btn" onClick={() => openModal(epic, "substep", feature.id)} title="Substap toevoegen">+</button>
                  </div>

                  {isExpanded && feature.substeps.map((sub, idx) => {
                    const subAllDone = sub.steps.every((step) => step === 2);
                    const isLast = idx === feature.substeps.length - 1;

                    return (
                      <div key={sub.id} className="substep-row" style={{ borderBottom: isLast ? "none" : undefined }}>
                        <div style={{ width: 18, display: "flex", alignItems: "center", justifyContent: "flex-end", flexShrink: 0 }}>
                          <span style={{ fontSize: 12, color: "#C8D8E8", lineHeight: 1 }}>{isLast ? "L" : "|"}</span>
                        </div>
                        <div style={{ width: 148, fontSize: 10, color: subAllDone ? color.accent : "#5A7A9A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {sub.name}
                        </div>
                        <StepDots steps={sub.steps} onToggle={(si) => toggleSubstep(epic, feature.id, sub.id, si)} hoveredKey={hoveredKey} onHover={setHoveredKey} hoverPrefix={sub.id} />
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
        KLIK 1x = BLAUW | 2x = ORANJE (done) | 3x = RESET | {">"} SUBSTAPPEN | + TOEVOEGEN
      </div>
      <div style={{ textAlign: "center", fontSize: 10, color: "#B0C4D8", marginTop: 8 }}>
        VOORTGANG WORDT AUTOMATISCH OPGESLAGEN IN data/tracker.json
      </div>
    </div>
  );
}
