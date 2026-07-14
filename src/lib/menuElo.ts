import type { Comparison, MenuItem, MenuSection } from "./types";
import { rankItems, scoreHistory, type Ranking } from "./bradleyTerry";

const DAY = 86_400_000;

export interface MenuEloRow extends Ranking {
  name: string;
  emoji?: string;
  section: MenuSection;
  delta3w: number; // Elo change vs 3 weeks ago (0 if not enough data 3 weeks ago)
  hasDelta: boolean; // true only when the item had >=5 comparisons 3 weeks ago
  history: number[]; // 6 weekly scores (oldest → newest), for sparklines
}

export interface MenuEloResult {
  rows: MenuEloRow[]; // ranked (score desc), includes provisional
  ranked: MenuEloRow[]; // non-provisional only
  provisional: MenuEloRow[]; // provisional only
  biggest: MenuEloRow | null; // largest |delta3w| among non-provisional
  now: number;
}

/**
 * Full Menu-Elo view for the dashboard: Bradley-Terry rankings + weekly history
 * + 3-week deltas, joined to menu metadata. Pure; memoize on the comparison set.
 */
export function computeMenuElo(
  menu: MenuItem[],
  comparisons: Comparison[],
  now = Date.now(),
): MenuEloResult {
  const ids = menu.map((m) => m.id);
  const meta = Object.fromEntries(menu.map((m) => [m.id, m]));

  const rankings = rankItems(ids, comparisons, { resamples: 150, seed: 4242 });

  // Six weekly checkpoints (oldest → newest) for sparklines.
  const weekEnds = Array.from({ length: 6 }, (_, i) => now - (5 - i) * 7 * DAY);
  const hist = scoreHistory(ids, comparisons, weekEnds);
  // Score as of exactly 3 weeks ago for the delta badge.
  const cutoff = now - 21 * DAY;
  const threeWeeksAgo = scoreHistory(ids, comparisons, [cutoff]);
  // Comparisons each item had accumulated by 3 weeks ago — a delta is only
  // statistically honest if BOTH endpoints rest on enough data (no cold-start swings).
  const count3w = new Map<string, number>(ids.map((id) => [id, 0]));
  for (const c of comparisons) {
    if (new Date(c.created_at).getTime() > cutoff) continue;
    if (count3w.has(c.item_a)) count3w.set(c.item_a, count3w.get(c.item_a)! + 1);
    if (count3w.has(c.item_b)) count3w.set(c.item_b, count3w.get(c.item_b)! + 1);
  }

  // A trend is only trustworthy when BOTH endpoints rest on a solid sample —
  // a Bradley-Terry estimate on a handful of games swings on pure noise, and
  // headlining that would be false precision.
  const DELTA_MIN_TOTAL = 30;
  const DELTA_MIN_PAST = 8;
  const rows: MenuEloRow[] = rankings.map((r) => {
    const m = meta[r.id];
    const past = threeWeeksAgo.get(r.id)![0];
    const hasDelta =
      !r.provisional && r.comparisons >= DELTA_MIN_TOTAL && count3w.get(r.id)! >= DELTA_MIN_PAST;
    return {
      ...r,
      name: m.name,
      emoji: m.emoji,
      section: m.section,
      delta3w: hasDelta ? r.score - past : 0,
      hasDelta,
      history: hist.get(r.id)!,
    };
  });

  const ranked = rows.filter((r) => !r.provisional);
  const provisional = rows.filter((r) => r.provisional);
  // Spotlight the well-sampled dish that most needs attention: the steepest
  // decline (owner-actionable). If nothing is declining, spotlight the top riser.
  const movers = ranked.filter((r) => r.hasDelta);
  const decliners = movers.filter((r) => r.delta3w < 0);
  const biggest = decliners.length
    ? decliners.reduce((best, r) => (r.delta3w < best.delta3w ? r : best))
    : movers.length
      ? movers.reduce((best, r) => (r.delta3w > best.delta3w ? r : best))
      : null;

  return { rows, ranked, provisional, biggest, now };
}

/** One-line corpus note about Menu Elo movements, for the AI Radar. */
export function eloMovementNote(result: MenuEloResult): string {
  if (!result.rows.length) return "";
  const top = result.ranked[0];
  const lines = [
    top && `Top menu item by head-to-head: ${top.name} (Elo ${Math.round(top.score)}).`,
    result.biggest &&
      `Biggest 3-week move: ${result.biggest.name} ${result.biggest.delta3w >= 0 ? "up" : "down"} ${Math.abs(
        Math.round(result.biggest.delta3w),
      )} Elo points.`,
  ].filter(Boolean);
  return lines.join(" ");
}
