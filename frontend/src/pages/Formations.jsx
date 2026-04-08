import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const FORMATION_TEMPLATES = {
  "4-3-3": [
    { x: 50, y: 89, role: "GK" },
    { x: 18, y: 71, role: "LB" },
    { x: 39, y: 74, role: "CB" },
    { x: 61, y: 74, role: "CB" },
    { x: 82, y: 71, role: "RB" },
    { x: 27, y: 49, role: "CM" },
    { x: 50, y: 46, role: "CM" },
    { x: 73, y: 49, role: "CM" },
    { x: 15, y: 25, role: "LW" },
    { x: 50, y: 15, role: "ST" },
    { x: 85, y: 25, role: "RW" },
  ],
  "4-4-2": [
    { x: 50, y: 89, role: "GK" },
    { x: 16, y: 71, role: "LB" },
    { x: 39, y: 74, role: "CB" },
    { x: 61, y: 74, role: "CB" },
    { x: 84, y: 71, role: "RB" },
    { x: 14, y: 47, role: "LM" },
    { x: 39, y: 50, role: "CM" },
    { x: 61, y: 50, role: "CM" },
    { x: 86, y: 47, role: "RM" },
    { x: 37, y: 22, role: "ST" },
    { x: 63, y: 22, role: "ST" },
  ],
  "3-5-2": [
    { x: 50, y: 89, role: "GK" },
    { x: 28, y: 73, role: "CB" },
    { x: 50, y: 75, role: "CB" },
    { x: 72, y: 73, role: "CB" },
    { x: 11, y: 49, role: "LWB" },
    { x: 34, y: 51, role: "CM" },
    { x: 50, y: 46, role: "CDM" },
    { x: 66, y: 51, role: "CM" },
    { x: 89, y: 49, role: "RWB" },
    { x: 37, y: 22, role: "ST" },
    { x: 63, y: 22, role: "ST" },
  ],
  "5-3-2": [
    { x: 50, y: 89, role: "GK" },
    { x: 10, y: 70, role: "LWB" },
    { x: 30, y: 74, role: "CB" },
    { x: 50, y: 76, role: "CB" },
    { x: 70, y: 74, role: "CB" },
    { x: 90, y: 70, role: "RWB" },
    { x: 27, y: 48, role: "CM" },
    { x: 50, y: 45, role: "CM" },
    { x: 73, y: 48, role: "CM" },
    { x: 37, y: 22, role: "ST" },
    { x: 63, y: 22, role: "ST" },
  ],
  "4-2-4": [
    { x: 50, y: 89, role: "GK" },
    { x: 16, y: 71, role: "LB" },
    { x: 39, y: 74, role: "CB" },
    { x: 61, y: 74, role: "CB" },
    { x: 84, y: 71, role: "RB" },
    { x: 35, y: 50, role: "CM" },
    { x: 65, y: 50, role: "CM" },
    { x: 12, y: 22, role: "LW" },
    { x: 38, y: 17, role: "ST" },
    { x: 62, y: 17, role: "ST" },
    { x: 88, y: 22, role: "RW" },
  ],
};

