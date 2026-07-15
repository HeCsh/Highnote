# HighNote ★

A reputation engine for independent restaurants. HighNote captures guest feedback at the table —
then invites **every diner** to share it on Google. Owner-only insights, in your restaurant's voice.

> **Compliance-first.** Every guest sees the *same* "Post your review on Google" button regardless
> of their rating. No review gating, no rewards for reviews (FTC Consumer Review Rule). This is the
> practice HighNote is built to replace.

This app merges two prototypes: the **visual identity** of the design reference (`DESIGN_TOKENS.md`)
on top of the **working data architecture** of the functional reference (`ARCHITECTURE_NOTES.md`).

---

## Quickstart (zero config)

```bash
npm install
npm run dev
```

Open http://localhost:5173. **No env vars required** — the app runs in local demo mode:

- Feedback persists to `localStorage` and streams across tabs/windows via `BroadcastChannel`.
- AI Radar and reply drafts use coherent, hand-authored seeded output (labeled "demo data").
- The dashboard is pre-seeded with ~25 realistic reviews, so **no widget ever shows zero**.

Routes: `/` (landing) · `/r/:slug?t=TABLE` (guest) · `/dashboard` · `/onboarding`.

The browser console prints the active modes on load (feedback + AI).

---

## Env upgrade path

Copy `.env.example` to `.env` and fill in what you have. Each variable upgrades one capability;
the app degrades gracefully when any are absent.

