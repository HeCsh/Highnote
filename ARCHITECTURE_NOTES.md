# ARCHITECTURE_NOTES.md — extracted from Prototype B

Source: `https://highnote-project.lovable.app/` (guest = homepage) and `/dashboard`.
Mined from JS bundles: `index-Ch7oQs63.js` (549 KB, vendor + supabase client),
`dashboard-DXzIrQiY.js` (374 KB, dashboard route logic).
**We do NOT reuse B's credentials — we stand up our own backend.** These notes record the
*working patterns* to replicate.

## Backend: Supabase (JS v2 client)

B initializes `createClient` and uses `supabase.auth.*`, PostgREST query builder
(`.from().select().order().eq().insert()`), and Realtime channels. This is the data spine.

### Tables (column lists lifted verbatim from `.select(...)` calls)

**`feedback`** — guest submissions (the live loop):
```
id, rating, note, table_number, created_at, tags
```
Query: `.from('feedback').select('id, rating, note, table_number, created_at, tags').order('created_at',{ascending:false}).limit(200)`
> B stores the guest comment in a column named **`note`** and stores tags as an array.
> B's demo is single-restaurant so it has no `restaurant_slug`. **Our build adds
> `restaurant_slug` + `table_number`** per the HighNote spec so multiple restaurants/tables scale.

**`reviews`** — Google-style reviews awaiting a reply (dashboard "awaiting response"):
```
id, author_name, rating, text, ai_reply, reply_status, created_at
```

**`insights`** — cached AI Radar cards:
```
id, type, title, detail, created_at
```

### Realtime (the ≤2s demo moment)
```js
supabase.channel('feedback-live')
  .on('postgres_changes', { event:'INSERT', schema:'public', table:'feedback' }, cb)
  .subscribe()
```
Dashboard subscribes to INSERTs on `feedback`; each new row is prepended to the live feed and
the aggregates (submissions counter, rating distribution, current-week bar) recompute. This is
the pattern our dashboard replicates.

### Data flow proven by B
1. **Persist** — guest submit → `supabase.from('feedback').insert(row)`.
2. **Aggregate live** — dashboard selects last 200, computes: Submissions count, Average rating,
   Rating distribution (5★→1★ counts), Reviews-per-week (buckets by `created_at`, uses `getDay`).
3. **Analyze on demand** — nothing is precomputed; the AI runs only when the owner taps a button.

## AI: Supabase Edge Functions (key stays server-side)

B does **not** call Anthropic/OpenAI from the browser. It proxies through edge functions:
```js
supabase.functions.invoke('generate-insights', { body:{ restaurantName } })   // → AI Radar cards
supabase.functions.invoke('generate-reply',    { body:{ reviewId, restaurantName } }) // → drafted reply
```
- `generate-insights` returns insight cards from the current corpus (on-demand "Analyze feedback").
- `generate-reply` returns a drafted reply for one review.
- Errors are surfaced (`if(error) throw`), replies read back as `{ reply }`, insights as an array.

**Takeaway for our build:** when Supabase is configured, proxy Anthropic through an Edge Function
so `VITE_ANTHROPIC_API_KEY` never ships to the client. When only a client key is present (no
Supabase), fall back to a direct browser call with `anthropic-dangerous-direct-browser-access: true`.
When no key at all, use deterministic seeded output. (Tradeoff documented in README.)

## Dashboard states observed (the anti-pattern we fix)
B's dashboard cold-opens on **"Submissions 0 / Average — / distribution all 0 / No insights yet /
Recent: Loading… / Google Reviews: Loading…"**. Great data flow, but empty on first paint — a bad
look for a live demo. **Our build seeds a realistic corpus so no widget ever shows zero (Task 6).**

## What we adopt vs. change
| Aspect | B does | We do |
|---|---|---|
| Persistence | Supabase `feedback` insert | same, + `restaurant_slug`, comment column named `comment` (spec) |
| Realtime | `channel('feedback-live')` postgres_changes INSERT | same |
| Aggregates | client-side from last N rows | same, merged with seed corpus |
| AI | edge functions `generate-insights` / `generate-reply` | edge function when Supabase set; direct browser call w/ CORS header otherwise; seeded fallback |
| Cold start | empty (zeros) | seeded, never zero |
| No-env behavior | requires Supabase | graceful `BroadcastChannel`+`localStorage` fallback |
