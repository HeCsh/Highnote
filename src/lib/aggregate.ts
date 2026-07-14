import type { Feedback } from "./types";

const DAY = 86_400_000;

export function average(list: Feedback[]): number {
  if (!list.length) return 0;
  return list.reduce((s, f) => s + f.rating, 0) / list.length;
}

/** Counts for 5★ → 1★ (index 0 = 5 stars). */
export function distribution(list: Feedback[]): { stars: number; count: number }[] {
  const buckets = [0, 0, 0, 0, 0];
  for (const f of list) {
    const idx = 5 - Math.min(5, Math.max(1, Math.round(f.rating)));
    buckets[idx]++;
  }
  return buckets.map((count, i) => ({ stars: 5 - i, count }));
}

/** Six weekly buckets (oldest → newest); newest bucket is the current week. */
export function reviewsPerWeek(list: Feedback[], now = Date.now()): { label: string; count: number; live: number }[] {
  const weeks = Array.from({ length: 6 }, () => ({ count: 0, live: 0 }));
  for (const f of list) {
    const age = now - new Date(f.created_at).getTime();
    const weekIdx = Math.floor(age / (7 * DAY));
    if (weekIdx < 0 || weekIdx > 5) continue;
    const b = weeks[5 - weekIdx]; // 5 = current week
    b.count++;
    if (!f.seed) b.live++;
  }
  return weeks.map((b, i) => ({ label: `W${i + 1}`, count: b.count, live: b.live }));
}

export function countThisWeek(list: Feedback[], now = Date.now()): number {
  return list.filter((f) => now - new Date(f.created_at).getTime() < 7 * DAY).length;
}

export function capturedLive(list: Feedback[]): number {
  return list.filter((f) => !f.seed).length;
}

/** "just now" / "3m ago" / "2h ago" / "yesterday" / "Mar 4". */
export function relativeTime(iso: string, now = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
