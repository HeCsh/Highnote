/**
 * Adaptive pair selection for the guest comparison flow: among the dishes a guest
 * selected, pick the pair that yields the most information per tap.
 *
 * Priority (maximize information):
 *   1. Fewest total prior comparisons (explore under-sampled pairs first).
 *   2. Tie-break by closest current scores (the most *uncertain* matchup — the one
 *      nearest the decision boundary).
 *
 * Pure and deterministic, so it's straightforward to unit-test.
 */

export interface PairHistory {
  item_a: string;
  item_b: string;
}

const key = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export function selectPair(
  selectedItems: string[],
  history: PairHistory[] = [],
  opts: { score?: (id: string) => number; asked?: Array<[string, string]> } = {},
): [string, string] | null {
  const items = [...new Set(selectedItems)];
  if (items.length < 2) return null;

  const asked = new Set((opts.asked ?? []).map(([a, b]) => key(a, b)));

  const counts = new Map<string, number>();
  for (const h of history) {
    const k = key(h.item_a, h.item_b);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  let best: [string, string] | null = null;
  let bestCount = Infinity;
  let bestGap = Infinity;

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      if (asked.has(key(a, b))) continue;
      const count = counts.get(key(a, b)) ?? 0;
      const gap = opts.score ? Math.abs(opts.score(a) - opts.score(b)) : 0;
      if (count < bestCount || (count === bestCount && gap < bestGap)) {
        best = [a, b];
        bestCount = count;
        bestGap = gap;
      }
    }
  }

  return best;
}
