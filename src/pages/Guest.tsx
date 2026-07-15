import { useMemo, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Logo, Ticket, DashedRule, Star } from "../components/ui";
import { LANGS, useLang, type Lang } from "../lib/i18n";
import type { MenuItem, MenuSection, TagKey } from "../lib/types";
import { submitFeedback } from "../lib/store";
import { getMenuItems, submitComparison } from "../lib/menuStore";
import { buildSeedComparisons } from "../lib/demoSeed";
import { quickScores } from "../lib/bradleyTerry";
import { selectPair } from "../lib/selectPair";
import { DEMO_NAME, DEMO_SLUG, GOOGLE_REVIEW_URL } from "../lib/config";

const TAGS: { key: TagKey; emoji: string }[] = [
  { key: "food", emoji: "🍽️" },
  { key: "service", emoji: "🤝" },
  { key: "ambiance", emoji: "🕯️" },
  { key: "speed", emoji: "⏱️" },
  { key: "value", emoji: "💰" },
];

const SECTIONS: MenuSection[] = ["Starters", "Mains", "Desserts", "Drinks"];

function slugToName(slug?: string): string {
  if (!slug || slug === DEMO_SLUG) return DEMO_NAME;
  return slug
    .split("-")
    .map((w) => (w === "and" ? "&" : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

type Step = "rate" | "dishes" | "compare" | "review";
interface PendingComparison {
  item_a: string;
  item_b: string;
  winner: string | null;
}

export default function Guest() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const [lang, setLang, t] = useLang();

  const table = useMemo(() => (params.get("t") || "").replace(/["']/g, "").trim(), [params]);
  const restaurant = slugToName(slug);
  const restaurantSlug = slug || DEMO_SLUG;

  // menu + prior comparison corpus (for adaptive pair selection)
  const menu = useMemo(() => getMenuItems(restaurantSlug), [restaurantSlug]);
  const history = useMemo(() => buildSeedComparisons(), []);
  const scoreMap = useMemo(() => quickScores(menu.map((m) => m.id), history), [menu, history]);
  const score = (id: string) => scoreMap.get(id) ?? 1000;
  const itemById = useMemo(() => Object.fromEntries(menu.map((m) => [m.id, m])), [menu]);

  const [step, setStep] = useState<Step>("rate");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [tags, setTags] = useState<TagKey[]>([]);
  const [comment, setComment] = useState("");

  const [dishes, setDishes] = useState<string[]>([]);
  const [pair, setPair] = useState<[string, string] | null>(null);
  const [asked, setAsked] = useState<Array<[string, string]>>([]);
  const [pending, setPending] = useState<PendingComparison[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const tagLabel = (k: TagKey) => t[`tag_${k}` as const];
  const toggleTag = (k: TagKey) =>
    setTags((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  const toggleDish = (id: string) =>
    setDishes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // ---- flow transitions ----
  function startComparisons() {
    if (dishes.length >= 2) {
      const first = selectPair(dishes, history, { score });
      if (first) {
        setPair(first);
        setStep("compare");
        return;
      }
    }
    setStep("review");
  }

  function answerComparison(winner: string | null) {
    if (!pair) return;
    const [a, b] = pair;
    const nextPending = [...pending, { item_a: a, item_b: b, winner }];
    const nextAsked = [...asked, [a, b] as [string, string]];
    setPending(nextPending);
    setAsked(nextAsked);
    // At most 2 comparison questions per session, ever; only continue if 3+ dishes.
    if (dishes.length >= 3 && nextPending.length < 2) {
      const next = selectPair(dishes, history, { score, asked: nextAsked });
      if (next) {
        setPair(next);
        return;
      }
    }
    setStep("review");
  }

  async function finish() {
    if (rating < 1 || submitting) return;
    setSubmitting(true);
    let feedbackId: string | null = null;
    try {
      const fb = await submitFeedback({
        restaurant_slug: restaurantSlug,
        table_number: table || "—",
        rating,
        tags,
        comment: comment.trim(),
      });
      feedbackId = fb.id;
    } catch (e) {
      console.error("[HighNote] feedback submit failed", e);
    }
    // Persist any comparisons the guest made, linked to their feedback row.
    for (const c of pending) {
      try {
        await submitComparison({
          restaurant_slug: restaurantSlug,
          item_a: c.item_a,
          item_b: c.item_b,
          winner: c.winner,
          feedback_id: feedbackId,
          table_number: table || "—",
        });
      } catch (e) {
        console.error("[HighNote] comparison submit failed", e);
      }
    }
    setSubmitting(false);
    setDone(true);
    // Same destination for every rating — compliance-critical. Never conditioned on comparisons.
    window.open(GOOGLE_REVIEW_URL, "_blank", "noopener");
  }

  return (
    <div className="min-h-screen px-5 py-8 flex items-start justify-center text-ink">
      <div className="w-full max-w-md">
        {/* header: logo + language toggle */}
        <div className="flex items-center justify-between mb-5">
          <Link to="/" aria-label="HighNote home">
            <Logo className="text-sm text-ink" />
          </Link>
          <div
            className="flex items-center gap-1 rounded-full border border-ink/15 bg-cream/60 p-0.5"
            role="group"
            aria-label="Language"
          >
            {LANGS.map((l) => (
              <button
                key={l.key}
                onClick={() => setLang(l.key as Lang)}
                aria-pressed={lang === l.key}
                className={`px-2.5 py-1 text-xs rounded-full transition ${
                  lang === l.key ? "bg-ink text-cream font-semibold" : "text-ink/60 hover:text-ink"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {done ? (
          <ThankYou t={t} />
        ) : (
          <>
            {/* ticket header (persists across steps) */}
            <div className="rounded-sm overflow-hidden shadow-big mb-6 animate-fade-up">
              <Ticket>
                <div className="font-display text-2xl">{restaurant}</div>
                <div className="text-[10px] tracking-[0.22em] mt-2">
                  {t.thanks}
                  {table ? ` · ${t.table} ${table}` : ""}
                </div>
              </Ticket>
            </div>

            {step === "rate" && (
              <RateCard
                t={t}
                rating={rating}
                hover={hover}
                setHover={setHover}
                setRating={setRating}
                tags={tags}
                toggleTag={toggleTag}
                tagLabel={tagLabel}
                comment={comment}
                setComment={setComment}
                onContinue={() => setStep("dishes")}
              />
            )}

            {step === "dishes" && (
              <DishPicker
                t={t}
                menu={menu}
                selected={dishes}
                toggle={toggleDish}
                onSkip={() => setStep("review")}
                onContinue={startComparisons}
              />
            )}

            {step === "compare" && pair && (
              <CompareCard
                t={t}
                a={itemById[pair[0]]}
                b={itemById[pair[1]]}
                index={pending.length}
                onPick={answerComparison}
                onSkip={() => setStep("review")}
              />
            )}

            {step === "review" && (
              <ReviewCard t={t} submitting={submitting} onSubmit={finish} />
            )}

            <p className="text-ink/50 text-xs text-center mt-5">{t.compliance}</p>
            <p className="text-ink/40 text-[10px] text-center mt-3 tracking-wider">
              Powered by HighNote ★
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- Step 1: rating + tags + comment ---------------- */
function RateCard({
  t,
  rating,
  hover,
  setHover,
  setRating,
  tags,
  toggleTag,
  tagLabel,
  comment,
  setComment,
  onContinue,
}: {
  t: ReturnType<typeof useLang>[2];
  rating: number;
  hover: number;
  setHover: (n: number) => void;
  setRating: (n: number) => void;
  tags: TagKey[];
  toggleTag: (k: TagKey) => void;
  tagLabel: (k: TagKey) => string;
  comment: string;
  setComment: (s: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="bg-cream rounded-3xl p-7 shadow-2xl animate-fade-up [animation-delay:0.1s]">
      <h1 className="font-display text-2xl text-ink text-center mb-6 leading-snug">{t.question}</h1>

      {/* stars */}
      <div className="flex justify-between mb-6 px-1" role="radiogroup" aria-label={t.question}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => setRating(n)}
            className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center transition-transform duration-200 ease-spring hover:scale-110 active:scale-95"
          >
            <span
              key={`${n}-${rating === n}`}
              className={rating === n ? "inline-flex animate-star-pop" : "inline-flex"}
            >
              <Star size={44} filled={n <= (hover || rating)} />
            </span>
          </button>
        ))}
      </div>

      <div className="text-center text-xs tracking-[0.22em] text-muted-foreground uppercase mb-3">
        {t.stoodOut}
      </div>

      <div className="flex flex-wrap gap-2 mb-5 justify-center">
        {TAGS.map(({ key, emoji }) => {
          const on = tags.includes(key);
          return (
            <button
              key={key}
              type="button"
              aria-pressed={on}
              onClick={() => toggleTag(key)}
              className={`rounded-full px-3 py-2 min-h-[44px] text-sm font-medium border transition-all duration-200 ease-spring hover:scale-105 active:scale-95 ${
                on
                  ? "bg-ink text-cream border-ink shadow-md scale-105"
                  : "bg-cream text-ink border-ink/20 hover:border-ink/40"
              }`}
            >
              <span className="mr-1">{emoji}</span>
              {tagLabel(key)}
            </button>
          );
        })}
      </div>

      <label htmlFor="comment" className="block text-[10px] tracking-[0.18em] text-muted-foreground uppercase mb-2">
        {t.commentLabel}
      </label>
      <textarea
        id="comment"
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 280))}
        placeholder={t.commentPlaceholder}
        rows={3}
        maxLength={280}
        className="w-full rounded-xl bg-muted-cream/60 border border-muted-cream text-ink placeholder:text-ink/40 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gold/60"
      />
      <div className="text-right text-xs text-ink/40 mt-1">{comment.length}/280</div>

      <button
        type="button"
        onClick={onContinue}
        disabled={rating < 1}
        className="btn-smooth btn-sheen mt-4 w-full rounded-xl bg-ink text-cream font-medium py-4 min-h-[44px] text-base hover:bg-ink/95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none"
      >
        {t.continueLabel} →
      </button>
    </div>
  );
}

/* ---------------- Step 2: dish picker (optional) ---------------- */
function DishPicker({
  t,
  menu,
  selected,
  toggle,
  onSkip,
  onContinue,
}: {
  t: ReturnType<typeof useLang>[2];
  menu: MenuItem[];
  selected: string[];
  toggle: (id: string) => void;
  onSkip: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="bg-cream rounded-3xl p-7 shadow-2xl animate-fade-up">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-2xl text-ink leading-snug">{t.dishesTitle}</h1>
        <span className="text-[10px] tracking-[0.18em] text-muted-foreground">{t.optional}</span>
      </div>
      <p className="text-sm text-muted-foreground mb-5">{t.dishesHint}</p>

      <div className="space-y-4">
        {SECTIONS.map((sec) => {
          const items = menu.filter((m) => m.section === sec);
          if (!items.length) return null;
          return (
            <div key={sec}>
              <div className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase mb-2">
                {t[`sec_${sec}` as const]}
              </div>
              <div className="flex flex-wrap gap-2">
                {items.map((m) => {
                  const on = selected.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(m.id)}
                      className={`rounded-full px-3 py-2 min-h-[44px] text-sm font-medium border transition-all duration-200 ease-spring hover:scale-105 active:scale-95 ${
                        on
                          ? "bg-ink text-cream border-ink shadow-md scale-105"
                          : "bg-cream text-ink border-ink/20 hover:border-ink/40"
                      }`}
                    >
                      <span className="mr-1">{m.emoji}</span>
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mt-6">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-ink underline-offset-4 hover:underline px-2 py-2 min-h-[44px]"
        >
          {t.skip}
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="btn-smooth btn-sheen flex-1 rounded-xl bg-ink text-cream font-medium py-4 min-h-[44px] text-base hover:bg-ink/95"
        >
          {t.continueLabel} →
        </button>
      </div>
    </div>
  );
}

/* ---------------- Step 3: one comparison (optional) ---------------- */
function CompareCard({
  t,
  a,
  b,
  index,
  onPick,
  onSkip,
}: {
  t: ReturnType<typeof useLang>[2];
  a: MenuItem;
  b: MenuItem;
  index: number;
  onPick: (winner: string | null) => void;
  onSkip: () => void;
}) {
  return (
    <div className="bg-cream rounded-3xl p-7 shadow-2xl animate-fade-up" key={`${a.id}-${b.id}`}>
      <h1 className="font-display text-2xl text-ink text-center leading-snug">{t.compareTitle}</h1>
      <p className="text-sm text-muted-foreground text-center mb-6">
        {t.compareHint}
        {index > 0 ? " (2/2)" : ""}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {[a, b].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onPick(item.id)}
            aria-label={item.name}
            className="btn-smooth flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-ink/15 bg-muted-cream/40 px-3 py-8 min-h-[44px] hover:border-gold hover:bg-gold/10 hover:shadow-md"
          >
            <span className="text-4xl" aria-hidden="true">{item.emoji}</span>
            <span className="font-display text-lg text-ink text-center leading-tight">{item.name}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onPick(null)}
        className="btn-smooth mt-3 w-full rounded-xl border border-ink/15 text-ink/70 text-sm py-3 min-h-[44px] hover:bg-ink/5"
      >
        {t.compareTie}
      </button>

      <div className="text-center mt-4">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-ink underline-offset-4 hover:underline px-2 py-2 min-h-[44px]"
        >
          {t.skip}
        </button>
      </div>
    </div>
  );
}

/* ---------------- Step 4: the unchanged Google review step ---------------- */
function ReviewCard({
  t,
  submitting,
  onSubmit,
}: {
  t: ReturnType<typeof useLang>[2];
  submitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="bg-cream rounded-3xl p-7 shadow-2xl text-center animate-fade-up">
      <div className="flex justify-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} size={22} />
        ))}
      </div>
      <h1 className="font-display text-2xl text-ink mb-2 leading-snug">{t.question}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t.reviewIn}</p>

      {/* Google button — IDENTICAL for every rating (compliance). */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="btn-smooth btn-sheen w-full rounded-xl bg-ink text-cream font-medium py-4 min-h-[44px] text-base hover:bg-ink/95 disabled:opacity-60"
      >
        {submitting ? "…" : `${t.google} →`}
      </button>
    </div>
  );
}

function ThankYou({ t }: { t: ReturnType<typeof useLang>[2] }) {
  return (
    <div className="bg-cream rounded-3xl p-8 shadow-2xl text-center animate-fade-up">
      <div className="flex justify-center gap-1 mb-4 stagger">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className="inline-flex animate-star-pop" style={{ animationDelay: `${n * 0.07}s` }}>
            <Star size={22} />
          </span>
        ))}
      </div>
      <h1 className="font-display text-2xl text-ink mb-3">{t.posted}</h1>
      <p className="text-sm text-muted-foreground">{t.postedSub}</p>
      <DashedRule className="my-6" />
      <p className="text-xs text-ink/40">Powered by HighNote ★</p>
    </div>
  );
}
