import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import DataTable from "../components/DataTable";

export default function Players() {
  const [players, setPlayers] = useState([]);
  const { isCoach } = useAuth();
  const [form, setForm] = useState({ name: "", number: "", position: "" });

  useEffect(() => {
    api.get("/players").then(setPlayers);
  }, []);

  const columns = [
    { accessorKey: "number", header: "#", size: 60 },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <Link to={`/players/${row.original.id}`} className="text-[#0047AB] hover:underline font-medium">
          {row.original.name}
        </Link>
      ),
    },
    { accessorKey: "position", header: "Position" },
  ];

  const handleAdd = async (e) => {
    e.preventDefault();
    const player = await api.post("/players", { ...form, number: parseInt(form.number) });
    setPlayers([...players, player]);
    setForm({ name: "", number: "", position: "" });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0047AB] mb-4">Players</h1>
      {isCoach && (
        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded px-3 py-1 text-sm" required />
          <input placeholder="#" type="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })}
            className="border rounded px-3 py-1 text-sm w-16" required />
          <input placeholder="Position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}
            className="border rounded px-3 py-1 text-sm" required />
          <button type="submit" className="bg-[#FFD700] text-[#0047AB] font-bold px-4 py-1 rounded text-sm">Add</button>
        </form>
      )}
      <DataTable data={players} columns={columns} />
    </div>
  );
}
