import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { api } from "../api/client";

export default function Leaderboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/potm/leaderboard").then(setData);
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Player of the Match
        </h1>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Season leaderboard
        </p>
      </div>

      {data === null ? (
        <LeaderboardSkeleton />
      ) : data.length === 0 ? (
        <div className="card-static p-8 text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: "var(--surface-600)" }}
          >
            <span className="text-2xl">🏆</span>
          </div>
          <p className="font-medium text-sm" style={{ color: "var(--text-secondary)" }}>
            No POTM awards yet
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Awards will appear here as the season progresses.
          </p>
        </div>
      ) : (
        <>
          {/* Top player highlight */}
          {data.length > 0 && (
            <div
              className="card-static p-5 mb-4 flex items-center gap-4"
              style={{ borderLeft: "3px solid var(--thunder-gold)" }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0"
                style={{ background: "var(--thunder-gold-glow)" }}
              >
                🏆
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Leading POTM</p>
                <p className="text-lg font-bold" style={{ color: "var(--thunder-gold)" }}>
                  {data[0].player_name}
                </p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {data[0].count} award{data[0].count !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="card-static p-4 md:p-6">
            <ResponsiveContainer width="100%" height={Math.max(200, data.length * 48)}>
              <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--surface-500)" }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="player_name"
                  width={100}
                  tick={{ fill: "var(--text-secondary)", fontSize: 13 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-700)",
                    border: "1px solid var(--surface-500)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                  }}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                />
                <Bar dataKey="count" name="Awards" radius={[0, 6, 6, 0]} maxBarSize={32}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#FFD700" : "#0047AB"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="card-static p-6">
      <div className="skeleton h-5 w-40 mb-4" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-6 flex-1" style={{ maxWidth: `${80 - i * 12}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
