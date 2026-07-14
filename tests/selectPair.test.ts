import { selectPair } from "../src/lib/selectPair";

let fail = 0;
const ok = (c: boolean, m: string) => {
  console.log(`${c ? "✓" : "✗"} ${m}`);
  if (!c) fail++;
};
const eqPair = (p: [string, string] | null, a: string, b: string) =>
  !!p && ((p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));

/* 1. < 2 selected → null */
ok(selectPair([], []) === null, "no selection → null");
ok(selectPair(["A"], []) === null, "single selection → null");

/* 2. prefers the under-sampled pair */
{
  const history = [
    { item_a: "A", item_b: "B" }, { item_a: "A", item_b: "B" }, { item_a: "A", item_b: "B" },
    { item_a: "A", item_b: "C" }, // A-C sampled once; B-C never
  ];
  const pair = selectPair(["A", "B", "C"], history);
  ok(eqPair(pair, "B", "C"), `picks least-sampled pair B-C (got ${pair})`);
}

/* 3. tie-break by closest current scores when counts are equal */
{
  // no history → all counts 0; scores make A-B closest
  const score = (id: string) => ({ A: 1000, B: 1010, C: 1200, D: 800 }[id] ?? 1000);
  const pair = selectPair(["A", "B", "C", "D"], [], { score });
  ok(eqPair(pair, "A", "B"), `equal counts → closest scores A-B (got ${pair})`);
}

/* 4. count dominates score (fewest comparisons wins even if scores far apart) */
{
  const history = [{ item_a: "A", item_b: "B" }]; // A-B has 1; A-C, B-C have 0
  const score = (id: string) => ({ A: 1000, B: 1005, C: 1500 }[id] ?? 1000);
  const pair = selectPair(["A", "B", "C"], history, { score });
  ok(pair !== null && !eqPair(pair, "A", "B"), `under-sampled pair beats close-but-sampled A-B (got ${pair})`);
}

/* 5. excludes already-asked pairs */
{
  const pair = selectPair(["A", "B", "C"], [], { asked: [["A", "B"], ["A", "C"]] });
  ok(eqPair(pair, "B", "C"), `skips asked pairs, returns B-C (got ${pair})`);
  const none = selectPair(["A", "B"], [], { asked: [["B", "A"]] });
  ok(none === null, "all pairs asked → null (order-insensitive)");
}

console.log(fail === 0 ? "\n✅ selectPair: ALL PASS" : `\n❌ ${fail} FAILURES`);
if (fail) process.exit(1);
