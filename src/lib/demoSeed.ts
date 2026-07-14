import type { Feedback, MenuItem, ReviewCard, TagKey } from "./types";
import { DEMO_SLUG } from "./config";

const DAY = 86_400_000;

/**
 * Fog & Fern menu (~12 items), consistent with the demo narrative. Ids are stable
 * slugs so the same objects work in local-fallback and Supabase modes without a
 * round-trip. Referenced by comparisons (see buildSeedComparisons + menuStore).
 */
export const MENU_ITEMS: MenuItem[] = (
  [
    ["mushroom-toast", "Mushroom Toast", "🍄", "Starters"],
    ["little-gem-salad", "Little Gem Salad", "🥬", "Starters"],
    ["crispy-brussels", "Crispy Brussels", "🥦", "Starters"],
    ["pan-seared-halibut", "Pan-Seared Halibut", "🐟", "Mains"],
    ["half-roast-chicken", "Half Roast Chicken", "🍗", "Mains"],
    ["squash-risotto", "Squash Risotto", "🎃", "Mains"],
    ["dry-aged-burger", "Dry-Aged Burger", "🍔", "Mains"],
    ["olive-oil-cake", "Olive Oil Cake", "🍰", "Desserts"],
    ["chocolate-pot-de-creme", "Chocolate Pot de Crème", "🍫", "Desserts"],
    ["affogato", "Affogato", "☕", "Desserts"],
    ["house-negroni", "House Negroni", "🍸", "Drinks"],
    ["fog-cutter", "Fog Cutter", "🍹", "Drinks"],
  ] as const
).map(([id, name, emoji, section]) => ({
  id,
  restaurant_slug: DEMO_SLUG,
  name,
  emoji,
  section: section as MenuItem["section"],
  active: true,
  created_at: new Date(0).toISOString(),
}));

/**
 * ~25 realistic entries spread across the past 6 weeks. Ratings skew 4–5 (a
 * healthy neighborhood bistro), tags varied, and several comments name the
 * mushroom toast, server Maya, and Saturday pacing so AI Radar stays coherent
 * even offline. Timestamps are relative to load time so the "current week"
 * bucket is always populated (never a zero widget — Task 6).
 */
type Raw = { d: number; h: number; rating: number; tags: TagKey[]; table: number; comment: string };

