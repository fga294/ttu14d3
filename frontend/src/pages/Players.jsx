import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import DataTable from "../components/DataTable";

export default function Players() {
  const [players, setPlayers] = useState(null);
  const { isCoach } = useAuth();
  const [form, setForm] = useState({ name: "", number: "", position: "" });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api.get("/players").then(setPlayers);
  }, []);

  const columns = [
    {
      accessorKey: "number",
      header: "#",
      size: 60,
      cell: ({ getValue }) => (
        <span className="font-bold" style={{ color: "var(--thunder-gold)" }}>{getValue()}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <Link
          to={`/players/${row.original.id}`}
          className="font-medium hover:underline"
          style={{ color: "var(--thunder-blue-light)" }}
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "position",
      header: "Position",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          <span className="badge badge-gold">{row.original.position}</span>
          {row.original.secondary_position && (
            <span className="badge badge-blue">{row.original.secondary_position}</span>
          )}
          {row.original.tertiary_position && (
            <span className="badge badge-gold" style={{ opacity: 0.7 }}>{row.original.tertiary_position}</span>
          )}
        </div>
      ),
    },
  ];

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const player = await api.post("/players", { ...form, number: parseInt(form.number) });
      setPlayers([...players, player]);
      setForm({ name: "", number: "", position: "" });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Players</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {players ? `${players.length} registered` : "Loading..."}
          </p>
        </div>
      </div>

      {isCoach && (
        <form onSubmit={handleAdd} className="card-static p-4 mb-5">
          <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-muted)" }}>ADD PLAYER</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field sm:flex-1"
              required
            />
            <input
              placeholder="#"
              type="number"
              min="1"
              max="99"
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
              className="input-field sm:w-20"
              required
            />
            <input
              placeholder="Position"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              className="input-field sm:flex-1"
              required
            />
            <button type="submit" className="btn-primary whitespace-nowrap" disabled={adding}>
              {adding ? "Adding..." : "Add Player"}
            </button>
          </div>
        </form>
      )}

      {players === null ? (
        <TableSkeleton rows={6} cols={3} />
      ) : (
        <DataTable data={players} columns={columns} />
      )}
    </div>
  );
}

function TableSkeleton({ rows, cols }) {
  return (
    <div className="card-static overflow-hidden">
      <div className="p-3" style={{ background: "var(--surface-700)" }}>
        <div className="flex gap-4">
          {[...Array(cols)].map((_, i) => (
            <div key={i} className="skeleton h-3 flex-1" />
          ))}
        </div>
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="p-3 flex gap-4" style={{ borderTop: "1px solid var(--surface-600)" }}>
          {[...Array(cols)].map((_, j) => (
            <div key={j} className="skeleton h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
