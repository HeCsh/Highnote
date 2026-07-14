/**
 * Bradley-Terry ranking of menu items from pairwise comparisons.
 *
 * Model:  P(i beats j) = p_i / (p_i + p_j).  We fit the strengths p_i by the
 * standard MM (minorization-maximization) iteration (Hunter 2004) — the same
 * family of method behind LMSYS Chatbot Arena's LLM leaderboard.
 *
 * Ties:   counted as half a win for each item (simple and defensible). A fuller
 *         treatment is the Davidson (1970) tie extension — future work.
 *
 * Regularization: every item plays a fixed "average" dummy opponent (strength 1)
 *         with 1 virtual win + 1 virtual loss. This pseudo-count prior stops
 *         sparse or undefeated items from exploding to ±infinity and pins the
 *         scale (the dummy anchors p around 1).
 *
 * Display: Elo-like score  1000 + 400·log10(p_i / p_median)  → median item ≈ 1000.
 *
 * Uncertainty: bootstrap resampling of the comparison set (default 200 resamples,
 *         seeded for determinism) → 90% CI per item. Items with < 5 comparisons
 *         are flagged `provisional`.
 *
 * ~all pure functions, no external stats library, so the team can walk a judge
 * through it line by line.
 */

export interface RankInput {
  item_a: string;
  item_b: string;
  winner: string | null; // null = tie
  created_at?: string; // only needed for scoreHistory
}

export interface Ranking {
  id: string;
  strength: number; // fitted p_i
  score: number; // Elo-like display score
  ciLow: number; // 90% CI lower bound (Elo)
  ciHigh: number; // 90% CI upper bound (Elo)
  comparisons: number; // real games played
  wins: number; // real wins (ties = 0.5)
  winRate: number; // wins / comparisons (0 if none)
  provisional: boolean; // < PROVISIONAL_THRESHOLD comparisons
}

export const PROVISIONAL_THRESHOLD = 5;

const PRIOR_STRENGTH = 1; // dummy opponent strength (the "average" item)
const PRIOR_WINS = 1; // virtual wins vs dummy
const PRIOR_GAMES = 2; // 1 virtual win + 1 virtual loss vs dummy
const ITERATIONS = 120; // MM iterations (BT converges quickly for a small menu)

/** Deterministic PRNG (mulberry32) so bootstrap CIs are reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function median(xs: number[]): number {
  if (!xs.length) return 1;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function percentile(sorted: number[], q: number): number {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))));
  return sorted[idx];
}

interface Tally {
  wins: Map<string, number>; // real half-wins
  games: Map<string, Map<string, number>>; // symmetric pair game counts
  played: Map<string, number>; // real games per item
}

function tally(itemIds: string[], comps: RankInput[]): Tally {
  const wins = new Map<string, number>();
  const games = new Map<string, Map<string, number>>();
  const played = new Map<string, number>();
  for (const id of itemIds) {
    wins.set(id, 0);
    games.set(id, new Map());
    played.set(id, 0);
  }
  const bump = (a: string, b: string) => {
    const m = games.get(a)!;
    m.set(b, (m.get(b) ?? 0) + 1);
  };
  for (const c of comps) {
    if (!wins.has(c.item_a) || !wins.has(c.item_b) || c.item_a === c.item_b) continue;
    bump(c.item_a, c.item_b);
    bump(c.item_b, c.item_a);
    played.set(c.item_a, played.get(c.item_a)! + 1);
    played.set(c.item_b, played.get(c.item_b)! + 1);
    if (c.winner === null) {
      wins.set(c.item_a, wins.get(c.item_a)! + 0.5);
      wins.set(c.item_b, wins.get(c.item_b)! + 0.5);
    } else if (c.winner === c.item_a) {
      wins.set(c.item_a, wins.get(c.item_a)! + 1);
    } else if (c.winner === c.item_b) {
      wins.set(c.item_b, wins.get(c.item_b)! + 1);
    }
  }
  return { wins, games, played };
}

/** Fit strengths p_i via regularized MM. Batch (Jacobi) update → order-independent. */
function fitStrengths(itemIds: string[], t: Tally): Map<string, number> {
  const p = new Map<string, number>(itemIds.map((id) => [id, 1]));
  for (let iter = 0; iter < ITERATIONS; iter++) {
    const next = new Map<string, number>();
    for (const i of itemIds) {
      const pi = p.get(i)!;
      const numerator = t.wins.get(i)! + PRIOR_WINS;
      let denom = PRIOR_GAMES / (pi + PRIOR_STRENGTH); // games vs the dummy anchor
      for (const [j, nij] of t.games.get(i)!) {
        denom += nij / (pi + p.get(j)!);
      }
      next.set(i, denom > 0 ? numerator / denom : pi);
    }
    for (const id of itemIds) p.set(id, next.get(id)!);
  }
  return p;
}

