import { Link } from "react-router-dom";
import { Logo, Ticket, DashedRule, Star, Eyebrow } from "../components/ui";
import { DEMO_SLUG } from "../lib/config";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-page text-cream">
      <header className="max-w-6xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <Logo className="text-xl" />
        <Link to="/dashboard" className="text-sm text-on-dark underline-offset-4 hover:underline">
          Owner dashboard →
        </Link>
      </header>

      <main className="flex-1 grid md:grid-cols-2 gap-10 max-w-6xl w-full mx-auto px-6 py-16 items-center">
        <div>
          <Eyebrow className="mb-4 tracking-[0.3em]">REPUTATION ENGINE</Eyebrow>
          <h1 className="font-display text-6xl md:text-7xl leading-[0.95]">
            end every meal on a <span className="text-gold">high note.</span>
          </h1>
          {/* Corrected, compliance-safe hero copy (no review-gating language). */}
          <p className="mt-6 text-base max-w-md text-on-dark">
            HighNote captures guest feedback at the table — then invites{" "}
            <span className="text-cream font-medium">every diner</span> to share it on Google.
            Owner-only insights, in your restaurant's voice.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={`/r/${DEMO_SLUG}?t=12`}
              className="px-5 py-3 rounded-md text-sm font-semibold bg-gold text-ink hover:brightness-105 transition"
            >
              Try the guest page →
            </Link>
            <Link
              to="/dashboard"
              className="px-5 py-3 rounded-md text-sm font-semibold border border-on-dark-border text-cream hover:bg-white/5 transition"
            >
              See owner dashboard
            </Link>
          </div>
        </div>

        <div className="justify-self-center">
          <div className="w-[320px] shadow-big rounded-sm overflow-hidden">
            <Ticket>
              <div className="font-display text-2xl">Fog &amp; Fern</div>
              <div className="text-[10px] tracking-[0.22em] mt-2">THANKS FOR DINING · TABLE 12</div>
              <DashedRule className="my-5" />
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={28} />
                ))}
              </div>
              <DashedRule className="my-5" />
              <div className="text-xs">a review in under 30 seconds</div>
            </Ticket>
          </div>
        </div>
      </main>

      <footer className="max-w-6xl w-full mx-auto px-6 py-6 text-xs text-on-dark-muted">
        Compliance-first: every rating sees the same Google button. No rewards for reviews.
      </footer>
    </div>
  );
}
