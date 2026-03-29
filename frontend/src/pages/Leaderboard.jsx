import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { api } from "../api/client";

export default function Leaderboard() {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get("/potm/leaderboard").then(setData);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0047AB] mb-6">Player of the Match</h1>
      {data.length === 0 ? (
        <p className="text-gray-400">No POTM awards yet.</p>
      ) : (
        <div className="bg-white rounded shadow p-6">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="player_name" width={100} />
              <Tooltip />
              <Bar dataKey="count" name="Awards" radius={[0, 6, 6, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "#FFD700" : "#0047AB"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
