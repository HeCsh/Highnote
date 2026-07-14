import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Logo, StarRow, Eyebrow } from "../components/ui";
import WeekChart from "../components/WeekChart";
import ReplyCardView from "../components/ReplyCard";
import { useFeedback } from "../lib/store";
import {
  average,
  distribution,
  reviewsPerWeek,
  countThisWeek,
  capturedLive,
  relativeTime,
} from "../lib/aggregate";
import { generateInsights } from "../lib/ai";
import { SEED_REVIEWS, SEED_INSIGHTS } from "../lib/demoSeed";
import { DEMO_NAME, DEMO_LOCALITY, AI_MODE } from "../lib/config";
import type { Feedback, Insight, TagKey, VoiceKey } from "../lib/types";

const TAG_EMOJI: Record<TagKey, string> = {
  food: "🍽️",
  service: "🤝",
  ambiance: "🕯️",
  speed: "⏱️",
  value: "💰",
};

const VOICES: VoiceKey[] = ["warm", "professional", "playful"];

/** Google-rating delta: avg of last 30d vs the 30d before that. */
function monthlyDelta(list: Feedback[], now = Date.now()): number {
  const D30 = 30 * 86_400_000;
  const recent = list.filter((f) => now - +new Date(f.created_at) < D30);
  const prev = list.filter((f) => {
    const age = now - +new Date(f.created_at);
    return age >= D30 && age < 2 * D30;
  });
  if (!recent.length || !prev.length) return 0.2;
  return average(recent) - average(prev);
}

