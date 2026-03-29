import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function Dashboard() {
  const [players, setPlayers] = useState([]);
  const [games, setGames] = useState([]);

  useEffect(() => {
    api.get("/players").then(setPlayers);
    api.get("/games").then(setGames);
  }, []);

  const recent = games.slice(0, 3);
  const wins = games.filter((g) => g.our_score > g.their_score).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0047AB] mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-[#FFD700]">
          <p className="text-sm text-gray-500">Players</p>
          <p className="text-3xl font-bold text-[#0047AB]">{players.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-[#0047AB]">
          <p className="text-sm text-gray-500">Games Played</p>
          <p className="text-3xl font-bold text-[#0047AB]">{games.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Wins</p>
          <p className="text-3xl font-bold text-green-600">{wins}</p>
        </div>
      </div>
      <h2 className="text-lg font-semibold mb-3">Recent Games</h2>
      <div className="space-y-2">
        {recent.map((g) => (
          <Link key={g.id} to={`/games/${g.id}`} className="block bg-white rounded shadow p-3 hover:bg-gray-50">
            <div className="flex justify-between">
              <span className="font-medium">{g.opponent}</span>
              <span className="font-bold">
                {g.our_score ?? "-"} – {g.their_score ?? "-"}
              </span>
            </div>
            <span className="text-xs text-gray-400">{g.date} · {g.home_away}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