| Variable | Effect |
|---|---|
| `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | Submissions persist to Postgres and stream to the dashboard via **Supabase Realtime** — a phone on cellular updates the projector across devices. |
| `VITE_ANTHROPIC_API_KEY` | "Refresh insights" and "Generate reply" call **`claude-haiku-4-5`** live. |
| `VITE_PUBLIC_URL` | Origin encoded into the table QR codes (defaults to `window.location.origin`). |

### Active-mode matrix

| Env present | Feedback mode | AI mode |
|---|---|---|
| none | `BroadcastChannel` + `localStorage` (same browser) | seeded demo output |
| Supabase only | Supabase Realtime (cross-device) | seeded demo output |
| Anthropic only | local | direct browser call (`anthropic-dangerous-direct-browser-access` header) |
| Supabase + Anthropic | Supabase Realtime | **Edge Function proxy** (key stays server-side) |

**AI key tradeoff.** With Supabase configured, AI runs through Supabase Edge Functions
(`supabase/functions/*`) so the Anthropic key never reaches the client. With only an Anthropic key
(no Supabase), the browser calls the API directly using the CORS-enabling header — convenient for a
local demo, but the key is exposed to the page, so use a throwaway key and never ship that mode to
production.

### Enabling Supabase

```bash
supabase db push                                    # applies supabase/migrations/0001_init.sql
supabase functions deploy generate-insights
supabase functions deploy generate-reply
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...   # for the Edge Function AI proxy
```

The migration creates the `feedback` table (`id, restaurant_slug, table_number, rating, tags,
comment, created_at`), adds it to the `supabase_realtime` publication, and sets RLS allowing
anonymous insert + read for the demo restaurant `fog-and-fern`.

---

## Demo script (for the judging panel)

1. **Open the dashboard on the projector** — `/dashboard`. Every widget is populated: Google rating,
   reviews this week, rating distribution, 6-week chart, AI Radar, live feed, reviews awaiting reply.
2. **Judge scans a table QR** (from `/onboarding` step 3, or open `/r/fog-and-fern?t=12` on a phone).
3. On the phone: **tap 4 stars + "Food"**, then **Continue**. On the optional interlude, **pick a few
   dishes** ("What did you have tonight?") and **answer one comparison** ("Which stood out more?") —
   or Skip. Then **Post your review on Google** (identical button for every rating).

> **QR codes & phone scanning:** each table's QR encodes `<origin>/r/fog-and-fern?t=N`,
> where `<origin>` is whatever URL you're viewing HighNote from (`window.location.origin`, or
> `VITE_PUBLIC_URL` if set). If you open the app at `localhost`, the codes point to `localhost`
> and **a phone can't reach them** — the onboarding QR page shows a warning in that case. To make
> them scannable, open HighNote from the **Network** URL that `npm run dev` prints (e.g.
> `http://192.168.x.x:5173`) or set `VITE_PUBLIC_URL` to your deployed URL; the codes regenerate
> automatically. Routing is per-table correct in all cases (verified by decoding every code).

4. **Watch it appear live** in the dashboard's "Live guest feedback" stream (≤ ~2s), tagged `live`.
   The **rating distribution ticks up**, "captured live" increments, and the current-week bar grows.
   In Supabase mode the **Menu Elo panel recomputes** from the new comparison too.
   *(Cross-device needs Supabase; same-browser works out of the box — open the phone view in another
   tab/window of the same browser.)*
5. **Scroll to Menu Elo — "what guests choose, head to head."** Point out **Pan-Seared Halibut's
   decline** (▼ badge + sparkline + the biggest-mover callout "worth a look"), Mushroom Toast at #1,
   and **Fog Cutter** sitting in the collapsed *"Not enough data yet"* group — the honesty UI never
   shows a bare score without confidence. Filter by section (Mains / Desserts…).
6. **Generate a reply** — on a review card, click **✦ Generate reply with AI**. Edit it inline.
7. **Switch Voice of the House** (warm → professional → playful) and **Regenerate** — distinctly
   different drafts. Note "Draft only — you always review before posting." Nothing auto-posts.
8. **Refresh insights** — tap **✦ Refresh insights** on AI Radar. One card is tagged **"from Menu
   Elo"** — the halibut decline surfaced straight from the head-to-head data.
9. **Show onboarding** — `/onboarding`: connect Google Business Profile, add Yelp/DoorDash monitoring.
10. **Download QR PDF** — step 3 renders a print-styled sheet of per-table QR codes (tables 1–12,
    HighNote-branded); "Download / Print PDF" opens the browser print dialog.
11. **Export research data** — dashboard footer → **Export data (CSV)** downloads anonymized
    `feedback.csv` + `comparisons.csv` (see *Research mode* below).

### Language toggle
The guest page has an EN / ES / 中文 switch (top-right). All guest-facing copy translates; the choice
persists in `localStorage`.

---

## Menu Elo (the measurement instrument)

Star ratings compress: almost everything lands at 4.x, so stars can't separate a great dish from a
good one. **Relative judgments don't compress.** After the star step, guests optionally tap the
dishes they had and answer one or two "Which stood out more?" comparisons. We fit those pairwise
outcomes with the **Bradley-Terry model** — `P(i beats j) = pᵢ / (pᵢ + pⱼ)` — via the standard MM
(minorization-maximization) iteration, the same statistical approach behind
[LMSYS Chatbot Arena's](https://lmarena.ai) LLM leaderboard, where anonymous human "which answer is
better?" votes are turned into a ranked scoreboard. Here the "models" are menu items and the "voters"
are diners.

Implementation lives in [`src/lib/bradleyTerry.ts`](src/lib/bradleyTerry.ts) (~dependency-free,
unit-tested): ties count as half a win; a pseudo-count prior against a dummy average opponent keeps
sparse items finite and pins the scale; strengths map to an Elo-like display score
(`1000 + 400·log10(pᵢ/p_median)`); a seeded **bootstrap** (200 resamples) gives each item a 90%
confidence interval; items with `< 5` comparisons render **provisional**; and a 3-week delta is only
shown when both endpoints rest on a solid sample (no cold-start false precision). `selectPair`
([`src/lib/selectPair.ts`](src/lib/selectPair.ts)) does adaptive sampling — it asks the pair that's
least-compared, then most-uncertain, to maximize information per tap.

## Research mode

The dashboard footer's **Export data (CSV)** downloads two anonymized files (no names, no comment
text — only a `has_comment` flag) for the team's study comparing **star-rating discrimination vs
pairwise discrimination**:

`feedback.csv`
| column | meaning |
|---|---|
| `timestamp` | ISO submission time |
| `table` | table number |
| `rating` | 1–5 star rating |
| `tags` | `|`-separated tags (food, service, ambiance, speed, value) |
| `has_comment` | `true`/`false` — whether a comment was left (text itself never exported) |

`comparisons.csv`
| column | meaning |
|---|---|
| `timestamp` | ISO comparison time |
| `item_a` / `item_b` | the two menu-item ids compared |
| `winner_or_tie` | the winning item id, or `tie` |

---

## Stack

Vite · React · TypeScript · Tailwind CSS · Recharts · Supabase (optional) · `qrcode`.
Design tokens (palette, Fraunces/Archivo/Courier Prime, receipt motifs) are extracted verbatim from
the design reference — see `DESIGN_TOKENS.md`. Backend data-flow patterns are documented in
`ARCHITECTURE_NOTES.md`.

## Scripts
- `npm run dev` — dev server
- `npm run build` — typecheck + production build
- `npm run preview` — serve the production build
- `npm run typecheck` — types only
- `npm run test:e2e` — Playwright walk-through of the demo (start `npm run dev` first)

### End-to-end coverage
`tests/demo-flow.mjs` drives a real headless Chromium through the whole demo in one shared browser
context (so the same-browser `BroadcastChannel` fallback is exercised): it opens the dashboard,
submits a 4★ "Food" review with a comment from a phone-sized page, and asserts the submission
**appears live** in the stream; that the Google button is **byte-identical at 1★ and 5★**; that reply
drafts are signed with no incentive language and **differ across voices**; that Refresh insights
yields exactly 3 cards; that the guest page renders in 中文 and ES; and that onboarding produces 12
real QR PNGs. Install the browser once with `npx playwright install chromium`.