export default function Dashboard() {
  const { list } = useFeedback();
  const [voice, setVoice] = useState<VoiceKey>("warm");
  const [insights, setInsights] = useState<Insight[]>(SEED_INSIGHTS);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const stats = useMemo(() => {
    const avg = average(list);
    return {
      avg,
      delta: monthlyDelta(list),
      dist: distribution(list),
      weeks: reviewsPerWeek(list),
      thisWeek: countThisWeek(list),
      live: capturedLive(list),
      total: list.length,
    };
  }, [list]);

  async function refreshInsights() {
    setLoadingInsights(true);
    try {
      setInsights(await generateInsights(list));
    } finally {
      setLoadingInsights(false);
    }
  }

  const maxDist = Math.max(1, ...stats.dist.map((d) => d.count));
  const liveStream = list.slice(0, 12);

  return (
    <div className="min-h-screen bg-page text-cream">
      {/* header */}
      <header className="border-b border-on-dark-border/50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Logo className="text-lg" />
            </Link>
            <div className="hidden sm:block h-6 w-px bg-on-dark-border" />
            <div>
              <div className="font-display text-lg leading-tight">{DEMO_NAME}</div>
              <div className="text-xs text-on-dark-muted">{DEMO_LOCALITY}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-on-dark border border-on-dark-border rounded-full px-3 py-1.5">
              Week of Nov 4 – Nov 10
            </span>
            <Link
              to="/onboarding"
              className="text-xs text-on-dark hover:text-cream underline-offset-4 hover:underline"
            >
              Settings → Connections
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* KPI row (4 cards + distribution as 5th element) */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Kpi label="GOOGLE RATING">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-4xl text-cream">{stats.avg.toFixed(1)}</span>
              <span className="text-gold text-xl">★</span>
            </div>
            <Delta value={stats.delta} suffix=" this month" />
          </Kpi>

          <Kpi label="REVIEWS THIS WEEK">
            <span className="font-display text-4xl text-cream">{stats.thisWeek}</span>
            <div className="text-xs text-sage mt-1">{stats.live} captured live</div>
          </Kpi>

          <Kpi label="RESPONSE RATE">
            <span className="font-display text-4xl text-cream">100%</span>
            <div className="text-xs text-on-dark-muted mt-1">vs 27% industry avg</div>
          </Kpi>

          <Kpi label="NEIGHBORHOOD RANK">
            <span className="font-display text-4xl text-cream">#2</span>
            <div className="text-xs text-on-dark-muted mt-1">of 47 bistros</div>
          </Kpi>

          {/* Prototype B's live rating distribution, as the 5th KPI element */}
          <Kpi label="RATING DISTRIBUTION">
            <div className="space-y-1 mt-1">
              {stats.dist.map((d) => (
                <div key={d.stars} className="flex items-center gap-2">
                  <span className="text-[11px] text-on-dark-muted w-6 tabular-nums">{d.stars}★</span>
                  <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gold transition-all duration-500"
                      style={{ width: `${(d.count / maxDist) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-on-dark w-6 text-right tabular-nums">{d.count}</span>
                </div>
              ))}
            </div>
          </Kpi>
        </section>

        {/* Reviews per week */}
        <Panel title="Reviews per week" subtitle="6 weeks · Google + captured">
          <WeekChart data={stats.weeks} />
        </Panel>

        {/* AI Radar */}
        <Panel
          title="AI Radar"
          subtitle="Patterns from the last 30 days"
          action={
            <button
              onClick={refreshInsights}
              disabled={loadingInsights}
              className="text-xs font-medium bg-gold text-ink rounded-lg px-3 py-2 hover:brightness-105 transition disabled:opacity-50"
            >
              {loadingInsights ? "Analyzing…" : "✦ Refresh insights"}
            </button>
          }
        >
          {AI_MODE === "seed" && (
            <div className="text-[11px] text-on-dark-muted mb-3">
              Showing demo data — set VITE_ANTHROPIC_API_KEY for live analysis of the current corpus.
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-3">
            {loadingInsights
              ? [0, 1, 2].map((i) => (
                  <div key={i} className="rounded-xl border border-on-dark-border/50 p-4 space-y-2">
                    <div className="ai-shimmer h-4 w-2/3" />
                    <div className="ai-shimmer h-3 w-full" />
                    <div className="ai-shimmer h-3 w-5/6" />
                  </div>
                ))
              : insights.map((ins) => (
                  <div key={ins.id} className="rounded-xl border border-on-dark-border/50 bg-white/[0.03] p-4">
                    <div className="font-display text-base text-cream">{ins.title}</div>
                    <p className="text-sm text-on-dark mt-1.5 leading-relaxed">{ins.detail}</p>
                    {ins.demo && (
                      <div className="text-[10px] text-on-dark-muted mt-2 uppercase tracking-wider">
                        demo data
                      </div>
                    )}
                  </div>
                ))}
          </div>
        </Panel>

        {/* Live guest feedback */}
        <Panel title="Live guest feedback" subtitle="Streams from tabletop QR codes">
          <div className="space-y-2">
            {liveStream.map((f) => (
              <div
                key={f.id}
                className="animate-slide-in flex items-center gap-3 rounded-xl border border-on-dark-border/40 bg-white/[0.02] px-4 py-3"
              >
                <StarRow rating={f.rating} size={14} />
                <div className="flex gap-1 flex-wrap">
                  {f.tags.map((tg) => (
                    <span key={tg} className="text-xs" title={tg}>
                      {TAG_EMOJI[tg]}
                    </span>
                  ))}
                </div>
                {f.comment && (
                  <span className="text-sm text-on-dark truncate flex-1 min-w-0">"{f.comment}"</span>
                )}
                <span className="text-xs text-on-dark-muted ml-auto whitespace-nowrap">
                  Table {f.table_number} · {relativeTime(f.created_at)}
                </span>
                {!f.seed && (
                  <span className="text-[10px] text-gold border border-gold/40 rounded-full px-1.5 py-0.5">
                    live
                  </span>
                )}
              </div>
            ))}
          </div>
        </Panel>

        {/* Reviews awaiting a response */}
        <Panel
          title="Reviews awaiting a response"
          subtitle="AI drafts in your house voice"
          action={
            <div className="flex items-center gap-2">
              <Eyebrow className="tracking-[0.2em] hidden sm:block">VOICE OF THE HOUSE</Eyebrow>
              <div className="flex rounded-full border border-on-dark-border p-0.5">
                {VOICES.map((v) => (
                  <button
                    key={v}
                    onClick={() => setVoice(v)}
                    aria-pressed={voice === v}
                    className={`px-3 py-1 text-xs rounded-full capitalize transition ${
                      voice === v ? "bg-gold text-ink font-semibold" : "text-on-dark hover:text-cream"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          }
        >
          <div className="grid gap-3 md:grid-cols-3">
            {SEED_REVIEWS.map((r) => (
              <ReplyCardView key={r.id} review={r} voice={voice} />
            ))}
          </div>
        </Panel>

        {/* Tabletop QR codes */}
        <Panel title="Tabletop QR codes" subtitle="One card per table, HighNote-branded">
          <Link
            to="/onboarding?step=3"
            className="inline-block text-sm font-semibold bg-gold text-ink rounded-lg px-4 py-2.5 hover:brightness-105 transition"
          >
            Download table QR codes (PDF)
          </Link>
        </Panel>
      </main>
    </div>
  );
}

/* ---- small presentational helpers ---- */

function Kpi({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-on-dark-border/50 bg-white/[0.03] p-4">
      <div className="text-[10px] tracking-[0.18em] text-on-dark-muted uppercase mb-2">{label}</div>
      {children}
    </div>
  );
}

function Delta({ value, suffix }: { value: number; suffix: string }) {
  const up = value >= 0;
  return (
    <div className={`text-xs mt-1 ${up ? "text-sage" : "text-brick"}`}>
      {up ? "+" : ""}
      {value.toFixed(1)}
      {suffix}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-on-dark-border/50 bg-white/[0.02] p-5">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl text-cream">{title}</h2>
          {subtitle && <div className="text-xs text-on-dark-muted mt-0.5">{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
