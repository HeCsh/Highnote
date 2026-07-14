import { useMemo, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Logo, Ticket, DashedRule, Star } from "../components/ui";
import { LANGS, useLang, type Lang } from "../lib/i18n";
import type { TagKey } from "../lib/types";
import { submitFeedback } from "../lib/store";
import { DEMO_NAME, DEMO_SLUG } from "../lib/config";

const TAGS: { key: TagKey; emoji: string }[] = [
  { key: "food", emoji: "🍽️" },
  { key: "service", emoji: "🤝" },
  { key: "ambiance", emoji: "🕯️" },
  { key: "speed", emoji: "⏱️" },
  { key: "value", emoji: "💰" },
];

// Mock but stable Google "write a review" destination — identical for every rating.
const GOOGLE_REVIEW_URL =
  "https://search.google.com/local/writereview?placeid=ChIJ-fog-and-fern-demo";

function slugToName(slug?: string): string {
  if (!slug || slug === DEMO_SLUG) return DEMO_NAME;
  return slug
    .split("-")
    .map((w) => (w === "and" ? "&" : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

export default function Guest() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const [lang, setLang, t] = useLang();

  const table = useMemo(() => (params.get("t") || "").replace(/["']/g, "").trim(), [params]);
  const restaurant = slugToName(slug);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [tags, setTags] = useState<TagKey[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const tagLabel = (k: TagKey) => t[`tag_${k}` as const];
  const toggleTag = (k: TagKey) =>
    setTags((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  async function handleSubmit() {
    if (rating < 1 || submitting) return;
    setSubmitting(true);
    try {
      await submitFeedback({
        restaurant_slug: slug || DEMO_SLUG,
        table_number: table || "—",
        rating,
        tags,
        comment: comment.trim(),
      });
    } catch (e) {
      console.error("[HighNote] submit failed", e);
    } finally {
      setSubmitting(false);
      setDone(true);
      // Same destination for every rating — compliance-critical.
      window.open(GOOGLE_REVIEW_URL, "_blank", "noopener");
    }
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
            {/* ticket header */}
            <div className="rounded-sm overflow-hidden shadow-big mb-6 animate-fade-up">
              <Ticket>
                <div className="font-display text-2xl">{restaurant}</div>
                <div className="text-[10px] tracking-[0.22em] mt-2">
                  {t.thanks}
                  {table ? ` · ${t.table} ${table}` : ""}
                </div>
              </Ticket>
            </div>

            <div className="bg-cream rounded-3xl p-7 shadow-2xl animate-fade-up [animation-delay:0.1s]">
              <h1 className="font-display text-2xl text-ink text-center mb-6 leading-snug">
                {t.question}
              </h1>

              {/* stars — labeled, keyboard operable */}
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

              {/* eyebrow */}
              <div className="text-center text-xs tracking-[0.22em] text-muted-foreground uppercase mb-3">
                {t.stoodOut}
              </div>

              {/* tag chips — multi-select */}
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

              {/* comment */}
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

              {/* Google button — IDENTICAL for every rating (compliance). */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={rating < 1 || submitting}
                className="btn-smooth btn-sheen mt-4 w-full rounded-xl bg-ink text-cream font-medium py-4 min-h-[44px] text-base hover:bg-ink/95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none"
              >
                {submitting ? "…" : `${t.google} →`}
              </button>
            </div>

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
