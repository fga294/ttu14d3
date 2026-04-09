import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function Dashboard() {
  const [players, setPlayers] = useState(null);
  const [games, setGames] = useState(null);

  useEffect(() => {
    api.get("/players").then(setPlayers);
    api.get("/games").then(setGames);
  }, []);

  const loading = players === null || games === null;

  if (loading) return <DashboardSkeleton />;

  const wins = games.filter((g) => g.our_score > g.their_score).length;
  const losses = games.filter((g) => g.our_score < g.their_score).length;
  const draws = games.filter((g) => g.our_score != null && g.our_score === g.their_score).length;
  const recent = games.slice(0, 5);

  const played = wins + draws + losses;
  const winPct = played > 0 ? Math.round(((wins + 0.5 * draws) / played) * 100) : 0;

  const stats = [
    { label: "Players", value: players.length, accent: "accent-gold" },
    { label: "Played", value: games.length, accent: "accent-blue" },
    { label: "Wins", value: wins, accent: "accent-success" },
    { label: "Draws", value: draws, accent: "accent-blue" },
    { label: "Losses", value: losses, accent: "accent-danger" },
    { label: "Win %", value: `${winPct}%`, accent: "accent-gold" },
  ];

  return (
    <div>
      {/* Season header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--thunder-gold)" }}>
          Thornleigh Thunder ⚡
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Under 14 Division 3 — 2026 Season
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
        {stats.map(({ label, value, accent }) => (
          <div key={label} className={`card-static p-3 ${accent}`}>
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              {label}
            </p>
            <p className="text-2xl font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent games */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          Recent Results
        </h2>
        <Link
          to="/games"
          className="text-xs font-medium"
          style={{ color: "var(--thunder-blue-light)" }}
        >
          View all →
        </Link>
      </div>

      {recent.length === 0 ? (
        <EmptyState message="No games played yet" sub="Games will appear here once the season starts." />
      ) : (
        <div className="space-y-2">
          {recent.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      )}
    </div>
  );
}

function GameCard({ game }) {
  const result =
    game.our_score == null
      ? null
      : game.our_score > game.their_score
        ? "W"
        : game.our_score < game.their_score
          ? "L"
          : "D";

  const resultStyle = {
    W: { bg: "rgba(34,197,94,0.12)", color: "var(--success)" },
    L: { bg: "rgba(239,68,68,0.12)", color: "var(--danger)" },
    D: { bg: "rgba(158,163,184,0.12)", color: "var(--text-secondary)" },
  };

  return (
    <Link to={`/games/${game.id}`} className="card block p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {result && (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: resultStyle[result].bg,
                color: resultStyle[result].color,
              }}
            >
              {result}
            </div>
          )}
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              {game.opponent}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {game.date} · {game.home_away.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {game.our_score ?? "—"} – {game.their_score ?? "—"}
          </p>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ message, sub }) {
  return (
    <div className="card-static p-8 text-center">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
        style={{ background: "var(--surface-600)" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-muted)" }}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 000 20 14.5 14.5 0 000-20" />
          <path d="M2 12h20" />
        </svg>
      </div>
      <p className="font-medium text-sm" style={{ color: "var(--text-secondary)" }}>{message}</p>
      {sub && <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{sub}</p>}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div>
      <div className="mb-6">
        <div className="skeleton h-7 w-48 mb-2" />
        <div className="skeleton h-4 w-64" />
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card-static p-3">
            <div className="skeleton h-3 w-12 mb-2" />
            <div className="skeleton h-7 w-8" />
          </div>
        ))}
      </div>
      <div className="skeleton h-5 w-32 mb-4" />
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card-static p-4">
            <div className="flex justify-between">
              <div className="flex items-center gap-3">
                <div className="skeleton w-8 h-8 rounded-full" />
                <div>
                  <div className="skeleton h-4 w-28 mb-1.5" />
                  <div className="skeleton h-3 w-20" />
                </div>
              </div>
              <div className="skeleton h-6 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
