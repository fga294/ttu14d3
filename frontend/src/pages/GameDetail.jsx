import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function GameDetail() {
  const { id } = useParams();
  const { isCoach } = useAuth();
  const [game, setGame] = useState(null);
  const [events, setEvents] = useState([]);
  const [players, setPlayers] = useState([]);
  const [form, setForm] = useState({ player_id: "", event_type: "goal", minute: "" });

  useEffect(() => {
    api.get(`/games/${id}`).then(setGame);
    api.get(`/games/${id}/events`).then(setEvents);
    api.get("/players").then(setPlayers);
  }, [id]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const ev = await api.post(`/games/${id}/events`, {
      player_id: parseInt(form.player_id),
      event_type: form.event_type,
      minute: form.minute ? parseInt(form.minute) : null,
    });
    setEvents([...events, ev]);
    setForm({ player_id: "", event_type: "goal", minute: "" });
  };

  if (!game) return <p>Loading...</p>;

  const playerName = (pid) => players.find((p) => p.id === pid)?.name ?? `#${pid}`;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0047AB] mb-1">
        vs {game.opponent}
      </h1>
      <p className="text-gray-500 mb-2">{game.date} · {game.location} · {game.home_away.toUpperCase()}</p>
      <p className="text-3xl font-bold mb-6">
        {game.our_score ?? "—"} – {game.their_score ?? "—"}
      </p>

      <h2 className="text-lg font-semibold mb-3">Match Events</h2>
      {events.length === 0 ? (
        <p className="text-gray-400 mb-4">No events recorded.</p>
      ) : (
        <div className="space-y-2 mb-4">
          {events.map((ev) => (
            <div key={ev.id} className="bg-white rounded shadow p-3 flex justify-between items-center">
              <span>
                <span className="font-medium">{playerName(ev.player_id)}</span>
                <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100">{ev.event_type.replace("_", " ")}</span>
              </span>
              {ev.minute && <span className="text-sm text-gray-400">{ev.minute}'</span>}
            </div>
          ))}
        </div>
      )}

      {isCoach && (
        <form onSubmit={handleAdd} className="flex gap-2 flex-wrap">
          <select value={form.player_id} onChange={(e) => setForm({ ...form, player_id: e.target.value })}
            className="border rounded px-3 py-1 text-sm" required>
            <option value="">Player...</option>
            {players.map((p) => <option key={p.id} value={p.id}>#{p.number} {p.name}</option>)}
          </select>
          <select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}
            className="border rounded px-3 py-1 text-sm">
            <option value="goal">Goal</option>
            <option value="assist">Assist</option>
            <option value="yellow_card">Yellow Card</option>
            <option value="red_card">Red Card</option>
          </select>
          <input type="number" placeholder="Min" value={form.minute}
            onChange={(e) => setForm({ ...form, minute: e.target.value })}
            className="border rounded px-3 py-1 text-sm w-16" />
          <button type="submit" className="bg-[#FFD700] text-[#0047AB] font-bold px-4 py-1 rounded text-sm">Add</button>
        </form>
      )}
    </div>
  );
}
