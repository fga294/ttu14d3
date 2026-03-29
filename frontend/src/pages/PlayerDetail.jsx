import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";

export default function PlayerDetail() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [fitness, setFitness] = useState(null);

  useEffect(() => {
    api.get(`/players/${id}`).then(setPlayer);
    api.get(`/fitness?player_id=${id}`).then(setFitness);
  }, [id]);

  if (!player) return <PlayerSkeleton />;

  const mainStats = [
    { label: "Goals", value: player.goals, accent: "accent-gold" },
    { label: "Assists", value: player.assists, accent: "accent-blue" },
    { label: "Yellow Cards", value: player.yellow_cards, accent: "accent-gold" },
    { label: "Red Cards", value: player.red_cards, accent: "accent-danger" },
  ];

  return (
    <div>
      {/* Back link */}
      <Link
        to="/players"
        className="inline-flex items-center gap-1 text-xs font-medium mb-4"
        style={{ color: "var(--text-muted)" }}
      >
        ← Back to Players
      </Link>

      {/* Player header */}
      <div className="card-static p-5 mb-6 flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-black shrink-0"
          style={{ background: "var(--thunder-gold)", color: "var(--surface-900)" }}
        >
          {player.number}
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            {player.name}
          </h1>
          <span className="badge badge-blue mt-1">{player.position}</span>
        </div>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {mainStats.map(({ label, value, accent }) => (
          <div key={label} className={`card-static p-4 text-center ${accent}`}>
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="card-static p-4 text-center accent-blue">
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Avg Fitness</p>
          <p className="text-2xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>
            {player.avg_fitness ?? "—"}
          </p>
        </div>
        <div className="card-static p-4 text-center accent-gold">
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>POTM Awards</p>
          <p className="text-2xl font-bold mt-1" style={{ color: "var(--thunder-gold)" }}>
            {player.potm_count}
          </p>
        </div>
      </div>

      {/* Fitness history */}
      <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
        Fitness History
      </h2>
      {fitness === null ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card-static p-3 flex justify-between">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-4 w-12" />
            </div>
          ))}
        </div>
      ) : fitness.length === 0 ? (
        <div className="card-static p-6 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No fitness records yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {fitness.map((f) => (
            <div key={f.id} className="card-static p-3 flex justify-between items-center">
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{f.date}</span>
              <div className="flex items-center gap-2">
                <FitnessBar rating={f.rating} />
                <span className="font-bold text-sm w-10 text-right" style={{ color: "var(--text-primary)" }}>
                  {f.rating}/10
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FitnessBar({ rating }) {
  const pct = (rating / 10) * 100;
  const color =
    rating >= 7 ? "var(--success)" : rating >= 4 ? "var(--thunder-gold)" : "var(--danger)";

  return (
    <div className="w-20 h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-600)" }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${pct}%`, background: color, transition: "width 0.5s ease" }}
      />
    </div>
  );
}

function PlayerSkeleton() {
  return (
    <div>
      <div className="skeleton h-4 w-24 mb-4" />
      <div className="card-static p-5 mb-6 flex items-center gap-4">
        <div className="skeleton w-14 h-14 rounded-full" />
        <div>
          <div className="skeleton h-6 w-36 mb-2" />
          <div className="skeleton h-4 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card-static p-4 text-center">
            <div className="skeleton h-3 w-16 mx-auto mb-2" />
            <div className="skeleton h-7 w-8 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
