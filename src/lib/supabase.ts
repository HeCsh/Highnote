import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { HAS_SUPABASE, SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

/**
 * Single shared client. `null` when env vars are absent so callers can cleanly
 * fall back to the local BroadcastChannel path (see store.ts).
 */
export const supabase: SupabaseClient | null = HAS_SUPABASE
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null;
