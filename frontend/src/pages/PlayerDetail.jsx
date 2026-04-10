import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export default function PlayerDetail() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [fitness, setFitness] = useState(null);
  const { isCoach } = useAuth();
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newEntry, setNewEntry] = useState({ date: "", rating: "", notes: "" });
  const [toast, setToast] = useState(null);
  const [editingPositions, setEditingPositions] = useState(false);
  const [posForm, setPosForm] = useState({ position: "", secondary_position: "" });

  const POSITIONS = [
    { group: "Goalkeeper", options: ["GK"] },
    { group: "Defenders", options: ["CB", "LB", "RB", "LWB", "RWB"] },
    { group: "Midfielders", options: ["CDM", "CM", "CAM", "LM", "RM"] },
    { group: "Attackers", options: ["LW", "RW", "LF", "RF", "CF", "ST"] },
  ];

  const POSITION_NAMES = {
    GK: "Goalkeeper",
    CB: "Centre Back",
    LB: "Left Back",
    RB: "Right Back",
    LWB: "Left Wing Back",
    RWB: "Right Wing Back",
    CDM: "Central Defensive Midfielder",
    CM: "Central Midfielder",
    CAM: "Central Attacking Midfielder",
    LM: "Left Midfielder",
    RM: "Right Midfielder",
    LW: "Left Winger",
    RW: "Right Winger",
    LF: "Left Forward",
    RF: "Right Forward",
    CF: "Centre Forward",
    ST: "Striker",
  };

  const handleEditPositions = () => {
    setPosForm({
      position: player.position,
      secondary_position: player.secondary_position ?? "",
    });
    setEditingPositions(true);
  };

  const handlePositionSave = async () => {
    await api.put(`/players/${id}`, {
      name: player.name,
      number: player.number,
      position: posForm.position,
      secondary_position: posForm.secondary_position || null,
    });
    setPlayer({
      ...player,
      position: posForm.position,
      secondary_position: posForm.secondary_position || null,
    });
    setEditingPositions(false);
    showToast("Positions updated");
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const refreshFitness = () => api.get(`/fitness?player_id=${id}`).then(setFitness);

  const handleAdd = async () => {
    if (!newEntry.date || !newEntry.rating) return;
    await api.post("/fitness", {
      player_id: Number(id),
      date: newEntry.date,
      rating: Number(newEntry.rating),
      notes: newEntry.notes || null,
    });
    setNewEntry({ date: "", rating: "", notes: "" });
    refreshFitness();
  };

  const handleEditStart = (f) => {
    setEditRow(f.id);
    setEditForm({ date: f.date, rating: f.rating, notes: f.notes ?? "" });
  };

  const handleEditSave = async (fid) => {
    await api.put(`/fitness/${fid}`, {
      date: editForm.date,
      rating: Number(editForm.rating),
      notes: editForm.notes || null,
    });
    setEditRow(null);
    refreshFitness();
    showToast("Record updated");
  };

  const handleDelete = async (fid) => {
    await api.del(`/fitness/${fid}`);
    refreshFitness();
  };

  useEffect(() => {
    api.get(`/players/${id}`).then(setPlayer);
    api.get(`/fitness?player_id=${id}`).then(setFitness);
  }, [id]);

  if (!player) return <PlayerSkeleton />;

  const goalsAssists = player.goals + player.assists;

  const sortedFitness = fitness ? [...fitness].sort((a, b) => new Date(b.date) - new Date(a.date)) : [];
  const latestFitness = sortedFitness[0]?.rating ?? null;
  const prevFitness = sortedFitness[1]?.rating ?? null;
  const fitnessTrend = latestFitness == null || prevFitness == null ? "none"
    : latestFitness > prevFitness ? "up"
    : latestFitness < prevFitness ? "down"
    : "same";
  const fitnessPctChange = prevFitness ? (((latestFitness - prevFitness) / prevFitness) * 100) : null;

  return (
    <div>
      {/* Back link */}
      <Link
        to="/players"
        className="inline-flex items-center gap-1 text-xs font-medium mb-4"
        style={{ color: "var(--text-muted)" }}
      >
        ← Back to Players
      </Link>

      {/* Player header */}
      <div className="card-static p-5 mb-6 flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-black shrink-0"
          style={{ background: "var(--thunder-gold)", color: "var(--surface-900)" }}
        >
          {player.number}
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            {player.name}
          </h1>
          {editingPositions ? (
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <PositionSelect
                label="Primary"
                value={posForm.position}
                onChange={(v) => setPosForm({ ...posForm, position: v })}
                positions={POSITIONS}
              />
              <PositionSelect
                label="Secondary"
                value={posForm.secondary_position}
                onChange={(v) => setPosForm({ ...posForm, secondary_position: v })}
                positions={POSITIONS}
                allowClear
              />
              <button onClick={handlePositionSave} className="text-xs rounded px-2 py-1 font-semibold"
                style={{ background: "var(--thunder-gold)", color: "var(--surface-900)" }}>Save</button>
              <button onClick={() => setEditingPositions(false)} className="text-xs rounded px-2 py-1"
                style={{ background: "var(--surface-600)", color: "var(--text-secondary)" }}>Cancel</button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-1 mt-1">
                <span className="badge badge-gold">{player.position}</span>
                {player.secondary_position && (
                  <span className="badge badge-blue">{player.secondary_position}</span>
                )}
                {isCoach && (
                  <button onClick={handleEditPositions} className="text-xs rounded px-2 py-1 ml-1"
                    style={{ background: "var(--surface-600)", color: "var(--text-secondary)" }}>Edit</button>
                )}
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                {[player.position, player.secondary_position]
                  .filter(Boolean)
                  .map((code) => POSITION_NAMES[code] ?? code)
                  .join(" / ")}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Fitness history */}
      <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
        Fitness History
      </h2>
      <FitnessChart fitness={fitness} />

      {/* Main stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card-static p-4 text-center accent-gold">
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Goals + Assists</p>
          <p className="text-2xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>{goalsAssists}</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {player.goals}G · {player.assists}A
          </p>
        </div>
        <div className="card-static p-4 text-center">
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Latest Fitness Test Result</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {latestFitness != null ? latestFitness : "—"}
            </p>
            {fitnessTrend === "up" && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3L13 10H3L8 3Z" fill="#22C55E" />
              </svg>
            )}
            {fitnessTrend === "down" && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 13L3 6H13L8 13Z" fill="#DC2626" />
              </svg>
            )}
            {fitnessTrend === "same" && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="1" width="10" height="10" rx="2" fill="#3B82F6" />
              </svg>
            )}
          </div>
          {fitnessPctChange != null && (
            <p className="text-xs font-medium mt-1" style={{ color: fitnessPctChange > 0 ? "#22C55E" : fitnessPctChange < 0 ? "#DC2626" : "var(--text-muted)" }}>
              {fitnessPctChange > 0 ? "+" : ""}{fitnessPctChange.toFixed(1)}%
            </p>
          )}
        </div>
        <div className="card-static p-4 flex items-center justify-center gap-5">
          <div className="flex items-center gap-2">
            <svg width="18" height="24" viewBox="0 0 18 24" fill="none">
              <rect x="1" y="1" width="16" height="22" rx="2" fill="#FACC15" stroke="#CA8A04" strokeWidth="1"/>
              <rect x="4" y="4" width="10" height="2" rx="0.5" fill="#CA8A04" opacity="0.3"/>
            </svg>
            <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{player.yellow_cards}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="18" height="24" viewBox="0 0 18 24" fill="none">
              <rect x="1" y="1" width="16" height="22" rx="2" fill="#DC2626" stroke="#991B1B" strokeWidth="1"/>
              <rect x="4" y="4" width="10" height="2" rx="0.5" fill="#991B1B" opacity="0.3"/>
            </svg>
            <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{player.red_cards}</span>
          </div>
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "var(--thunder-gold)",
            color: "var(--surface-900)",
            borderRadius: 8,
            padding: "10px 18px",
            fontWeight: 700,
            fontSize: 14,
            zIndex: 9999,
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}
        >
          {toast}
        </div>
      )}

      {isCoach && fitness !== null && (
        <div className="card-static p-4 mb-6">
          <p className="text-xs font-semibold uppercase mb-3" style={{ color: "var(--text-muted)", letterSpacing: "0.05em" }}>
            Coach — Manage Records
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "var(--text-muted)", fontSize: 11 }}>
                <th style={{ textAlign: "left", padding: "4px 6px" }}>Date</th>
                <th style={{ textAlign: "left", padding: "4px 6px" }}>Rating</th>
                <th style={{ textAlign: "left", padding: "4px 6px" }}>Notes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {[...(fitness ?? [])].sort((a, b) => new Date(b.date) - new Date(a.date)).map((f) => (
                <tr key={f.id} style={{ borderTop: "1px solid var(--surface-600)" }}>
                  {editRow === f.id ? (
                    <>
                      <td style={{ padding: "6px" }}>
                        <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                          className="text-xs rounded px-1 py-1" style={{ background: "var(--surface-700)", color: "var(--text-primary)", border: "none" }} />
                      </td>
                      <td style={{ padding: "6px" }}>
                        <input type="number" min="1" max="10" step="0.1" value={editForm.rating} onChange={(e) => setEditForm({ ...editForm, rating: e.target.value })}
                          className="text-xs rounded px-1 py-1 w-16" style={{ background: "var(--surface-700)", color: "var(--text-primary)", border: "none" }} />
                      </td>
                      <td style={{ padding: "6px" }}>
                        <input type="text" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          className="text-xs rounded px-1 py-1 w-full" style={{ background: "var(--surface-700)", color: "var(--text-primary)", border: "none" }} />
                      </td>
                      <td style={{ padding: "6px", whiteSpace: "nowrap" }}>
                        <button onClick={() => handleEditSave(f.id)} className="text-xs rounded px-2 py-1 mr-1 font-semibold"
                          style={{ background: "var(--thunder-gold)", color: "var(--surface-900)" }}>Save</button>
                        <button onClick={() => setEditRow(null)} className="text-xs rounded px-2 py-1"
                          style={{ background: "var(--surface-600)", color: "var(--text-secondary)" }}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: "6px", color: "var(--text-secondary)" }}>{f.date}</td>
                      <td style={{ padding: "6px", fontWeight: 700, color: "var(--thunder-gold)" }}>{f.rating}/10</td>
                      <td style={{ padding: "6px", color: "var(--text-muted)" }}>{f.notes ?? "—"}</td>
                      <td style={{ padding: "6px", whiteSpace: "nowrap" }}>
                        <button onClick={() => handleEditStart(f)} className="text-xs rounded px-2 py-1 mr-1"
                          style={{ background: "var(--accent-blue, #0047AB)", color: "#fff" }}>Edit</button>
                        <button onClick={() => handleDelete(f.id)} className="text-xs rounded px-2 py-1"
                          style={{ background: "rgba(200,50,50,0.7)", color: "#fff" }}>Del</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {/* Add row */}
              <tr style={{ borderTop: "1px solid var(--surface-600)" }}>
                <td style={{ padding: "6px" }}>
                  <input type="date" value={newEntry.date} onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                    className="text-xs rounded px-1 py-1" style={{ background: "var(--surface-700)", color: "var(--text-primary)", border: "none" }} />
                </td>
                <td style={{ padding: "6px" }}>
                  <input type="number" min="1" max="10" step="0.1" placeholder="1–10" value={newEntry.rating}
                    onChange={(e) => setNewEntry({ ...newEntry, rating: e.target.value })}
                    className="text-xs rounded px-1 py-1 w-16" style={{ background: "var(--surface-700)", color: "var(--text-primary)", border: "none" }} />
                </td>
                <td style={{ padding: "6px" }}>
                  <input type="text" placeholder="Notes (optional)" value={newEntry.notes}
                    onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                    className="text-xs rounded px-1 py-1 w-full" style={{ background: "var(--surface-700)", color: "var(--text-primary)", border: "none" }} />
                </td>
                <td style={{ padding: "6px" }}>
                  <button onClick={handleAdd} className="text-xs rounded px-2 py-1 font-bold"
                    style={{ background: "var(--thunder-gold)", color: "var(--surface-900)" }}>+ Add</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FitnessChart({ fitness }) {
  if (fitness === null) {
    return (
      <div className="card-static p-4">
        <div className="skeleton h-40 w-full" />
      </div>
    );
  }
  if (fitness.length === 0) {
    return (
      <div className="card-static p-6 text-center">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No fitness records yet.</p>
      </div>
    );
  }

  const data = [...fitness]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((f) => ({ date: f.date, rating: f.rating }));

  return (
    <div className="card-static p-4 mb-6">
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="fitnessGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFD700" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#FFD700" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickLine={false} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: "var(--surface-800)", border: "none", borderRadius: 8, fontSize: 12 }}
            formatter={(value) => [`${value}/10`, "Rating"]}
          />
          <Area
            type="monotone"
            dataKey="rating"
            stroke="#FFD700"
            strokeWidth={2.5}
            fill="url(#fitnessGradient)"
            dot={{ fill: "#FFD700", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function PositionSelect({ label, value, onChange, positions, allowClear }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs rounded px-1 py-1"
      style={{ background: "var(--surface-700)", color: "var(--text-primary)", border: "none" }}
      aria-label={label}
    >
      {allowClear && <option value="">— None —</option>}
      {positions.map((g) => (
        <optgroup key={g.group} label={g.group}>
          {g.options.map((pos) => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

function PlayerSkeleton() {
  return (
    <div>
      <div className="skeleton h-4 w-24 mb-4" />
      <div className="card-static p-5 mb-6 flex items-center gap-4">
        <div className="skeleton w-14 h-14 rounded-full" />
        <div>
          <div className="skeleton h-6 w-36 mb-2" />
          <div className="skeleton h-4 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card-static p-4 text-center">
            <div className="skeleton h-3 w-16 mx-auto mb-2" />
            <div className="skeleton h-7 w-8 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
