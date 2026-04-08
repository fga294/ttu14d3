import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import DataTable from "../components/DataTable";

export default function Games() {
  const [games, setGames] = useState(null);
  const { isCoach } = useAuth();
  const [form, setForm] = useState({ date: "", opponent: "", location: "", home_away: "home" });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api.get("/games").then(setGames);
  }, []);

  const columns = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ getValue }) => (
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{getValue()}</span>
      ),
    },
    {
      accessorKey: "opponent",
      header: "Opponent",
      cell: ({ row }) => (
        <Link
          to={`/games/${row.original.id}`}
          className="font-medium hover:underline"
          style={{ color: "var(--thunder-blue-light)" }}
        >
          {row.original.opponent}
        </Link>
      ),
    },
    {
      accessorKey: "home_away",
      header: "H/A",
      cell: ({ getValue }) => (
        <span className={`badge ${getValue() === "home" ? "badge-gold" : "badge-blue"}`}>
          {getValue().toUpperCase()}
        </span>
      ),
    },
    {
      header: "Score",
      cell: ({ row }) => {
        const g = row.original;
        if (g.our_score == null) return <span style={{ color: "var(--text-muted)" }}>—</span>;

        const result = g.our_score > g.their_score ? "W" : g.our_score < g.their_score ? "L" : "D";
        const color = result === "W" ? "var(--success)" : result === "L" ? "var(--danger)" : "var(--text-secondary)";

        return (
          <span className="font-bold" style={{ color }}>
            {g.our_score} – {g.their_score}
          </span>
        );
      },
    },
  ];

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const game = await api.post("/games", form);
      setGames([game, ...games]);
      setForm({ date: "", opponent: "", location: "", home_away: "home" });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Games</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {games ? `${games.length} matches` : "Loading..."}
          </p>
        </div>
      </div>

      {isCoach && (
        <form onSubmit={handleAdd} className="card-static p-4 mb-5">
          <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-muted)" }}>ADD GAME</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="input-field"
              required
            />
            <input
              placeholder="Opponent"
              value={form.opponent}
              onChange={(e) => setForm({ ...form, opponent: e.target.value })}
              className="input-field"
              required
            />
            <input
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="input-field"
            />
            <select
              value={form.home_away}
              onChange={(e) => setForm({ ...form, home_away: e.target.value })}
              className="input-field"
            >
              <option value="home">Home</option>
              <option value="away">Away</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={adding}>
            {adding ? "Adding..." : "Add Game"}
          </button>
        </form>
      )}

      {games === null ? (
        <TableSkeleton />
      ) : (
        <DataTable data={games} columns={columns} />
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="card-static overflow-hidden">
      <div className="p-3" style={{ background: "var(--surface-700)" }}>
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-3 flex-1" />)}
        </div>
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-3 flex gap-4" style={{ borderTop: "1px solid var(--surface-600)" }}>
          {[...Array(4)].map((_, j) => <div key={j} className="skeleton h-4 flex-1" />)}
        </div>
      ))}
    </div>
  );
}
