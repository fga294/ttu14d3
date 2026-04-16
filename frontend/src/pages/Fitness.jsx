import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { FITNESS_GRADES, fitnessToGrade } from "../utils/fitness";
import DataTable from "../components/DataTable";
import {
  PieChart, Pie, Cell, Legend, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function Fitness() {
  const [fitnessRecords, setFitnessRecords] = useState(null);
  const [players, setPlayers] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/fitness").then(setFitnessRecords);
    api.get("/players").then(setPlayers);
  }, []);

  if (!fitnessRecords || !players) return <FitnessSkeleton />;

  // ── Build a map of player_id → sorted records (newest first) ──
  const byPlayer = {};
  for (const r of fitnessRecords) {
    (byPlayer[r.player_id] ??= []).push(r);
  }
  for (const recs of Object.values(byPlayer)) {
    recs.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // ── Player lookup ──
  const playerMap = {};
  for (const p of players) playerMap[p.id] = p;

  // ── Pie chart data: grade distribution from each player's latest score ──
  const gradeCounts = {};
  for (const [pid, recs] of Object.entries(byPlayer)) {
    if (!playerMap[pid]) continue;
    const grade = fitnessToGrade(recs[0].rating);
    if (grade) gradeCounts[grade.letter] = (gradeCounts[grade.letter] || 0) + 1;
  }
  const pieData = FITNESS_GRADES
    .filter((g) => gradeCounts[g.letter])
    .map((g) => ({
      name: g.letter,
      value: gradeCounts[g.letter],
      hex: g.hex,
      label: g.label,
    }));

  // ── Line chart data: average & median per test date ──
  const byDate = {};
  for (const r of fitnessRecords) {
    (byDate[r.date] ??= []).push(r.rating);
  }
  const lineData = Object.entries(byDate)
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .map(([date, ratings]) => {
      const avg = ratings.reduce((s, v) => s + v, 0) / ratings.length;
      return { date, average: +avg.toFixed(1) };
    });

  // ── Table data: latest result per player with trend ──
  const tableData = Object.entries(byPlayer)
    .filter(([pid]) => playerMap[pid])
    .map(([pid, recs]) => {
      const player = playerMap[pid];
      const latest = recs[0].rating;
      const prev = recs[1]?.rating ?? null;
      const grade = fitnessToGrade(latest);
      const trend = prev == null ? "none"
        : latest > prev ? "up"
        : latest < prev ? "down"
        : "same";
      const pctChange = prev ? +((((latest - prev) / prev) * 100).toFixed(1)) : null;
      return {
        id: player.id,
        name: player.name,
        number: player.number,
        grade: grade?.letter ?? "—",
        gradeColor: grade?.color,
        score: latest,
        trend,
        pctChange,
      };
    })
    .sort((a, b) => a.number - b.number);

  const columns = [
    {
      accessorKey: "name",
      header: "Player",
      cell: ({ row }) => (
        <span className="flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center text-xs font-bold rounded px-1.5 py-0.5"
            style={{ background: "var(--thunder-gold)", color: "var(--surface-900)", minWidth: "1.75rem" }}
          >
            {row.original.number}
          </span>
          <span className="font-medium" style={{ color: "var(--thunder-blue-light)" }}>
            {row.original.name}
          </span>
        </span>
      ),
    },
    {
      accessorKey: "grade",
      header: "Grade",
      cell: ({ getValue, row }) => (
        <span className="font-bold" style={{ color: row.original.gradeColor }}>
          {getValue()}
        </span>
      ),
    },
    {
      accessorKey: "score",
      header: "Score",
      cell: ({ getValue }) => (
        <span className="font-mono">{getValue().toFixed(1)}</span>
      ),
    },
    {
      accessorKey: "trend",
      header: "Trend",
      cell: ({ getValue }) => {
        const t = getValue();
        if (t === "up") return <span style={{ color: "var(--success)" }}>▲ Up</span>;
        if (t === "down") return <span style={{ color: "var(--danger)" }}>▼ Down</span>;
        if (t === "same") return <span style={{ color: "var(--thunder-blue-light)" }}>■ Same</span>;
        return <span style={{ color: "var(--text-muted)" }}>—</span>;
      },
    },
    {
      accessorKey: "pctChange",
      header: "% Change",
      cell: ({ getValue, row }) => {
        const v = getValue();
        if (v == null) return <span style={{ color: "var(--text-muted)" }}>—</span>;
        const color = row.original.trend === "up" ? "var(--success)"
          : row.original.trend === "down" ? "var(--danger)"
          : "var(--thunder-blue-light)";
        return <span style={{ color }}>{v > 0 ? "+" : ""}{v}%</span>;
      },
    },
  ];

  const totalPlayers = Object.keys(byPlayer).filter((pid) => playerMap[pid]).length;
  const teamAvg = tableData.length > 0
    ? (tableData.reduce((s, r) => s + r.score, 0) / tableData.length).toFixed(1)
    : "—";
  const teamGrade = fitnessToGrade(parseFloat(teamAvg));

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Team Fitness
        </h1>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Beep test results &amp; trends — {totalPlayers} players tracked
        </p>
      </div>

      {/* Summary stats */}
      <div className="card-static mb-6 overflow-hidden">
        <div className="grid grid-cols-3">
          <div className="p-3 accent-gold" style={{ borderRight: "1px solid var(--surface-600)" }}>
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Players</p>
            <p className="text-2xl font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>{totalPlayers}</p>
          </div>
          <div className="p-3 accent-blue" style={{ borderRight: "1px solid var(--surface-600)" }}>
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Team Avg</p>
            <p className="text-2xl font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>{teamAvg}</p>
          </div>
          <div className="p-3 accent-success">
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Team Grade</p>
            <p className="text-2xl font-bold mt-0.5" style={{ color: teamGrade?.color }}>{teamGrade?.letter ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Pie chart */}
        <div className="card-static p-4">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            Grade Distribution
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={85}
                innerRadius={40}
                paddingAngle={2}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={{ stroke: "rgba(255,255,255,0.2)" }}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.hex} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "var(--surface-800)", border: "none", borderRadius: 8, fontSize: 12 }}
                formatter={(value, name) => {
                  const g = FITNESS_GRADES.find((g) => g.letter === name);
                  return [`${value} player${value !== 1 ? "s" : ""}`, `${name} — ${g?.label ?? ""}`];
                }}
              />
              <Legend
                formatter={(value) => <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Line chart */}
        <div className="card-static p-4">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            Team Fitness Trend Over Time
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={lineData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#9ea3b8" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 15]}
                tick={{ fontSize: 11, fill: "#9ea3b8" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ background: "var(--surface-800)", border: "none", borderRadius: 8, fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="average"
                name="U14 Div3 Team's average"
                stroke="#FFD700"
                strokeWidth={2.5}
                dot={{ fill: "#FFD700", r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Legend
                formatter={(value) => <span style={{ color: "#9ea3b8", fontSize: 12 }}>{value}</span>}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Player results table */}
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          Player Results
        </h2>
        <DataTable
          data={tableData}
          columns={columns}
          onRowClick={(row) => navigate(`/players/${row.id}`)}
        />
      </div>
    </div>
  );
}

function FitnessSkeleton() {
  return (
    <div>
      <div className="mb-6">
        <div className="skeleton h-7 w-40 rounded mb-2" />
        <div className="skeleton h-4 w-56 rounded" />
      </div>
      <div className="card-static mb-6 overflow-hidden">
        <div className="grid grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="p-3" style={{ borderRight: i < 2 ? "1px solid var(--surface-600)" : undefined }}>
              <div className="skeleton h-3 w-16 rounded mb-2" />
              <div className="skeleton h-7 w-10 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card-static p-4"><div className="skeleton h-60 w-full rounded" /></div>
        <div className="card-static p-4"><div className="skeleton h-60 w-full rounded" /></div>
      </div>
      <div className="card-static p-4"><div className="skeleton h-48 w-full rounded" /></div>
    </div>
  );
}