export default function Formations() {
  const { isCoach } = useAuth();
  const [formation, setFormation] = useState(null);
  const [players, setPlayers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [starters, setStarters] = useState([]);
  const [reserves, setReserves] = useState([]);
  const [formationType, setFormationType] = useState("4-3-3");
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    Promise.all([api.get("/formations"), api.get("/players")]).then(
      ([fList, pList]) => {
        setPlayers(pList);
        if (fList.length > 0) {
          const f = fList[0];
          setFormation(f);
          setStarters(f.starters);
          // Append any players not yet in the formation to reserves
          const inFormation = new Set([...f.starters, ...f.reserves]);
          const missing = pList.filter((p) => !inFormation.has(p.id)).map((p) => p.id);
          setReserves([...f.reserves, ...missing]);
          setFormationType(f.formation_type);
        }
        setLoading(false);
      }
    );
  }, []);

  const getPlayer = (id) => players.find((p) => p.id === id);

  /* --- Tap-to-swap (works on mobile + desktop) --- */
  const handleTap = (type, index) => {
    if (!isCoach) return;
    if (!selected) {
      setSelected({ type, index });
      return;
    }
    if (selected.type === type && selected.index === index) {
      setSelected(null);
      return;
    }
    doSwap(selected, { type, index });
  };

  const doSwap = (src, dst) => {
    const ns = [...starters];
    const nr = [...reserves];
    const pid1 = src.type === "field" ? ns[src.index] : nr[src.index];
    const pid2 = dst.type === "field" ? ns[dst.index] : nr[dst.index];
    if (src.type === "field") ns[src.index] = pid2; else nr[src.index] = pid2;
    if (dst.type === "field") ns[dst.index] = pid1; else nr[dst.index] = pid1;
    setStarters(ns);
    setReserves(nr);
    setSelected(null);
    setDirty(true);
  };

  /* --- Drag-and-drop (desktop enhancement) --- */
  const handleDrop = (targetType, targetIndex, e) => {
    e.preventDefault();
    try {
      const { type, index } = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (type === targetType && index === targetIndex) return;
      doSwap({ type, index }, { type: targetType, index: targetIndex });
    } catch { /* ignore bad data */ }
  };

  const handleSave = async () => {
    if (!formation) return;
    const updated = await api.put(`/formations/${formation.id}`, {
      formation_type: formationType,
      starters,
      reserves,
    });
    setFormation(updated);
    setDirty(false);
    showToast("Formation saved");
  };

  const handleCreate = async () => {
    const ids = players.map((p) => p.id);
    const created = await api.post("/formations", {
      name: "Match Day",
      formation_type: "4-3-3",
      starters: ids.slice(0, Math.min(11, ids.length)),
      reserves: ids.slice(11),
    });
    setFormation(created);
    setStarters(created.starters);
    setReserves(created.reserves);
    setFormationType(created.formation_type);
    setDirty(false);
    showToast("Formation created");
  };

  if (loading) return <FormationSkeleton />;

  if (!formation) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Formations
        </h1>
        <div className="card-static p-8 text-center">
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            No formation set up yet.
          </p>
          {isCoach && (
            <button onClick={handleCreate} className="btn-primary">
              Create Formation
            </button>
          )}
        </div>
      </div>
    );
  }

  const positions = FORMATION_TEMPLATES[formationType] || FORMATION_TEMPLATES["4-3-3"];

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Formations
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {formation.name} — {formationType}
            </p>
          </div>
          {isCoach && dirty && (
            <button
              onClick={handleSave}
              className="text-xs font-bold rounded px-4 py-1.5"
              style={{ background: "var(--thunder-gold)", color: "var(--surface-900)" }}
            >
              Save
            </button>
          )}
        </div>
        {isCoach && (
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            Tap a player, then tap another to swap positions
          </p>
        )}
      </div>

      {/* Pitch + Reserves */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Pitch */}
        <div className="flex-1 min-w-0">
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 480,
              margin: "0 auto",
              aspectRatio: "2 / 3",
              borderRadius: 12,
              overflow: "hidden",
              background:
                "repeating-linear-gradient(to bottom, #3d8b3d 0%, #3d8b3d 9.09%, #358535 9.09%, #358535 18.18%)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            }}
          >
            <PitchLines />

            {positions.map((pos, i) => {
              const player = getPlayer(starters[i]);
              if (!player) return null;
              const isGK = pos.role === "GK";
              const isSel = selected?.type === "field" && selected?.index === i;
              return (
                <div
                  key={`f-${i}`}
                  style={{
                    position: "absolute",
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: "translate(-50%, -50%)",
                    zIndex: isSel ? 10 : 2,
                    cursor: isCoach ? "pointer" : "default",
                    textAlign: "center",
                  }}
                  onClick={() => handleTap("field", i)}
                  draggable={isCoach}
                  onDragStart={(e) =>
                    e.dataTransfer.setData("text/plain", JSON.stringify({ type: "field", index: i }))
                  }
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop("field", i, e)}
                >
                  <PlayerDot
                    number={player.number}
                    isGK={isGK}
                    isSelected={isSel}
                    size={40}
                  />
                  <p style={{
                    fontSize: 9, fontWeight: 600, color: "#fff", marginTop: 2,
                    textShadow: "0 1px 3px rgba(0,0,0,0.9)", whiteSpace: "nowrap",
                  }}>
                    {player.name}
                  </p>
                  <p style={{
                    fontSize: 8, color: "rgba(255,255,255,0.6)", marginTop: 0,
                    textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                  }}>
                    {pos.role}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="md:w-52 shrink-0 space-y-4">
          {/* Formation selector */}
          <div className="card-static p-4">
            <p
              className="text-xs font-semibold uppercase mb-2"
              style={{ color: "var(--text-muted)", letterSpacing: "0.05em" }}
            >
              Formation
            </p>
            <select
              value={formationType}
              onChange={(e) => {
                if (!isCoach) return;
                setFormationType(e.target.value);
                setDirty(true);
                setSelected(null);
              }}
              disabled={!isCoach}
              className="input-field text-sm w-full"
            >
              {Object.keys(FORMATION_TEMPLATES).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Reserves */}
          <div className="card-static p-4">
            <p
              className="text-xs font-semibold uppercase mb-3"
              style={{ color: "var(--text-muted)", letterSpacing: "0.05em" }}
            >
              Reserves
            </p>
            <div className="space-y-2">
              {reserves.map((pid, i) => {
                const player = getPlayer(pid);
                if (!player) return null;
                const isSel = selected?.type === "reserve" && selected?.index === i;
                return (
                  <div
                    key={pid}
                    className="flex items-center gap-3"
                    style={{
                      cursor: isCoach ? "pointer" : "default",
                      padding: "6px 8px",
                      borderRadius: 8,
                      background: isSel ? "var(--thunder-gold-glow)" : "transparent",
                      border: isSel ? "1px solid var(--thunder-gold)" : "1px solid transparent",
                      transition: "all 0.15s",
                    }}
                    onClick={() => handleTap("reserve", i)}
                    draggable={isCoach}
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/plain", JSON.stringify({ type: "reserve", index: i }))
                    }
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop("reserve", i, e)}
                  >
                    <PlayerDot number={player.number} isGK={false} isSelected={isSel} size={36} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {player.name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {player.position}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24,
          background: "var(--thunder-gold)", color: "var(--surface-900)",
          borderRadius: 8, padding: "10px 18px", fontWeight: 700, fontSize: 14,
          zIndex: 9999, boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

/* ── Reusable player circle ── */
function PlayerDot({ number, isGK, isSelected, size }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: isGK ? "var(--thunder-gold)" : "#1e1e2e",
      color: isGK ? "#1e1e2e" : "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 900, fontSize: size * 0.38,
      flexShrink: 0,
      border: isSelected ? "3px solid var(--thunder-gold)" : "2px solid rgba(255,255,255,0.25)",
      boxShadow: isSelected ? "0 0 14px rgba(255,215,0,0.7)" : "0 2px 8px rgba(0,0,0,0.5)",
      transition: "border 0.15s, box-shadow 0.15s",
    }}>
      {number}
    </div>
  );
}

/* ── Football pitch field markings ── */
function PitchLines() {
  const s = "rgba(255,255,255,0.35)";
  return (
    <svg
      viewBox="0 0 100 150"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    >
      {/* Outer boundary */}
      <rect x="5" y="7" width="90" height="136" fill="none" stroke={s} strokeWidth="0.5" />
      {/* Center line */}
      <line x1="5" y1="75" x2="95" y2="75" stroke={s} strokeWidth="0.5" />
      {/* Center circle + spot */}
      <circle cx="50" cy="75" r="12" fill="none" stroke={s} strokeWidth="0.5" />
      <circle cx="50" cy="75" r="0.8" fill={s} />
      {/* Top penalty area */}
      <rect x="22" y="7" width="56" height="20" fill="none" stroke={s} strokeWidth="0.5" />
      <rect x="34" y="7" width="32" height="7" fill="none" stroke={s} strokeWidth="0.5" />
      <circle cx="50" cy="20" r="0.8" fill={s} />
      <path d="M 40 27 A 12 12 0 0 0 60 27" fill="none" stroke={s} strokeWidth="0.5" />
      {/* Bottom penalty area */}
      <rect x="22" y="123" width="56" height="20" fill="none" stroke={s} strokeWidth="0.5" />
      <rect x="34" y="136" width="32" height="7" fill="none" stroke={s} strokeWidth="0.5" />
      <circle cx="50" cy="130" r="0.8" fill={s} />
      <path d="M 40 123 A 12 12 0 0 1 60 123" fill="none" stroke={s} strokeWidth="0.5" />
      {/* Goals */}
      <rect x="42" y="2" width="16" height="5" fill="none" stroke={s} strokeWidth="0.3" rx="0.5" />
      <rect x="42" y="143" width="16" height="5" fill="none" stroke={s} strokeWidth="0.3" rx="0.5" />
      {/* Corner arcs */}
      <path d="M 5 9 A 2 2 0 0 0 7 7" fill="none" stroke={s} strokeWidth="0.5" />
      <path d="M 93 7 A 2 2 0 0 0 95 9" fill="none" stroke={s} strokeWidth="0.5" />
      <path d="M 7 143 A 2 2 0 0 0 5 141" fill="none" stroke={s} strokeWidth="0.5" />
      <path d="M 95 141 A 2 2 0 0 0 93 143" fill="none" stroke={s} strokeWidth="0.5" />
    </svg>
  );
}

function FormationSkeleton() {
  return (
    <div>
      <div className="skeleton h-7 w-40 mb-2" />
      <div className="skeleton h-4 w-24 mb-4" />
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div
            className="skeleton"
            style={{ aspectRatio: "2/3", borderRadius: 12, maxWidth: 480, margin: "0 auto" }}
          />
        </div>
        <div className="md:w-52">
          <div className="card-static p-4">
            <div className="skeleton h-4 w-20 mb-3" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 mb-3">
                <div className="skeleton w-9 h-9 rounded-full" />
                <div>
                  <div className="skeleton h-4 w-24 mb-1" />
                  <div className="skeleton h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
