import { rankItems, scoreHistory, PROVISIONAL_THRESHOLD, type RankInput } from "../src/lib/bradleyTerry";

let fail = 0;
const ok = (c: boolean, m: string) => {
  console.log(`${c ? "✓" : "✗"} ${m}`);
  if (!c) fail++;
};

/* helper: N comparisons where `winner` beats `loser` */
const beats = (winner: string, loser: string, n: number, at?: string): RankInput[] =>
  Array.from({ length: n }, () => ({ item_a: winner, item_b: loser, winner, created_at: at }));

/* ---- 1. transitive dominance recovers correct order ---- */
{
  const items = ["A", "B", "C", "D"];
  const comps = [
    ...beats("A", "B", 8), ...beats("A", "C", 8), ...beats("A", "D", 8),
    ...beats("B", "C", 8), ...beats("B", "D", 8),
    ...beats("C", "D", 8),
  ];
  const order = rankItems(items, comps, { seed: 1 }).map((r) => r.id);
  ok(JSON.stringify(order) === JSON.stringify(["A", "B", "C", "D"]), `transitive order recovered: ${order.join(">")}`);
}

/* ---- 2. ties dilute: a tie is half a win for each ---- */
{
  const items = ["X", "Y"];
  // X and Y always tie → strengths (and scores) should be ~equal
  const ties: RankInput[] = Array.from({ length: 10 }, () => ({ item_a: "X", item_b: "Y", winner: null }));
  const r = rankItems(items, ties, { seed: 1 });
  const [x, y] = [r.find((v) => v.id === "X")!, r.find((v) => v.id === "Y")!];
  ok(Math.abs(x.score - y.score) < 1, `all-ties → equal scores (Δ=${(x.score - y.score).toFixed(3)})`);
  ok(x.wins === 5 && y.wins === 5, `tie counts as 0.5 win each (X wins=${x.wins})`);

  // half-wins vs clean wins: A beating B 10-0 should outrank a 5-5 tie split
  const clean = rankItems(["A", "B"], beats("A", "B", 10), { seed: 1 });
  const gapClean = clean[0].score - clean[1].score;
  ok(gapClean > Math.abs(x.score - y.score), `clean sweep gap (${gapClean.toFixed(1)}) > tie gap`);
}

/* ---- 3. sparse item stays provisional with a wider CI ---- */
{
  const items = ["Well", "Sparse", "Filler"];
  const comps = [
    ...beats("Well", "Filler", 12),
    ...beats("Filler", "Well", 4), // Well well-sampled (16 games)
    ...beats("Sparse", "Filler", 2), // Sparse: only 2 games → provisional
  ];
  const r = rankItems(items, comps, { seed: 7 });
  const well = r.find((v) => v.id === "Well")!;
  const sparse = r.find((v) => v.id === "Sparse")!;
  ok(sparse.provisional === true, `sparse item flagged provisional (${sparse.comparisons} < ${PROVISIONAL_THRESHOLD})`);
  ok(well.provisional === false, `well-sampled item not provisional (${well.comparisons} games)`);
  const wSparse = sparse.ciHigh - sparse.ciLow;
  const wWell = well.ciHigh - well.ciLow;
  ok(wSparse > wWell, `sparse CI wider (${wSparse.toFixed(0)}) than well-sampled (${wWell.toFixed(0)})`);
}

/* ---- 4. determinism given a seed ---- */
{
  const items = ["A", "B", "C"];
  const comps = [...beats("A", "B", 6), ...beats("B", "C", 6), ...beats("A", "C", 3), ...beats("C", "A", 3)];
  const a = rankItems(items, comps, { seed: 42 });
  const b = rankItems(items, comps, { seed: 42 });
  ok(JSON.stringify(a) === JSON.stringify(b), "same seed → identical rankings (incl. CIs)");
  const c = rankItems(items, comps, { seed: 43 });
  ok(JSON.stringify(a) !== JSON.stringify(c), "different seed → CIs differ (bootstrap actually varies)");
}

/* ---- 5. scoreHistory is monotone in information & shaped right ---- */
{
  const items = ["A", "B"];
  const t0 = Date.parse("2026-01-01");
  const wk = 7 * 86_400_000;
  // week 1: A beats B; week 2+: keeps winning
  const comps = [...beats("A", "B", 5, "2026-01-02"), ...beats("A", "B", 5, "2026-01-09")];
  const hist = scoreHistory(items, comps, [t0 + wk, t0 + 2 * wk]);
  const aHist = hist.get("A")!;
  ok(aHist.length === 2, "history returns one score per week-end");
  ok(aHist[1] >= aHist[0], `A's score non-decreasing as wins accumulate (${aHist[0].toFixed(0)} → ${aHist[1].toFixed(0)})`);
}

console.log(fail === 0 ? "\n✅ bradleyTerry: ALL PASS" : `\n❌ ${fail} FAILURES`);
if (fail) process.exit(1);
