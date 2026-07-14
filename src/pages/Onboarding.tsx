import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Logo } from "../components/ui";
import { DEMO_NAME, DEMO_TABLES, publicOrigin } from "../lib/config";
import { tableQrDataUrl, tableUrl } from "../lib/qr";

const STEPS = [
  { n: 1, title: "Connect Google Business Profile" },
  { n: 2, title: "Add review platforms" },
  { n: 3, title: "Print table QR codes" },
];

export default function Onboarding() {
  const [params, setParams] = useSearchParams();
  const initial = Math.min(3, Math.max(1, Number(params.get("step")) || 1));
  const [step, setStep] = useState(initial);

  const go = (n: number) => {
    setStep(n);
    setParams({ step: String(n) }, { replace: true });
  };

  return (
    <div className="min-h-screen bg-page text-cream">
      <header className="border-b border-on-dark-border/50 no-print">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/">
            <Logo className="text-lg" />
          </Link>
          <Link to="/dashboard" className="text-xs text-on-dark hover:text-cream">
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* stepper */}
        <div className="flex items-center justify-center gap-2 mb-10 no-print">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center">
              <button
                onClick={() => go(s.n)}
                className="flex items-center gap-2 group"
                aria-current={step === s.n}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition ${
                    step === s.n
                      ? "bg-gold text-ink"
                      : step > s.n
                        ? "bg-sage text-ink"
                        : "border border-on-dark-border text-on-dark-muted"
                  }`}
                >
                  {step > s.n ? "✓" : s.n}
                </span>
                <span
                  className={`text-sm hidden sm:block ${
                    step === s.n ? "text-cream" : "text-on-dark-muted"
                  }`}
                >
                  {s.title}
                </span>
              </button>
              {i < STEPS.length - 1 && <div className="w-8 sm:w-12 h-px bg-on-dark-border mx-2" />}
            </div>
          ))}
        </div>

        {step === 1 && <StepConnect onNext={() => go(2)} />}
        {step === 2 && <StepPlatforms onBack={() => go(1)} onNext={() => go(3)} />}
        {step === 3 && <StepQr onBack={() => go(2)} />}
      </main>
    </div>
  );
}

/* ---------- Step 1: mock Google OAuth ---------- */
function StepConnect({ onNext }: { onNext: () => void }) {
  const [connected, setConnected] = useState(false);
  return (
    <Card>
      <h1 className="font-display text-2xl text-ink mb-1">Connect Google Business Profile</h1>
      <p className="text-sm text-muted-foreground mb-6">
        HighNote reads your public reviews and drafts replies. We never post without your review.
      </p>

      {!connected ? (
        <button
          onClick={() => setConnected(true)}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-border bg-white py-3 text-ink font-medium hover:bg-muted-cream/40 transition"
        >
          <GoogleG />
          Continue with Google
        </button>
      ) : (
        <div className="rounded-xl border border-sage bg-sage/10 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-ink text-gold flex items-center justify-center font-display">
            ★
          </div>
          <div className="flex-1">
            <div className="font-medium text-ink">{DEMO_NAME} — Hayes Valley</div>
            <div className="text-xs text-muted-foreground">Matched listing · 1,204 Google reviews</div>
          </div>
          <span className="text-sage font-semibold text-sm">Connected ✓</span>
        </div>
      )}

      <div className="flex justify-end mt-6">
        <button
          onClick={onNext}
          disabled={!connected}
          className="btn-smooth rounded-lg bg-ink text-cream px-5 py-2.5 text-sm font-semibold disabled:opacity-40 hover:bg-ink/90"
        >
          Continue →
        </button>
      </div>
    </Card>
  );
}

/* ---------- Step 2: review platforms ---------- */
function StepPlatforms({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <Card>
      <h1 className="font-display text-2xl text-ink mb-1">Add review platforms</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Monitor mentions across platforms. Replies are drafted in HighNote and posted where each
        platform allows.
      </p>

      <div className="space-y-3">
        <PlatformRow
          name="Yelp"
          color="#d32323"
          note="Monitoring via import"
          tooltip="Yelp does not offer a public reply API; replies are drafted here and posted manually."
        />
        <PlatformRow
          name="DoorDash"
          color="#ff3008"
          note="Monitoring via import"
          tooltip="Ratings imported for trend analysis; DoorDash does not expose a public reply API."
        />
      </div>

      <div className="flex justify-between mt-6">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-ink">
          ← Back
        </button>
        <button
          onClick={onNext}
          className="btn-smooth rounded-lg bg-ink text-cream px-5 py-2.5 text-sm font-semibold hover:bg-ink/90"
        >
          Continue →
        </button>
      </div>
    </Card>
  );
}

function PlatformRow({
  name,
  color,
  note,
  tooltip,
}: {
  name: string;
  color: string;
  note: string;
  tooltip: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 flex items-center gap-3 transition-shadow duration-300 hover:shadow-md">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-display text-lg"
        style={{ background: color }}
      >
        {name.charAt(0)}
      </div>
      <div className="flex-1">
        <div className="font-medium text-ink">{name}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          {note}
          <span className="group relative cursor-help" tabIndex={0} aria-label={tooltip}>
            <span className="inline-flex w-4 h-4 rounded-full border border-muted-foreground/50 text-[10px] items-center justify-center text-muted-foreground">
              ?
            </span>
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-6 w-56 rounded-lg bg-ink text-cream text-[11px] p-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition z-10 leading-snug">
              {tooltip}
            </span>
          </span>
        </div>
      </div>
      <span className="text-xs text-sage font-medium">Import on ✓</span>
    </div>
  );
}

/* ---------- Step 3: printable QR sheet ---------- */
function StepQr({ onBack }: { onBack: () => void }) {
  const [codes, setCodes] = useState<{ table: number; url: string; data: string }[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all(
      Array.from({ length: DEMO_TABLES }, (_, i) => i + 1).map(async (table) => ({
        table,
        url: tableUrl(table),
        data: await tableQrDataUrl(table),
      })),
    ).then((c) => active && setCodes(c));
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <div className="flex items-center justify-between mb-4 no-print">
        <div>
          <h1 className="font-display text-2xl text-cream">Print table QR codes</h1>
          <p className="text-sm text-on-dark-muted">
            Tables 1–{DEMO_TABLES}, encoding{" "}
            <code className="text-gold">{publicOrigin()}/r/fog-and-fern</code>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onBack} className="text-sm text-on-dark-muted hover:text-cream px-3 py-2">
            ← Back
          </button>
          <button
            onClick={() => window.print()}
            className="btn-smooth btn-sheen rounded-lg bg-gold text-ink px-4 py-2.5 text-sm font-semibold hover:brightness-105"
          >
            Download / Print PDF
          </button>
        </div>
      </div>

      <div className="print-sheet bg-cream rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 animate-fade-up stagger">
        {codes.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-10 animate-fade-in">
            Generating QR codes…
          </div>
        )}
        {codes.map((c) => (
          <div
            key={c.table}
            className="rounded-xl border border-border bg-white p-4 flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-gold/40"
          >
            <div className="font-display text-ink text-lg">
              HighNote <span className="text-gold">★</span>
            </div>
            <div className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase mt-0.5">
              {DEMO_NAME}
            </div>
            <img src={c.data} alt={`QR code for table ${c.table}`} className="w-32 h-32 my-2" />
            <div className="font-mono text-sm text-ink font-bold">TABLE {c.table}</div>
            <div className="text-[9px] text-muted-foreground mt-1">Scan to leave a review · 30s</div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- shared ---------- */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-cream rounded-2xl p-7 shadow-big max-w-lg mx-auto animate-fade-up">{children}</div>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.8 6.1C12.2 13.7 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5c4.2-3.9 6.6-9.6 6.6-16z" />
      <path fill="#FBBC05" d="M10.3 28.4c-.5-1.4-.8-2.9-.8-4.4s.3-3 .8-4.4l-7.8-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.5l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.1-5.5c-2 1.4-4.6 2.2-8.2 2.2-6.4 0-11.8-4.2-13.7-9.9l-7.8 6.1C6.4 42.6 14.6 48 24 48z" />
    </svg>
  );
}
