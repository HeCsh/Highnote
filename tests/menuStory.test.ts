import { buildSeedComparisons, MENU_ITEMS } from "../src/lib/demoSeed";
import { rankItems, scoreHistory } from "../src/lib/bradleyTerry";

let fail = 0;
const ok = (c: boolean, m: string) => {
  console.log(`${c ? "✓" : "✗"} ${m}`);
  if (!c) fail++;
};

const NOW = Date.parse("2026-07-14T12:00:00Z");
const comps = buildSeedComparisons(NOW);
const ids = MENU_ITEMS.map((m) => m.id);
const ranked = rankItems(ids, comps, { seed: 99 });
const byId = Object.fromEntries(ranked.map((r) => [r.id, r]));
const rankOf = (id: string) => ranked.findIndex((r) => r.id === id) + 1;

console.log(`\n${comps.length} seeded comparisons`);
console.log(ranked.map((r, i) => `  ${i + 1}. ${r.id} ${Math.round(r.score)}${r.provisional ? " (prov)" : ""} · ${r.comparisons}g ${(r.winRate * 100).toFixed(0)}%`).join("\n"));

ok(comps.length >= 150 && comps.length <= 210, `~180 comparisons (${comps.length})`);

// Mushroom Toast #1, ~80% win rate
ok(rankOf("mushroom-toast") === 1, `Mushroom Toast is #1 (rank ${rankOf("mushroom-toast")})`);
ok(byId["mushroom-toast"].winRate >= 0.72, `Mushroom Toast win rate ~80% (${(byId["mushroom-toast"].winRate * 100).toFixed(0)}%)`);

// Olive Oil Cake top-3
ok(rankOf("olive-oil-cake") <= 3, `Olive Oil Cake top-3 (rank ${rankOf("olive-oil-cake")})`);

// Fog Cutter provisional with wide CI
ok(byId["fog-cutter"].provisional, `Fog Cutter provisional (${byId["fog-cutter"].comparisons} comparisons)`);
ok(byId["fog-cutter"].comparisons === 3, `Fog Cutter has exactly 3 comparisons`);
const fogWidth = byId["fog-cutter"].ciHigh - byId["fog-cutter"].ciLow;
ok(fogWidth > 120, `Fog Cutter CI is wide (${fogWidth.toFixed(0)} Elo)`);

// All non-fog items non-provisional (>= 5 games)
const otherProv = ranked.filter((r) => r.id !== "fog-cutter" && r.provisional);
ok(otherProv.length === 0, `all non-Fog-Cutter items have >=5 comparisons (${otherProv.length} provisional)`);

// Halibut declining: score now < score 3 weeks ago, by a visible margin
const wk = 7 * 86_400_000;
const hist = scoreHistory(ids, comps, [NOW - 3 * wk, NOW]);
const hal = hist.get("pan-seared-halibut")!;
const drop = hal[0] - hal[1];
ok(drop > 25, `Halibut declined vs 3 weeks ago: ${Math.round(hal[0])} → ${Math.round(hal[1])} (▼${Math.round(drop)})`);

console.log(fail === 0 ? "\n✅ menu story: ALL PASS" : `\n❌ ${fail} FAILURES`);
if (fail) process.exit(1);
