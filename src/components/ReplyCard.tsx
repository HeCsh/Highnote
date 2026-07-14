import { useState } from "react";
import { StarRow } from "./ui";
import type { ReviewCard, VoiceKey } from "../lib/types";
import { generateReply } from "../lib/ai";

/** One "review awaiting a response" card with AI draft generation. */
export default function ReplyCardView({ review, voice }: { review: ReviewCard; voice: VoiceKey }) {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setCopied(false);
    try {
      const reply = await generateReply(review, voice);
      setDraft(reply);
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  const initial = review.author_name.charAt(0);

  return (
    <div className="rounded-xl border border-border bg-cream p-4 transition-shadow duration-300 hover:shadow-lg animate-fade-up">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-sage/30 text-ink flex items-center justify-center font-display text-sm shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-ink text-sm">{review.author_name}</span>
            <StarRow rating={review.rating} size={13} />
            <span className="text-xs text-muted-foreground">
              {review.source} · {review.ago}
            </span>
          </div>
          <p className="text-sm text-ink/80 mt-1.5 leading-relaxed">{review.text}</p>

          {!draft && !loading && (
            <button
              onClick={generate}
              className="btn-smooth mt-3 text-sm font-medium text-ink border border-ink/20 rounded-lg px-3 py-2 hover:bg-ink hover:text-cream hover:border-ink transition-colors"
            >
              ✦ Generate reply with AI
            </button>
          )}

          {loading && (
            <div className="mt-3 space-y-2" aria-live="polite" aria-label="Generating reply">
              <div className="ai-shimmer h-3 w-full" />
              <div className="ai-shimmer h-3 w-11/12" />
              <div className="ai-shimmer h-3 w-2/3" />
            </div>
          )}

          {draft && !loading && (
            <div className="mt-3 animate-fade-up">
              <label className="sr-only" htmlFor={`draft-${review.id}`}>
                Draft reply for {review.author_name}
              </label>
              <textarea
                id={`draft-${review.id}`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-border bg-muted-cream/50 text-ink text-sm p-3 resize-y focus:outline-none focus:ring-2 focus:ring-gold/60"
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={copy}
                  className="text-xs font-medium bg-ink text-cream rounded-md px-3 py-1.5 hover:bg-ink/90 transition"
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
                <button
                  onClick={generate}
                  className="text-xs font-medium border border-ink/20 text-ink rounded-md px-3 py-1.5 hover:bg-ink/5 transition"
                >
                  Regenerate
                </button>
                <span className="text-[11px] text-muted-foreground ml-auto">
                  Draft only — you always review before posting.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
