import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import DataTable from "../components/DataTable";

export default function Games() {
  const [games, setGames] = useState([]);
  const { isCoach } = useAuth();
  const [form, setForm] = useState({ date: "", opponent: "", location: "", home_away: "home" });

  useEffect(() => {
    api.get("/games").then(setGames);
  }, []);

  const columns = [
    { accessorKey: "date", header: "Date" },
    {
      accessorKey: "opponent",
      header: "Opponent",
      cell: ({ row }) => (
        <Link to={`/games/${row.original.id}`} className="text-[#0047AB] hover:underline font-medium">
          {row.original.opponent}
        </Link>
      ),
    },
    { accessorKey: "home_away", header: "H/A", cell: ({ getValue }) => getValue().toUpperCase() },
    {
      header: "Score",
      cell: ({ row }) => {
        const g = row.original;
        return g.our_score != null ? `${g.our_score} – ${g.their_score}` : "—";
      },
    },
  ];

  const handleAdd = async (e) => {
    e.preventDefault();
    const game = await api.post("/games", form);
    setGames([game, ...games]);
    setForm({ date: "", opponent: "", location: "", home_away: "home" });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0047AB] mb-4">Games</h1>
      {isCoach && (
        <form onSubmit={handleAdd} className="flex gap-2 mb-4 flex-wrap">
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="border rounded px-3 py-1 text-sm" required />
          <input placeholder="Opponent" value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })}
            className="border rounded px-3 py-1 text-sm" required />
          <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="border rounded px-3 py-1 text-sm" />
          <select value={form.home_away} onChange={(e) => setForm({ ...form, home_away: e.target.value })}
            className="border rounded px-3 py-1 text-sm">
            <option value="home">Home</option>
            <option value="away">Away</option>
          </select>
          <button type="submit" className="bg-[#FFD700] text-[#0047AB] font-bold px-4 py-1 rounded text-sm">Add</button>
        </form>
      )}
      <DataTable data={games} columns={columns} />
    </div>
  );
}
