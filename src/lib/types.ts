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
}
