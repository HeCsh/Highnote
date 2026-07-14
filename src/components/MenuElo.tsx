import { useMemo, useState } from "react";
import type { MenuSection } from "../lib/types";
import type { MenuEloResult, MenuEloRow } from "../lib/menuElo";

const SECTIONS: (MenuSection | "All")[] = ["All", "Starters", "Mains", "Desserts", "Drinks"];

/** Tiny inline sparkline of weekly scores. Text alternative via title. */
function Sparkline({ values, title }: { values: number[]; title: string }) {
  if (values.length < 2) return null;
  const w = 56;
  const h = 18;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const up = values[values.length - 1] >= values[0];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <title>{title}</title>
      <polyline
        points={pts}
        fill="none"
        stroke={up ? "#7fa98b" : "#c4452e"}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DeltaBadge({ delta, has }: { delta: number; has: boolean }) {
  const rounded = Math.round(delta);
  if (!has || Math.abs(rounded) < 3)
    return (
      <span className="text-[11px] text-on-dark-muted" title={has ? "No significant change" : "Not enough data 3 weeks ago"}>
        —
      </span>
    );
  const up = rounded > 0;
  return (
    <span
      className={`text-[11px] font-medium tabular-nums ${up ? "text-sage" : "text-brick"}`}
      title={`${up ? "Up" : "Down"} ${Math.abs(rounded)} Elo points over 3 weeks`}
    >
      {up ? "▲" : "▼"} {Math.abs(rounded)}
    </span>
  );
}

/** Horizontal Elo score + 90% CI band, positioned within the ranked range. */
function ScoreBar({ row, lo, hi }: { row: MenuEloRow; lo: number; hi: number }) {
  const span = hi - lo || 1;
  const pct = (v: number) => `${Math.max(0, Math.min(100, ((v - lo) / span) * 100))}%`;
  const left = pct(row.ciLow);
  const width = `${Math.max(2, ((row.ciHigh - row.ciLow) / span) * 100)}%`;
  return (
    <div className="relative h-2 flex-1 rounded-full bg-white/8" title={`90% CI: ${Math.round(row.ciLow)}–${Math.round(row.ciHigh)}`}>
      <div className="absolute h-full rounded-full bg-gold/30" style={{ left, width }} />
      <div className="absolute h-full w-[3px] rounded bg-gold" style={{ left: pct(row.score) }} />
    </div>
  );
}

export default function MenuElo({ result }: { result: MenuEloResult }) {
  const [section, setSection] = useState<(typeof SECTIONS)[number]>("All");
  const [showProvisional, setShowProvisional] = useState(false);

  const ranked = useMemo(
    () => (section === "All" ? result.ranked : result.ranked.filter((r) => r.section === section)),
    [result.ranked, section],
  );
  const provisional = useMemo(
    () =>
      section === "All"
        ? result.provisional
        : result.provisional.filter((r) => r.section === section),
    [result.provisional, section],
  );

  // CI range for the bars (across the currently visible ranked set).
  const lo = Math.min(...ranked.map((r) => r.ciLow), 900);
  const hi = Math.max(...ranked.map((r) => r.ciHigh), 1100);

  return (
    <div>
      {/* biggest mover callout */}
      {result.biggest && Math.abs(result.biggest.delta3w) >= 8 && (
        <div className="mb-4 rounded-xl border border-gold/30 bg-gold/[0.06] px-4 py-3 flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">{result.biggest.emoji}</span>
          <div className="text-sm text-cream">
            <span className="font-medium">{result.biggest.name}</span>{" "}
            <span className={result.biggest.delta3w >= 0 ? "text-sage" : "text-brick"}>
              {result.biggest.delta3w >= 0 ? "▲" : "▼"} {Math.abs(Math.round(result.biggest.delta3w))} pts
            </span>{" "}
            <span className="text-on-dark-muted">
              over 3 weeks — {result.biggest.delta3w >= 0 ? "riding a wave." : "worth a look."}
            </span>
          </div>
        </div>
      )}

      {/* section filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SECTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            aria-pressed={section === s}
            className={`px-3 py-1.5 text-xs rounded-full border transition ${
              section === s
                ? "bg-gold text-ink border-gold font-semibold"
                : "border-on-dark-border text-on-dark hover:text-cream hover:border-sage/50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* header row (desktop) */}
      <div className="hidden md:grid grid-cols-[2rem_1fr_4rem_1fr_5rem_4rem_3rem] gap-3 px-3 pb-2 text-[10px] uppercase tracking-wider text-on-dark-muted">
        <div>#</div>
        <div>Dish</div>
        <div className="text-right">Elo</div>
        <div>90% CI</div>
        <div className="text-right">Compares</div>
        <div className="text-center">Trend</div>
        <div className="text-right">3w</div>
      </div>

      <div className="space-y-1.5">
        {ranked.map((r, i) => (
          <div
            key={r.id}
            className="grid grid-cols-[2rem_1fr_auto] md:grid-cols-[2rem_1fr_4rem_1fr_5rem_4rem_3rem] items-center gap-3 rounded-xl border border-on-dark-border/40 bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.05]"
          >
            <div className="font-display text-lg text-on-dark tabular-nums">{i + 1}</div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg" aria-hidden="true">{r.emoji}</span>
              <span className="text-sm text-cream truncate">{r.name}</span>
            </div>
            <div className="font-display text-base text-gold tabular-nums text-right md:text-right">
              {Math.round(r.score)}
            </div>
            <div className="hidden md:block">
              <ScoreBar row={r} lo={lo} hi={hi} />
            </div>
            <div className="hidden md:block text-right text-xs text-on-dark-muted tabular-nums">
              {r.comparisons}
            </div>
            <div className="hidden md:flex justify-center">
              <Sparkline
                values={r.history}
                title={`${r.name}: ${Math.round(r.history[0])} → ${Math.round(r.score)} Elo over 6 weeks`}
              />
            </div>
            <div className="hidden md:block text-right">
              <DeltaBadge delta={r.delta3w} has={r.hasDelta} />
            </div>
            {/* mobile: compact meta line under the name */}
            <div className="md:hidden col-span-3 flex items-center gap-3 text-xs text-on-dark-muted -mt-1 pl-8">
              <span className="tabular-nums">{r.comparisons} compares</span>
              <Sparkline values={r.history} title={`${r.name} trend`} />
              <DeltaBadge delta={r.delta3w} has={r.hasDelta} />
            </div>
          </div>
        ))}
      </div>

      {/* provisional group (collapsed) */}
      {provisional.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowProvisional((v) => !v)}
            className="text-xs text-on-dark-muted hover:text-cream flex items-center gap-2"
            aria-expanded={showProvisional}
          >
            <span>{showProvisional ? "▾" : "▸"}</span>
            Not enough data yet ({provisional.length}) — need ≥5 comparisons
          </button>
          {showProvisional && (
            <div className="space-y-1.5 mt-2">
              {provisional.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-xl border border-dashed border-on-dark-border/50 bg-white/[0.01] px-3 py-2.5"
                >
                  <span className="text-lg" aria-hidden="true">{r.emoji}</span>
                  <span className="text-sm text-on-dark flex-1 truncate">{r.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-gold border border-gold/40 rounded-full px-2 py-0.5">
                    provisional
                  </span>
                  <span className="text-xs text-on-dark-muted tabular-nums">{r.comparisons} / 5</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
