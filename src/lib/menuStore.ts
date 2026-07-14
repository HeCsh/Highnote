import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { FEEDBACK_MODE, DEMO_SLUG } from "./config";
import type { Comparison, MenuItem } from "./types";
import { MENU_ITEMS, buildSeedComparisons } from "./demoSeed";

/**
 * Menu-Elo comparison store — same dual-mode design as the feedback store:
 *   - supabase: insert to `comparisons`, subscribe to postgres_changes ("comparisons-live")
 *   - local:    persist to localStorage, broadcast via BroadcastChannel (same-browser demo)
 * Live comparisons merge on top of the seed corpus so the Menu Elo panel is never empty.
 *
 * The menu itself is static per restaurant, so we serve it from the seed module (it
 * matches the rows the migration seeds into `menu_items`).
 */

const LS_KEY = "highnote:comparisons";
const CHANNEL = "highnote-comparisons";

export function getMenuItems(slug: string = DEMO_SLUG): MenuItem[] {
  return MENU_ITEMS.filter((m) => m.restaurant_slug === slug && m.active);
}

export interface NewComparison {
  restaurant_slug: string;
  item_a: string;
  item_b: string;
  winner: string | null; // null = tie
  feedback_id: string | null;
  table_number: string;
}

function readLocal(): Comparison[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Comparison[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(list: Comparison[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch {
    /* quota / private mode — ignore */
  }
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `local-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/** Persist one comparison. Returns the stored row. */
export async function submitComparison(input: NewComparison): Promise<Comparison> {
  const row: Comparison = {
    id: makeId(),
    ...input,
    created_at: new Date().toISOString(),
    seed: false,
  };

  if (FEEDBACK_MODE === "supabase" && supabase) {
    const { data, error } = await supabase
      .from("comparisons")
      .insert({
        restaurant_slug: row.restaurant_slug,
        item_a: row.item_a,
        item_b: row.item_b,
        winner: row.winner,
        feedback_id: row.feedback_id,
        table_number: row.table_number,
      })
      .select("id, restaurant_slug, item_a, item_b, winner, feedback_id, table_number, created_at")
      .single();
    if (error) throw error;
    return { ...(data as Comparison), seed: false };
  }

  const list = readLocal();
  list.unshift(row);
  writeLocal(list);
  try {
    new BroadcastChannel(CHANNEL).postMessage({ type: "insert", row });
  } catch {
    /* storage event still covers cross-tab */
  }
  return row;
}

/** Live comparison list: seed corpus + persisted/live rows, de-duplicated. */
export function useComparisons(slug: string = DEMO_SLUG): Comparison[] {
  const [live, setLive] = useState<Comparison[]>([]);
  const [seed] = useState<Comparison[]>(() =>
    buildSeedComparisons().filter((c) => c.restaurant_slug === slug),
  );

  useEffect(() => {
    let active = true;

    if (FEEDBACK_MODE === "supabase" && supabase) {
      const sb = supabase;
      sb.from("comparisons")
        .select("id, restaurant_slug, item_a, item_b, winner, feedback_id, table_number, created_at")
        .eq("restaurant_slug", slug)
        .order("created_at", { ascending: false })
        .limit(2000)
        .then(({ data }) => {
          if (active && data) setLive(data.map((d) => ({ ...(d as Comparison), seed: false })));
        });

      const channel = sb
        .channel("comparisons-live")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "comparisons", filter: `restaurant_slug=eq.${slug}` },
          (payload) => {
            const row = { ...(payload.new as Comparison), seed: false };
            setLive((prev) => (prev.some((r) => r.id === row.id) ? prev : [row, ...prev]));
          },
        )
        .subscribe();

      return () => {
        active = false;
        sb.removeChannel(channel);
      };
    }

    setLive(readLocal().filter((c) => c.restaurant_slug === slug));

    let bc: BroadcastChannel | null = null;
    const onRow = (row: Comparison) => {
      if (row.restaurant_slug !== slug) return;
      setLive((prev) => (prev.some((r) => r.id === row.id) ? prev : [row, ...prev]));
    };
    try {
      bc = new BroadcastChannel(CHANNEL);
      bc.onmessage = (e) => {
        if (e.data?.type === "insert") onRow(e.data.row as Comparison);
      };
    } catch {
      /* storage fallback */
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KEY) setLive(readLocal().filter((c) => c.restaurant_slug === slug));
    };
    window.addEventListener("storage", onStorage);

    return () => {
      active = false;
      bc?.close();
      window.removeEventListener("storage", onStorage);
    };
  }, [slug]);

  const byId = new Map<string, Comparison>();
  for (const c of [...live, ...seed]) byId.set(c.id, c);
  return [...byId.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}