/** Elo-like scores from strengths, median item pinned to ~1000. */
function toScores(itemIds: string[], p: Map<string, number>): Map<string, number> {
  const pMed = median(itemIds.map((id) => p.get(id)!));
  const scores = new Map<string, number>();
  for (const id of itemIds) {
    scores.set(id, 1000 + 400 * Math.log10(p.get(id)! / pMed));
  }
  return scores;
}

/**
 * Rank items from comparisons. Returns one Ranking per item, sorted by score desc.
 */
export function rankItems(
  itemIds: string[],
  comparisons: RankInput[],
  opts: { resamples?: number; seed?: number } = {},
): Ranking[] {
  const resamples = opts.resamples ?? 200;
  const rng = mulberry32(opts.seed ?? 12345);

  const base = tally(itemIds, comparisons);
  const strengths = fitStrengths(itemIds, base);
  const scores = toScores(itemIds, strengths);

  // Bootstrap: resample comparisons with replacement, refit, collect scores.
  const samples = new Map<string, number[]>(itemIds.map((id) => [id, []]));
  const n = comparisons.length;
  if (n > 0) {
    for (let r = 0; r < resamples; r++) {
      const resampled: RankInput[] = new Array(n);
      for (let k = 0; k < n; k++) resampled[k] = comparisons[Math.floor(rng() * n)];
      const s = toScores(itemIds, fitStrengths(itemIds, tally(itemIds, resampled)));
      for (const id of itemIds) samples.get(id)!.push(s.get(id)!);
    }
  }

  const rankings: Ranking[] = itemIds.map((id) => {
    const played = base.played.get(id)!;
    const sorted = samples.get(id)!.slice().sort((a, b) => a - b);
    const score = scores.get(id)!;
    return {
      id,
      strength: strengths.get(id)!,
      score,
      ciLow: sorted.length ? percentile(sorted, 0.05) : score,
      ciHigh: sorted.length ? percentile(sorted, 0.95) : score,
      comparisons: played,
      wins: base.wins.get(id)!,
      winRate: played > 0 ? base.wins.get(id)! / played : 0,
      provisional: played < PROVISIONAL_THRESHOLD,
    };
  });

  return rankings.sort((a, b) => b.score - a.score);
}

/**
 * Score of each item as of each given week-end timestamp (ms), using only
 * comparisons up to that date. Powers trend sparklines. No bootstrap (fast).
 * Returns a map id → score[] aligned with `weekEnds`.
 */
export function scoreHistory(
  itemIds: string[],
  comparisons: RankInput[],
  weekEnds: number[],
): Map<string, number[]> {
  const out = new Map<string, number[]>(itemIds.map((id) => [id, []]));
  for (const end of weekEnds) {
    const upto = comparisons.filter((c) => !c.created_at || new Date(c.created_at).getTime() <= end);
    const scores = toScores(itemIds, fitStrengths(itemIds, tally(itemIds, upto)));
    for (const id of itemIds) out.get(id)!.push(scores.get(id)!);
  }
  return out;
}
