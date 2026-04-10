import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const EVENT_ICONS = {
  goal: "⚽",
  assist: "👟",
  yellow_card: "🟨",
  red_card: "🟥",
  opponent_goal: "⚽",
};

const EVENT_BADGES = {
  goal: "badge-gold",
  assist: "badge-blue",
  yellow_card: "badge-warning",
  red_card: "badge-danger",
  opponent_goal: "badge-danger",
};

export default function GameDetail() {
  const { id } = useParams();
  const { isCoach } = useAuth();
  const [game, setGame] = useState(null);
  const [events, setEvents] = useState(null);
  const [players, setPlayers] = useState([]);
  const [form, setForm] = useState({ player_id: "", event_type: "goal", minute: "" });
  const [adding, setAdding] = useState(false);
  const [editingScore, setEditingScore] = useState(false);
  const [scoreForm, setScoreForm] = useState({ our_score: "", their_score: "" });
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    api.get(`/games/${id}`).then(setGame);
    api.get(`/games/${id}/events`).then(setEvents);
    api.get("/players").then(setPlayers);
  }, [id]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const isOpponent = form.event_type === "opponent_goal";
      const ev = await api.post(`/games/${id}/events`, {
        player_id: isOpponent ? null : parseInt(form.player_id),
        event_type: form.event_type,
        minute: form.minute ? parseInt(form.minute) : null,
      });
      setEvents([...events, ev]);
      setForm({ player_id: "", event_type: "goal", minute: "" });
    } finally {
      setAdding(false);
    }
  };

  const handleEditScore = () => {
    setScoreForm({
      our_score: game.our_score ?? "",
      their_score: game.their_score ?? "",
      weather: game.weather ?? "",
      pitch_condition: game.pitch_condition ?? "",
    });
    setEditingScore(true);
  };

  const handleSaveScore = async () => {
    const updated = await api.put(`/games/${id}`, {
      date: game.date,
      opponent: game.opponent,
      location: game.location,
      home_away: game.home_away,
      our_score: scoreForm.our_score !== "" ? parseInt(scoreForm.our_score) : null,
      their_score: scoreForm.their_score !== "" ? parseInt(scoreForm.their_score) : null,
      weather: scoreForm.weather || null,
      pitch_condition: scoreForm.pitch_condition || null,
    });
    setGame(updated);
    setEditingScore(false);
    showToast("Game updated");
  };

  if (!game) return <GameDetailSkeleton />;

  const playerName = (pid) => players.find((p) => p.id === pid)?.name ?? `#${pid}`;
  const sortedEvents = events ? [...events].sort((a, b) => (a.minute || 0) - (b.minute || 0)) : [];

  const result =
    game.our_score == null
      ? null
      : game.our_score > game.their_score
        ? "WIN"
        : game.our_score < game.their_score
          ? "LOSS"
          : "DRAW";

  const resultColor = {
    WIN: "var(--success)",
    LOSS: "var(--danger)",
    DRAW: "var(--text-secondary)",
  };

  return (
    <div>
      <Link
        to="/games"
        className="inline-flex items-center gap-1 text-xs font-medium mb-4"
        style={{ color: "var(--text-muted)" }}
      >
        ← Back to Games
      </Link>

      {/* Match header card */}
      <div className="card-static p-6 mb-6 text-center">
        <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
          {game.date} · {game.location || "TBD"} · {game.home_away.toUpperCase()}
        </p>
        <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
          {game.weather ? { sunny: "☀️ Sunny", cloudy: "☁️ Cloudy", overcast: "🌥️ Overcast", light_rain: "🌦️ Light Rain", heavy_rain: "🌧️ Heavy Rain", windy: "💨 Windy", stormy: "⛈️ Stormy" }[game.weather] : ""}
          {game.weather && game.pitch_condition ? " · " : ""}
          {game.pitch_condition ? `Pitch: ${game.pitch_condition.charAt(0).toUpperCase() + game.pitch_condition.slice(1)}` : ""}
        </p>

        {editingScore ? (
          <>
          <div className="flex items-center justify-center gap-4 mb-3">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--thunder-gold)" }}>Thunder</p>
              <input
                type="number"
                min="0"
                value={scoreForm.our_score}
                onChange={(e) => setScoreForm({ ...scoreForm, our_score: e.target.value })}
                className="text-3xl font-black text-center rounded w-20 py-1"
                style={{ background: "var(--surface-700)", color: "var(--text-primary)", border: "1px solid var(--surface-600)" }}
              />
            </div>
            <span className="text-lg font-bold" style={{ color: "var(--text-muted)" }}>vs</span>
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>{game.opponent}</p>
              <input
                type="number"
                min="0"
                value={scoreForm.their_score}
                onChange={(e) => setScoreForm({ ...scoreForm, their_score: e.target.value })}
                className="text-3xl font-black text-center rounded w-20 py-1"
                style={{ background: "var(--surface-700)", color: "var(--text-primary)", border: "1px solid var(--surface-600)" }}
              />
            </div>
          </div>
          <div className="flex justify-center gap-2 mb-3">
            <select
              value={scoreForm.weather}
              onChange={(e) => setScoreForm({ ...scoreForm, weather: e.target.value })}
              className="input-field text-xs"
            >
              <option value="">Weather (optional)</option>
              <option value="sunny">Sunny</option>
              <option value="cloudy">Cloudy</option>
              <option value="overcast">Overcast</option>
              <option value="light_rain">Light Rain</option>
              <option value="heavy_rain">Heavy Rain</option>
              <option value="windy">Windy</option>
              <option value="stormy">Stormy</option>
            </select>
            <select
              value={scoreForm.pitch_condition}
              onChange={(e) => setScoreForm({ ...scoreForm, pitch_condition: e.target.value })}
              className="input-field text-xs"
            >
              <option value="">Pitch Condition (optional)</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="bad">Bad</option>
              <option value="terrible">Terrible</option>
            </select>
          </div>
          </>
        ) : (
          <div className="flex items-center justify-center gap-6 mb-3">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--thunder-gold)" }}>Thunder</p>
              <p className="text-4xl font-black" style={{ color: "var(--text-primary)" }}>
                {game.our_score ?? "—"}
              </p>
            </div>
            <span className="text-lg font-bold" style={{ color: "var(--text-muted)" }}>vs</span>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{game.opponent}</p>
              <p className="text-4xl font-black" style={{ color: "var(--text-primary)" }}>
                {game.their_score ?? "—"}
              </p>
            </div>
          </div>
        )}

        {editingScore ? (
          <div className="flex justify-center gap-2">
            <button
              onClick={handleSaveScore}
              className="text-xs font-bold rounded px-4 py-1.5"
              style={{ background: "var(--thunder-gold)", color: "var(--surface-900)" }}
            >
              Save Score
            </button>
            <button
              onClick={() => setEditingScore(false)}
              className="text-xs font-medium rounded px-4 py-1.5"
              style={{ background: "var(--surface-600)", color: "var(--text-secondary)" }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            {result && (
              <span
                className="badge text-xs"
                style={{
                  background: `${resultColor[result]}15`,
                  color: resultColor[result],
                  border: `1px solid ${resultColor[result]}30`,
                }}
              >
                {result}
              </span>
            )}
            {isCoach && (
              <button
                onClick={handleEditScore}
                className="text-xs font-medium rounded px-3 py-1 ml-2"
                style={{ background: "var(--surface-600)", color: "var(--text-secondary)" }}
              >
                Edit Score
              </button>
            )}
          </>
        )}
      </div>

      {/* Match events */}
      <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
        Match Events
      </h2>

      {events === null ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card-static p-3 flex justify-between">
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-4 w-12" />
            </div>
          ))}
        </div>
      ) : sortedEvents.length === 0 ? (
        <div className="card-static p-6 text-center mb-4">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No events recorded for this match.</p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {sortedEvents.map((ev) => {
            const isOpponent = ev.event_type === "opponent_goal";
            return (
              <div key={ev.id} className="card-static p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{EVENT_ICONS[ev.event_type] || "•"}</span>
                  <div>
                    <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                      {isOpponent ? game.opponent : playerName(ev.player_id)}
                    </p>
                    <span className={`badge ${EVENT_BADGES[ev.event_type] || "badge-blue"}`}>
                      {isOpponent ? "goal" : ev.event_type.replace("_", " ")}
                    </span>
                  </div>
                </div>
                {ev.minute && (
                  <span className="text-sm font-mono font-bold" style={{ color: "var(--text-muted)" }}>
                    {ev.minute}'
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

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

      {/* Coach: add event */}
      {isCoach && (
        <form onSubmit={handleAdd} className="card-static p-4 mt-4">
          <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-muted)" }}>ADD EVENT</p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            {form.event_type === "opponent_goal" ? (
              <div
                className="input-field sm:col-span-2 flex items-center"
                style={{ color: "var(--text-muted)", fontStyle: "italic" }}
              >
                {game.opponent} (opponent)
              </div>
            ) : (
              <select
                value={form.player_id}
                onChange={(e) => setForm({ ...form, player_id: e.target.value })}
                className="input-field sm:col-span-2"
                required
              >
                <option value="">Select player...</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>#{p.number} {p.name}</option>
                ))}
              </select>
            )}
            <select
              value={form.event_type}
              onChange={(e) => setForm({ ...form, event_type: e.target.value, player_id: "" })}
              className="input-field"
            >
              <option value="goal">Goal</option>
              <option value="assist">Assist</option>
              <option value="yellow_card">Yellow Card</option>
              <option value="red_card">Red Card</option>
              <option value="opponent_goal">Opponent Goal</option>
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                min="1"
                max="90"
                value={form.minute}
                onChange={(e) => setForm({ ...form, minute: e.target.value })}
                className="input-field w-20"
              />
              <button type="submit" className="btn-primary whitespace-nowrap" disabled={adding}>
                {adding ? "..." : "Add"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

function GameDetailSkeleton() {
  return (
    <div>
      <div className="skeleton h-4 w-24 mb-4" />
      <div className="card-static p-6 mb-6 text-center">
        <div className="skeleton h-3 w-40 mx-auto mb-4" />
        <div className="flex items-center justify-center gap-6 mb-3">
          <div className="skeleton h-12 w-12" />
          <div className="skeleton h-5 w-8" />
          <div className="skeleton h-12 w-12" />
        </div>
      </div>
      <div className="skeleton h-5 w-32 mb-3" />
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card-static p-3 flex justify-between">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-4 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}