const RAW: Raw[] = [
  // ---- current week (days 0–6) ----
  { d: 0, h: 13, rating: 5, tags: ["food", "service"], table: 4, comment: "Mushroom toast was unreal and Maya took great care of us." },
  { d: 1, h: 20, rating: 5, tags: ["food", "ambiance"], table: 9, comment: "The room glows at night. Best halibut I've had in months." },
  { d: 1, h: 19, rating: 4, tags: ["food", "value"], table: 2, comment: "Great cooking, fair prices for the quality." },
  { d: 2, h: 12, rating: 5, tags: ["service"], table: 6, comment: "Maya remembered our anniversary from last year. Wow." },
  { d: 3, h: 21, rating: 4, tags: ["food", "ambiance"], table: 11, comment: "Mushroom toast lives up to the hype. Cozy corner table." },
  { d: 4, h: 18, rating: 5, tags: ["food", "service", "ambiance"], table: 7, comment: "Everything sang tonight. Wine pairing was spot on." },
  { d: 5, h: 20, rating: 3, tags: ["speed"], table: 3, comment: "Food was lovely but mains took a while on a busy Saturday." },
  { d: 6, h: 13, rating: 5, tags: ["food"], table: 8, comment: "That mushroom toast again. Ordered two." },

  // ---- week 2 ----
  { d: 8, h: 19, rating: 5, tags: ["food", "service"], table: 5, comment: "Maya is a gem. Attentive without hovering." },
  { d: 9, h: 20, rating: 4, tags: ["ambiance", "value"], table: 10, comment: "Beautiful space, thoughtful list, honest prices." },
  { d: 11, h: 21, rating: 3, tags: ["speed", "food"], table: 1, comment: "Saturday 8pm — mains dragged, but the food arrived worth it." },
  { d: 12, h: 12, rating: 5, tags: ["food"], table: 6, comment: "Halibut cooked perfectly. Dessert stole the show." },

  // ---- week 3 ----
  { d: 15, h: 18, rating: 4, tags: ["food", "service"], table: 4, comment: "Solid all around. Server checked in at the right moments." },
  { d: 16, h: 20, rating: 5, tags: ["food", "ambiance"], table: 9, comment: "Mushroom toast + candlelight = perfect date night." },
  { d: 18, h: 19, rating: 4, tags: ["value"], table: 2, comment: "You get a lot for what you pay here." },
  { d: 19, h: 21, rating: 2, tags: ["speed"], table: 3, comment: "Long wait for mains Saturday night. Kitchen seemed backed up." },

  // ---- week 4 ----
  { d: 22, h: 13, rating: 5, tags: ["food", "service"], table: 7, comment: "Maya recommended the halibut — chef's kiss." },
  { d: 24, h: 20, rating: 4, tags: ["ambiance"], table: 11, comment: "Warm, intimate, unhurried on a weeknight." },
  { d: 25, h: 19, rating: 5, tags: ["food"], table: 8, comment: "The mushroom toast should be famous." },
  { d: 26, h: 21, rating: 3, tags: ["speed", "food"], table: 5, comment: "Great flavors, slow pacing around 8:30 Saturday." },

  // ---- week 5 ----
  { d: 30, h: 18, rating: 5, tags: ["food", "service", "value"], table: 6, comment: "Best value fine-ish dining in the neighborhood. Maya rocks." },
  { d: 32, h: 20, rating: 4, tags: ["food", "ambiance"], table: 10, comment: "Lovely evening. Halibut a touch under-seasoned but desserts fixed it." },
  { d: 34, h: 19, rating: 5, tags: ["food"], table: 4, comment: "Mushroom toast on repeat. Never disappoints." },

  // ---- week 6 ----
  { d: 38, h: 20, rating: 4, tags: ["service", "ambiance"], table: 9, comment: "Genuinely kind staff. Felt looked after." },
  { d: 40, h: 21, rating: 5, tags: ["food", "service"], table: 7, comment: "Maya + that mushroom toast = we're regulars now." },

  // ---- prior month (>6 weeks old: powers the "improving this month" trend; excluded
  //      from the 6-week chart, but counted in the all-time Google rating + distribution) ----
  { d: 44, h: 21, rating: 3, tags: ["speed", "food"], table: 3, comment: "Saturday service lagged badly — mains took ages. Food fine." },
  { d: 48, h: 20, rating: 2, tags: ["speed"], table: 1, comment: "Nearly an hour for mains. Kitchen clearly overwhelmed." },
  { d: 52, h: 19, rating: 3, tags: ["food"], table: 5, comment: "Halibut arrived under-seasoned. Room is lovely though." },
  { d: 56, h: 21, rating: 3, tags: ["speed", "service"], table: 8, comment: "Slow night, felt a bit forgotten between courses." },
];

/** Build seed feedback dated relative to `now` (defaults to load time). */
export function buildSeedFeedback(now = Date.now()): Feedback[] {
  return RAW.map((r, i) => {
    const t = now - r.d * DAY - (23 - r.h) * 3_600_000;
    return {
      id: `seed-${i}`,
      restaurant_slug: DEMO_SLUG,
      table_number: String(r.table),
      rating: r.rating,
      tags: r.tags,
      comment: r.comment,
      created_at: new Date(t).toISOString(),
      seed: true,
    };
  });
}

/** Seeded pairwise comparisons — the real story is built in Task 5. */
export function buildSeedComparisons(_now = Date.now()): import("./types").Comparison[] {
  return [];
}

/** The three reviews awaiting a reply (matches Prototype A's dashboard). */
export const SEED_REVIEWS: ReviewCard[] = [
  {
    id: "rev-sarah",
    author_name: "Sarah K.",
    source: "Google",
    ago: "2h ago",
    rating: 5,
    text: "The mushroom toast was unreal, and our server Maya made the night. Already planning to come back for our anniversary.",
  },
  {
    id: "rev-michael",
    author_name: "Michael D.",
    source: "Google",
    ago: "yesterday",
    rating: 2,
    text: "Waited 40 minutes for mains on a Saturday night. Food was fine when it arrived but the pacing killed the mood.",
  },
  {
    id: "rev-priya",
    author_name: "Priya R.",
    source: "Google",
    ago: "2d ago",
    rating: 4,
    text: "Beautiful room, thoughtful wine list. The halibut was slightly under-seasoned but the desserts more than made up for it.",
  },
];

/** Coherent fallback AI Radar cards (used when no Anthropic key). */
export const SEED_INSIGHTS = [
  { id: "ins-1", title: "Mushroom toast, on repeat", detail: "Praised 8× this week — consider a menu callout, guests are searching for it by name.", demo: true },
  { id: "ins-2", title: "Maya (server) is a star", detail: "Named 5× in positive reviews; worth a shift-lead conversation.", demo: true },
  { id: "ins-3", title: "Saturday 7:30–9pm pacing", detail: "3 mentions of slow mains in that window — kitchen expo may be bottlenecked.", demo: true },
];
