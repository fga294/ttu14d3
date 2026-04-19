// Fitness score → letter grade mapping.
// Ordered high-to-low so the first match wins in `fitnessToGrade`.
// `color` is the CSS var for inline style usage;
// `hex` is the literal color for Recharts SVG (which can't read CSS vars);
// `badgeClass` is used for pill rendering.
export const FITNESS_GRADES = [
  { min: 11,        letter: "A+", badgeClass: "badge-success", color: "var(--success)",      hex: "#22c55e", label: "Elite academy" },
  { min: 10,        letter: "A",  badgeClass: "badge-success", color: "var(--success)",      hex: "#16a34a", label: "Top grassroots" },
  { min: 9,         letter: "B+", badgeClass: "badge-gold",    color: "var(--thunder-gold)", hex: "#FFD700", label: "Strong grassroots" },
  { min: 8,         letter: "B",  badgeClass: "badge-gold",    color: "var(--thunder-gold)", hex: "#e6c200", label: "Above average" },
  { min: 7,         letter: "C",  badgeClass: "badge-warning", color: "var(--warning)",      hex: "#f59e0b", label: "Average school boys" },
  { min: 6,         letter: "D",  badgeClass: "badge-warning", color: "var(--warning)",      hex: "#d97706", label: "Below average" },
  { min: -Infinity, letter: "E",  badgeClass: "badge-danger",  color: "var(--danger)",       hex: "#ef4444", label: "Limited" },
];

export function fitnessToGrade(score) {
  if (score == null) return null;
  return FITNESS_GRADES.find((g) => score >= g.min) ?? null;
}
