/**
 * Runtime capability detection. The app is fully functional with ZERO env vars
 * (local demo mode); each env var upgrades one capability.
 */
const env = import.meta.env;

export const SUPABASE_URL = env.VITE_SUPABASE_URL?.trim() || "";
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY?.trim() || "";
export const ANTHROPIC_KEY = env.VITE_ANTHROPIC_API_KEY?.trim() || "";

export const HAS_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const HAS_ANTHROPIC = Boolean(ANTHROPIC_KEY);

/** The demo restaurant. */
export const DEMO_SLUG = "fog-and-fern";
export const DEMO_NAME = "Fog & Fern";
export const DEMO_LOCALITY = "Hayes Valley · San Francisco";
export const DEMO_TABLES = 12;

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
