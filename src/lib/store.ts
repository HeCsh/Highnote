import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { FEEDBACK_MODE, DEMO_SLUG } from "./config";
import type { Feedback, TagKey } from "./types";
import { buildSeedFeedback } from "./demoSeed";

/**
 * Feedback store with two interchangeable backends (see ARCHITECTURE_NOTES.md):
 *   - supabase: insert to `feedback`, subscribe to postgres_changes INSERT ("feedback-live")
 *   - local:    persist to localStorage, broadcast via BroadcastChannel (same-browser demo)
 * Both merge live rows on top of the seed corpus so the dashboard is never empty.
 */

const LS_KEY = "highnote:feedback";
const CHANNEL = "highnote-feedback";

export interface NewFeedback {
  restaurant_slug: string;
  table_number: string;
  rating: number;
  tags: TagKey[];
  comment: string;
}

function readLocal(): Feedback[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Feedback[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(list: Feedback[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch {
    /* quota / private mode — ignore */
  }
}

function makeId(): string {
  // crypto.randomUUID is available in all evergreen browsers; fallback keeps types happy
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `local-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/** Insert one submission. Returns the persisted row. */
export async function submitFeedback(input: NewFeedback): Promise<Feedback> {
  const row: Feedback = {
    id: makeId(),
    ...input,
    created_at: new Date().toISOString(),
    seed: false,
  };

  if (FEEDBACK_MODE === "supabase" && supabase) {
    const { data, error } = await supabase
      .from("feedback")
      .insert({
        restaurant_slug: row.restaurant_slug,
        table_number: row.table_number,
        rating: row.rating,
        tags: row.tags,
        comment: row.comment,
      })
      .select("id, restaurant_slug, table_number, rating, tags, comment, created_at")
      .single();
    if (error) throw error;
    // Realtime will also deliver this row to subscribers (including us); return the canonical one.
    return { ...(data as Feedback), seed: false };
  }

  // local mode: persist + broadcast to other tabs/windows in this browser
  const list = readLocal();
  list.unshift(row);
  writeLocal(list);
  try {
    new BroadcastChannel(CHANNEL).postMessage({ type: "insert", row });
  } catch {
    /* Safari private mode etc. — localStorage 'storage' event still fires cross-tab */
  }
  return row;
}

/**
 * Live feedback list for one restaurant: seed corpus + persisted/live rows,
 * newest first, de-duplicated by id. Re-renders on every new submission.
 */
export function useFeedback(slug: string = DEMO_SLUG): { list: Feedback[]; live: number } {
  const [live, setLive] = useState<Feedback[]>([]);
  const [seed] = useState<Feedback[]>(() => buildSeedFeedback().filter((f) => f.restaurant_slug === slug));

  useEffect(() => {
    let active = true;

    if (FEEDBACK_MODE === "supabase" && supabase) {
      const sb = supabase;
      // initial fetch
      sb
        .from("feedback")
        .select("id, restaurant_slug, table_number, rating, tags, comment, created_at")
        .eq("restaurant_slug", slug)
        .order("created_at", { ascending: false })
        .limit(200)
        .then(({ data }) => {
          if (active && data) setLive(data.map((d) => ({ ...(d as Feedback), seed: false })));
        });

      const channel = sb
        .channel("feedback-live")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "feedback", filter: `restaurant_slug=eq.${slug}` },
          (payload) => {
            const row = { ...(payload.new as Feedback), seed: false };
            setLive((prev) => (prev.some((r) => r.id === row.id) ? prev : [row, ...prev]));
          },
        )
        .subscribe();

      return () => {
        active = false;
        sb.removeChannel(channel);
      };
    }

    // local mode
    setLive(readLocal().filter((f) => f.restaurant_slug === slug));

    let bc: BroadcastChannel | null = null;
    const onRow = (row: Feedback) => {
      if (row.restaurant_slug !== slug) return;
      setLive((prev) => (prev.some((r) => r.id === row.id) ? prev : [row, ...prev]));
    };
    try {
      bc = new BroadcastChannel(CHANNEL);
      bc.onmessage = (e) => {
        if (e.data?.type === "insert") onRow(e.data.row as Feedback);
      };
    } catch {
      /* fall through to storage event */
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KEY) setLive(readLocal().filter((f) => f.restaurant_slug === slug));
    };
    window.addEventListener("storage", onStorage);

    return () => {
      active = false;
      bc?.close();
      window.removeEventListener("storage", onStorage);
    };
  }, [slug]);

  // merge seed + live, de-dup, newest first
  const byId = new Map<string, Feedback>();
  for (const f of [...live, ...seed]) byId.set(f.id, f);
  const list = [...byId.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return { list, live: live.length };
}
