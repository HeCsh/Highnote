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
3. On the phone: **tap 4 stars + "Food"**, optionally a comment, then **Post your review on Google**.
4. **Watch it appear live** in the dashboard's "Live guest feedback" stream (≤ ~2s), tagged `live`.
   The **rating distribution ticks up**, "captured live" increments, and the current-week bar grows.
   *(Cross-device needs Supabase; same-browser works out of the box — open the phone view in another
   tab/window of the same browser.)*
5. **Generate a reply** — on a review card, click **✦ Generate reply with AI**. Edit it inline.
6. **Switch Voice of the House** (warm → professional → playful) and **Regenerate** — distinctly
   different drafts. Note "Draft only — you always review before posting." Nothing auto-posts.
7. **Refresh insights** — tap **✦ Refresh insights** on AI Radar to regenerate 3 cards from the
   current corpus.
8. **Show onboarding** — `/onboarding`: connect Google Business Profile, add Yelp/DoorDash monitoring.
9. **Download QR PDF** — step 3 renders a print-styled sheet of per-table QR codes (tables 1–12,
   HighNote-branded); "Download / Print PDF" opens the browser print dialog.

### Language toggle
The guest page has an EN / ES / 中文 switch (top-right). All guest-facing copy translates; the choice
persists in `localStorage`.

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
