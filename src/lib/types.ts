export type TagKey = "food" | "service" | "ambiance" | "speed" | "value";

export interface Feedback {
  id: string;
  restaurant_slug: string;
  table_number: string;
  rating: number; // 1-5
  tags: TagKey[];
  comment: string;
  created_at: string; // ISO
  /** true for demoSeed rows, false/undefined for real submissions */
  seed?: boolean;
}

export interface ReviewCard {
  id: string;
  author_name: string;
  source: string; // "Google"
  ago: string; // "2h ago"
  rating: number;
  text: string;
}

export type VoiceKey = "warm" | "professional" | "playful";

export interface Insight {
  id: string;
  title: string; // <= 6 words
  detail: string; // one actionable sentence
  demo?: boolean; // true when seeded (no live AI)
  source?: "feedback" | "menu-elo"; // provenance tag for AI Radar
}

/* ---- Menu Elo (pairwise dish comparisons → Bradley-Terry ranking) ---- */

export type MenuSection = "Starters" | "Mains" | "Desserts" | "Drinks";

export interface MenuItem {
  id: string; // stable slug (works identically in local + Supabase modes)
  restaurant_slug: string;
  name: string;
  emoji?: string;
  section: MenuSection;
  active: boolean;
  created_at: string;
}

export interface Comparison {
  id: string;
  restaurant_slug: string;
  item_a: string; // MenuItem id
  item_b: string; // MenuItem id
  winner: string | null; // MenuItem id, or null = tie
  feedback_id: string | null; // links to the guest's feedback row
  table_number: string;
  created_at: string; // ISO
  seed?: boolean;
}
