/**
 * Runtime capability detection. Each env var overrides a built-in default.
 *
 * The Supabase URL + anon key are baked in so cross-device realtime works on every
 * deploy with no dashboard configuration. The anon key is meant to be public (it's a
 * client key); the database's Row Level Security limits it to insert/read of the demo
 * restaurant's feedback + comparisons only. Set VITE_SUPABASE_* to point at your own
 * project instead.
 */
const env = import.meta.env;

const DEFAULT_SUPABASE_URL = "https://quuhybrzcrafgqxgkbrg.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dWh5YnJ6Y3JhZmdxeGdrYnJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNjIwOTYsImV4cCI6MjA5OTYzODA5Nn0.YIDueKoZ-wh4Oy3o4lmj_u_PKS6lHG14q194LY_tZYE";

export const SUPABASE_URL = env.VITE_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY?.trim() || DEFAULT_SUPABASE_ANON_KEY;
export const ANTHROPIC_KEY = env.VITE_ANTHROPIC_API_KEY?.trim() || "";

export const HAS_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const HAS_ANTHROPIC = Boolean(ANTHROPIC_KEY);

/** The demo restaurant. */
export const DEMO_SLUG = "fog-and-fern";
export const DEMO_NAME = "Fog & Fern";
export const DEMO_LOCALITY = "Hayes Valley · San Francisco";
export const DEMO_TABLES = 12;

/**
 * Where the "Post your review on Google" button goes — identical for every rating.
 * For a real listing, set VITE_GOOGLE_REVIEW_URL to its
 *   https://search.google.com/local/writereview?placeid=<REAL_PLACE_ID>
 * link. Fog & Fern is a fictional demo restaurant with no such page, so the safe
 * default is a Google Maps search (always resolves, never 404s).
 */
export const GOOGLE_REVIEW_URL =
  env.VITE_GOOGLE_REVIEW_URL?.trim() ||
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${DEMO_NAME} ${DEMO_LOCALITY.replace(" · ", " ")}`,
  )}`;

/** Public origin used when encoding QR codes (deployed URL when available). */
export function publicOrigin(): string {
  const fromEnv = env.VITE_PUBLIC_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "https://highnote.app";
}

export type FeedbackMode = "supabase" | "local";
export const FEEDBACK_MODE: FeedbackMode = HAS_SUPABASE ? "supabase" : "local";

export type AiMode = "edge" | "browser" | "seed";
export const AI_MODE: AiMode = HAS_SUPABASE && HAS_ANTHROPIC ? "edge" : HAS_ANTHROPIC ? "browser" : "seed";

/** One-time console banner so the operator knows which mode is live during a demo. */
let logged = false;
export function logActiveMode() {
  if (logged || typeof console === "undefined") return;
  logged = true;
  const line = "background:#142819;color:#f2b441;padding:2px 6px;border-radius:4px";
  console.log("%cHighNote ★", line, "active modes:");
  console.log(
    `  feedback: ${FEEDBACK_MODE === "supabase" ? "Supabase Realtime (cross-device)" : "BroadcastChannel + localStorage (same-browser fallback)"}`,
  );
  console.log(
    `  ai:       ${AI_MODE === "edge" ? "Supabase Edge Function (key server-side)" : AI_MODE === "browser" ? "direct browser call (CORS header)" : "seeded demo output (no key)"}`,
  );
}
