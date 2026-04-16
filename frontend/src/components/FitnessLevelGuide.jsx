import { FITNESS_GRADES } from "../utils/fitness";

export default function FitnessLevelGuide({ onClose }) {
  // Turn the [{min, letter, label, badgeClass}] array (ordered high→low)
  // into human-readable ranges for the grade table. Each row's upper bound
  // is the previous row's lower bound; top row is open-ended (≥ min).
  const gradeRows = FITNESS_GRADES.map((g, i) => {
    const prev = FITNESS_GRADES[i - 1];
    let range;
    if (!prev) range = `≥ ${g.min}`;
    else if (g.min === -Infinity) range = `< ${prev.min}`;
    else range = `${g.min} – <${prev.min}`;
    return { range, letter: g.letter, label: g.label, badgeClass: g.badgeClass };
  });

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9998,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card-static"
        style={{
          background: "var(--surface-800)",
          borderRadius: 12,
          padding: 20,
          maxWidth: 420,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            Fitness Level Guide
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-lg font-bold"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              lineHeight: 1,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>

        <p className="text-xs mb-2 font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.05em" }}>
          Score → Grade
        </p>
        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
          Letter grade shown next to a player's positions is derived from their latest fitness score.
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 20 }}>
          <thead>
            <tr style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid var(--surface-600)" }}>Score</th>
              <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid var(--surface-600)" }}>Grade</th>
              <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid var(--surface-600)" }}>Meaning</th>
            </tr>
          </thead>
          <tbody>
            {gradeRows.map((r) => (
              <tr key={r.letter} style={{ borderBottom: "1px solid var(--surface-700)" }}>
                <td style={{ padding: "8px", fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                  {r.range}
                </td>
                <td style={{ padding: "8px" }}>
                  <span className={`badge ${r.badgeClass}`}>{r.letter}</span>
                </td>
                <td style={{ padding: "8px", color: "var(--text-muted)" }}>
                  {r.label}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
