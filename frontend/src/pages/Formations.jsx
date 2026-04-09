import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const DEFAULT_GRID = [
  { x: 50, y: 89 },
  { x: 18, y: 71 }, { x: 39, y: 74 }, { x: 61, y: 74 }, { x: 82, y: 71 },
  { x: 27, y: 49 }, { x: 50, y: 46 }, { x: 73, y: 49 },
  { x: 15, y: 25 }, { x: 50, y: 15 }, { x: 85, y: 25 },
];

export default function Formations() {
  const { isCoach } = useAuth();
  const [formations, setFormations] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Working state
  const [activeId, setActiveId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [positions, setPositions] = useState([]);
  const [reserves, setReserves] = useState([]);
  const [formationName, setFormationName] = useState("");

  // Interaction
  const [dragging, setDragging] = useState(null);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);
  const pitchRef = useRef(null);
  const dragRef = useRef(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    Promise.all([api.get("/formations"), api.get("/players")]).then(([fList, pList]) => {
      setFormations(fList);
      setPlayers(pList);
      if (fList.length > 0) {
        const f = fList[0];
        setPositions(f.positions);
        const onField = new Set(f.positions.map((p) => p.player_id));
        const extra = pList.filter((p) => !onField.has(p.id) && !f.reserves.includes(p.id)).map((p) => p.id);
        setReserves([...f.reserves, ...extra]);
        setFormationName(f.name);
        setActiveId(f.id);
      }
      setLoading(false);
    });
  }, []);

  const getPlayer = (id) => players.find((p) => p.id === id);

  const loadFormation = (f, pList = players) => {
    setPositions(f.positions);
    const onField = new Set(f.positions.map((p) => p.player_id));
    const extraReserves = pList.filter((p) => !onField.has(p.id) && !f.reserves.includes(p.id)).map((p) => p.id);
    setReserves([...f.reserves, ...extraReserves]);
    setFormationName(f.name);
    setActiveId(f.id);
    setEditing(false);
    setSelected(null);
    dragRef.current = null;
    setDragging(null);
  };

  const handleNew = () => {
    const ids = players.map((p) => p.id);
    const starterIds = ids.slice(0, Math.min(11, ids.length));
    const reserveIds = ids.slice(11);
    setPositions(starterIds.map((pid, i) => ({
      player_id: pid,
      x: DEFAULT_GRID[i]?.x ?? 50,
      y: DEFAULT_GRID[i]?.y ?? 50,
    })));
    setReserves(reserveIds);
    setFormationName("");
    setActiveId(null);
    setEditing(true);
    setSelected(null);
  };

  const handleEdit = () => { setEditing(true); setSelected(null); };

  const handleCancel = () => {
    if (activeId) {
      const f = formations.find((f) => f.id === activeId);
      if (f) loadFormation(f);
    } else {
      setEditing(false);
      setPositions([]);
      setReserves([]);
    }
  };

  const handleSave = async () => {
    if (!formationName.trim()) return;
    const payload = {
      name: formationName.trim(),
      positions: positions.map((p) => ({ player_id: p.player_id, x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 })),
      reserves,
    };
    if (activeId) {
      const updated = await api.put(`/formations/${activeId}`, payload);
      setFormations(formations.map((f) => (f.id === activeId ? updated : f)));
      loadFormation(updated);
      showToast("Formation updated");
    } else {
      const created = await api.post("/formations", payload);
      setFormations([...formations, created]);
      loadFormation(created);
      showToast("Formation saved");
    }
  };

  const handleDelete = async () => {
    if (!activeId) return;
    await api.del(`/formations/${activeId}`);
    const remaining = formations.filter((f) => f.id !== activeId);
    setFormations(remaining);
    if (remaining.length > 0) {
      loadFormation(remaining[0]);
    } else {
      setActiveId(null);
      setEditing(false);
      setPositions([]);
      setReserves([]);
      setFormationName("");
    }
    showToast("Formation deleted");
  };

  /* ── Free-drag via pointer events ── */
  const handlePointerDown = (index, e) => {
    if (!editing) return;
    e.preventDefault();
    dragRef.current = { index, startX: e.clientX, startY: e.clientY, moved: false };
    setDragging(index);
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current || !pitchRef.current) return;
    const { index, startX, startY } = dragRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!dragRef.current.moved && Math.hypot(dx, dy) < 5) return;
    dragRef.current.moved = true;
    setSelected(null);
    const rect = pitchRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPositions((prev) =>
      prev.map((p, i) => (i === index ? { ...p, x: Math.max(3, Math.min(97, x)), y: Math.max(3, Math.min(97, y)) } : p))
    );
  };

  const handlePointerUp = () => {
    if (dragRef.current && !dragRef.current.moved) {
      handleFieldTap(dragRef.current.index);
    }
    dragRef.current = null;
    setDragging(null);
  };

  /* ── Tap-to-swap ── */
  const handleFieldTap = (index) => {
    if (!editing) return;
    if (!selected) { setSelected({ type: "field", index }); return; }
    if (selected.type === "field" && selected.index === index) { setSelected(null); return; }
    if (selected.type === "field") {
      setPositions((prev) => {
        const np = [...prev];
        const ax = np[selected.index].x, ay = np[selected.index].y;
        np[selected.index] = { ...np[selected.index], x: np[index].x, y: np[index].y };
        np[index] = { ...np[index], x: ax, y: ay };
        return np;
      });
    } else {
      const reservePid = reserves[selected.index];
      const fieldPid = positions[index].player_id;
      setPositions((prev) => prev.map((p, i) => (i === index ? { ...p, player_id: reservePid } : p)));
      setReserves((prev) => prev.map((pid, i) => (i === selected.index ? fieldPid : pid)));
    }
    setSelected(null);
  };

  const handleReserveTap = (index) => {
    if (!editing) return;
    if (!selected) { setSelected({ type: "reserve", index }); return; }
    if (selected.type === "reserve" && selected.index === index) { setSelected(null); return; }
    if (selected.type === "field") {
      const fieldPid = positions[selected.index].player_id;
      const reservePid = reserves[index];
      setPositions((prev) => prev.map((p, i) => (i === selected.index ? { ...p, player_id: reservePid } : p)));
      setReserves((prev) => prev.map((pid, i) => (i === index ? fieldPid : pid)));
    } else {
      setReserves((prev) => {
        const nr = [...prev];
        [nr[selected.index], nr[index]] = [nr[index], nr[selected.index]];
        return nr;
      });
    }
    setSelected(null);
  };

  if (loading) return <FormationSkeleton />;

  if (!isCoach && formations.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Formations</h1>
        <div className="card-static p-8 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No formations available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Formations</h1>

        {formations.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {formations.map((f) => (
              <button
                key={f.id}
                onClick={() => loadFormation(f)}
                className="text-xs font-medium rounded px-3 py-1.5 transition-colors"
                style={{
                  background: activeId === f.id && !editing ? "var(--thunder-gold)" : "var(--surface-600)",
                  color: activeId === f.id && !editing ? "var(--surface-900)" : "var(--text-secondary)",
                }}
              >
                {f.name}
              </button>
            ))}
            {isCoach && (
              <button
                onClick={handleNew}
                className="text-xs font-bold rounded px-3 py-1.5"
                style={{ background: "var(--surface-600)", color: "var(--thunder-gold)" }}
              >
                + New Formation
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit controls */}
      {isCoach && editing && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <input
            placeholder="Formation name..."
            value={formationName}
            onChange={(e) => setFormationName(e.target.value)}
            className="input-field text-sm"
            style={{ maxWidth: 220 }}
          />
          <button
            onClick={handleSave}
            disabled={!formationName.trim()}
            className="text-xs font-bold rounded px-4 py-1.5"
            style={{ background: "var(--thunder-gold)", color: "var(--surface-900)", opacity: formationName.trim() ? 1 : 0.5 }}
          >
            Save Formation
          </button>
          <button onClick={handleCancel} className="text-xs rounded px-3 py-1.5"
            style={{ background: "var(--surface-600)", color: "var(--text-secondary)" }}>
            Cancel
          </button>
        </div>
      )}

      {isCoach && !editing && activeId && (
        <div className="flex items-center gap-2 mb-3">
          <button onClick={handleEdit} className="text-xs font-medium rounded px-3 py-1.5"
            style={{ background: "var(--surface-600)", color: "var(--text-secondary)" }}>
            Edit
          </button>
          <button onClick={handleDelete} className="text-xs font-medium rounded px-3 py-1.5"
            style={{ background: "rgba(200,50,50,0.7)", color: "#fff" }}>
            Delete
          </button>
        </div>
      )}

      {editing && (
        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
          Drag players to position them · Tap two players to swap
        </p>
      )}

      {/* Pitch + Reserves */}
      {positions.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4">
          {/* Pitch */}
          <div className="flex-1 min-w-0">
            <div
              ref={pitchRef}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 480,
                margin: "0 auto",
                aspectRatio: "2 / 3",
                borderRadius: 12,
                overflow: "hidden",
                background: "repeating-linear-gradient(to bottom, #3d8b3d 0%, #3d8b3d 9.09%, #358535 9.09%, #358535 18.18%)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                touchAction: "none",
              }}
            >
              <PitchLines />
              {positions.map((pos, i) => {
                const player = getPlayer(pos.player_id);
                if (!player) return null;
                const isGK = player.position === "GK";
                const isSel = selected?.type === "field" && selected?.index === i;
                const isDrag = dragging === i;
                return (
                  <div
                    key={`f-${i}`}
                    style={{
                      position: "absolute",
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      transform: "translate(-50%, -50%)",
                      zIndex: isDrag ? 20 : isSel ? 10 : 2,
                      cursor: editing ? (isDrag ? "grabbing" : "grab") : "default",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      touchAction: "none",
                      userSelect: "none",
                    }}
                    onPointerDown={(e) => handlePointerDown(i, e)}
                  >
                    <PlayerDot number={player.number} isGK={isGK} isSelected={isSel} size={40} />
                    <p style={{
                      fontSize: 9, fontWeight: 600, color: "#fff", marginTop: 2,
                      textShadow: "0 1px 3px rgba(0,0,0,0.9)", whiteSpace: "nowrap",
                    }}>
                      {player.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reserves sidebar */}
          <div className="md:w-52 shrink-0">
            <div className="card-static p-4">
              <p className="text-xs font-semibold uppercase mb-3"
                style={{ color: "var(--text-muted)", letterSpacing: "0.05em" }}>
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
                        cursor: editing ? "pointer" : "default",
                        padding: "6px 8px",
                        borderRadius: 8,
                        background: isSel ? "var(--thunder-gold-glow)" : "transparent",
                        border: isSel ? "1px solid var(--thunder-gold)" : "1px solid transparent",
                        transition: "all 0.15s",
                      }}
                      onClick={() => handleReserveTap(i)}
                    >
                      <PlayerDot number={player.number} isGK={false} isSelected={isSel} size={36} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{player.name}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{player.position}</p>
                      </div>
                    </div>
                  );
                })}
                {reserves.length === 0 && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>All players on field</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
      <rect x="5" y="7" width="90" height="136" fill="none" stroke={s} strokeWidth="0.5" />
      <line x1="5" y1="75" x2="95" y2="75" stroke={s} strokeWidth="0.5" />
      <circle cx="50" cy="75" r="12" fill="none" stroke={s} strokeWidth="0.5" />
      <circle cx="50" cy="75" r="0.8" fill={s} />
      <rect x="22" y="7" width="56" height="20" fill="none" stroke={s} strokeWidth="0.5" />
      <rect x="34" y="7" width="32" height="7" fill="none" stroke={s} strokeWidth="0.5" />
      <circle cx="50" cy="20" r="0.8" fill={s} />
      <path d="M 40 27 A 12 12 0 0 0 60 27" fill="none" stroke={s} strokeWidth="0.5" />
      <rect x="22" y="123" width="56" height="20" fill="none" stroke={s} strokeWidth="0.5" />
      <rect x="34" y="136" width="32" height="7" fill="none" stroke={s} strokeWidth="0.5" />
      <circle cx="50" cy="130" r="0.8" fill={s} />
      <path d="M 40 123 A 12 12 0 0 1 60 123" fill="none" stroke={s} strokeWidth="0.5" />
      <rect x="42" y="2" width="16" height="5" fill="none" stroke={s} strokeWidth="0.3" rx="0.5" />
      <rect x="42" y="143" width="16" height="5" fill="none" stroke={s} strokeWidth="0.3" rx="0.5" />
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
          <div className="skeleton" style={{ aspectRatio: "2/3", borderRadius: 12, maxWidth: 480, margin: "0 auto" }} />
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
