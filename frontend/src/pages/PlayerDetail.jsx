import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";

export default function PlayerDetail() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [fitness, setFitness] = useState([]);

  useEffect(() => {
    api.get(`/players/${id}`).then(setPlayer);
    api.get(`/fitness?player_id=${id}`).then(setFitness);
  }, [id]);

  if (!player) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0047AB] mb-1">
        #{player.number} {player.name}
      </h1>
      <p className="text-gray-500 mb-6">{player.position}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          ["Goals", player.goals],
          ["Assists", player.assists],
          ["Yellow Cards", player.yellow_cards],
          ["Red Cards", player.red_cards],
        ].map(([label, val]) => (
          <div key={label} className="bg-white rounded shadow p-4 text-center">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-[#0047AB]">{val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded shadow p-4 text-center">
          <p className="text-sm text-gray-500">Avg Fitness</p>
          <p className="text-2xl font-bold text-[#0047AB]">{player.avg_fitness ?? "—"}</p>
        </div>
        <div className="bg-white rounded shadow p-4 text-center">
          <p className="text-sm text-gray-500">POTM Awards</p>
          <p className="text-2xl font-bold text-[#FFD700]">{player.potm_count}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">Fitness History</h2>
      {fitness.length === 0 ? (
        <p className="text-gray-400">No fitness records yet.</p>
      ) : (
        <div className="space-y-2">
          {fitness.map((f) => (
            <div key={f.id} className="bg-white rounded shadow p-3 flex justify-between">
              <span>{f.date}</span>
              <span className="font-bold">{f.rating}/10</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
