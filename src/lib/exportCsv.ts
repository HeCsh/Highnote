import type { Comparison, Feedback } from "./types";

/**
 * Anonymized research exports for the team's study (star-rating discrimination vs
 * pairwise discrimination). No PII exists in the system; we additionally strip the
 * free-text comment — only a `has_comment` flag is exported.
 */

function csvField(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(headers: string[], rows: (string | number)[][]): string {
  return [headers, ...rows].map((r) => r.map(csvField).join(",")).join("\n") + "\n";
}

/** feedback.csv — timestamp, table, rating, tags, has_comment (NO comment text). */
export function feedbackCsv(list: Feedback[]): string {
  const rows = list
    .slice()
    .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
    .map((f) => [
      f.created_at,
      f.table_number,
      f.rating,
      f.tags.join("|"),
      f.comment.trim().length > 0 ? "true" : "false",
    ]);
  return toCsv(["timestamp", "table", "rating", "tags", "has_comment"], rows);
}

/** comparisons.csv — timestamp, item_a, item_b, winner_or_tie. */
export function comparisonsCsv(list: Comparison[]): string {
  const rows = list
    .slice()
    .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
    .map((c) => [c.created_at, c.item_a, c.item_b, c.winner ?? "tie"]);
  return toCsv(["timestamp", "item_a", "item_b", "winner_or_tie"], rows);
}

/** Trigger a client-side download of a text file. */
export function downloadFile(filename: string, content: string, type = "text/csv") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
