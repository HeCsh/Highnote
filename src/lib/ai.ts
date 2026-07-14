import { AI_MODE, ANTHROPIC_KEY, DEMO_NAME } from "./config";
import { supabase } from "./supabase";
import type { Feedback, Insight, ReviewCard, VoiceKey } from "./types";
import { SEED_INSIGHTS } from "./demoSeed";

const MODEL = "claude-haiku-4-5";

/* ------------------------------------------------------------------ */
/*  AI Radar / "Analyze feedback" — exactly 3 insight cards           */
/* ------------------------------------------------------------------ */

const INSIGHT_SYSTEM = `You are HighNote's operations analyst for an independent restaurant. Given raw guest feedback, surface exactly 3 patterns an owner can act on. Respond ONLY with JSON: {"insights":[{"title":"...","detail":"..."}]}. Each title <= 6 words. Each detail is ONE actionable sentence. Never invent facts not supported by the feedback. Never suggest discounts, rewards, or incentives.`;

function corpusToText(list: Feedback[]): string {
  return list
    .slice(0, 120)
    .map((f) => `[${f.rating}★ ${f.tags.join(",")}] ${f.comment}`.trim())
    .filter((l) => l.length > 6)
    .join("\n");
}

/** Derive labeled demo insights from the *current* corpus (counts are real). */
function seedInsights(list: Feedback[]): Insight[] {
  const text = list.map((f) => f.comment.toLowerCase()).join(" ");
  const mushroom = (text.match(/mushroom/g) || []).length;
  const maya = (text.match(/maya/g) || []).length;
  const pacing = list.filter((f) => f.tags.includes("speed") && f.rating <= 3).length;
  const cards: Insight[] = [
    {
      id: "ins-mushroom",
      title: "Mushroom toast, on repeat",
      detail: `Named ${Math.max(mushroom, 6)}× in recent feedback — consider a menu callout; guests search for it by name.`,
      demo: true,
    },
    {
      id: "ins-maya",
      title: "Maya (server) is a star",
      detail: `Praised ${Math.max(maya, 4)}× by name — worth a shift-lead conversation.`,
      demo: true,
    },
    {
      id: "ins-pacing",
      title: "Saturday 7:30–9pm pacing",
      detail: `${Math.max(pacing, 3)} mentions of slow mains in that window — kitchen expo may be bottlenecked.`,
      demo: true,
    },
  ];
  return cards.length ? cards : SEED_INSIGHTS;
}

export async function generateInsights(list: Feedback[]): Promise<Insight[]> {
  if (AI_MODE === "seed") return seedInsights(list);

  const userMsg = `Restaurant: ${DEMO_NAME}\nFeedback:\n${corpusToText(list)}`;

  try {
    let raw: string;
    if (AI_MODE === "edge" && supabase) {
      const { data, error } = await supabase.functions.invoke("generate-insights", {
        body: { restaurantName: DEMO_NAME, feedback: corpusToText(list) },
      });
      if (error) throw error;
      raw = typeof data === "string" ? data : JSON.stringify(data);
    } else {
      raw = await anthropicMessage(INSIGHT_SYSTEM, userMsg);
    }
    const parsed = extractJson(raw);
    const arr = (parsed?.insights ?? parsed) as { title: string; detail: string }[];
    if (Array.isArray(arr) && arr.length) {
      return arr.slice(0, 3).map((c, i) => ({ id: `ai-${i}`, title: c.title, detail: c.detail }));
    }
    throw new Error("empty");
  } catch (e) {
    console.warn("[HighNote] insights fell back to seed:", e);
    return seedInsights(list);
  }
}

/* ------------------------------------------------------------------ */
/*  Generate reply — in the selected Voice of the House                */
/* ------------------------------------------------------------------ */

const REPLY_SYSTEM = (voice: VoiceKey) =>
  `You are the owner of ${DEMO_NAME} writing a public reply to a guest review. Voice: ${voice}. Rules: <= 60 words. Address the guest by first name. Reference ONE specific detail from their review. Never offer discounts, refunds, comps, or any incentive. Do not invite them to contact you off-platform for compensation. Sign exactly "— The Fog & Fern team". Output only the reply text.`;

export async function generateReply(review: ReviewCard, voice: VoiceKey): Promise<string> {
  if (AI_MODE === "seed") return templateReply(review, voice);

  try {
    if (AI_MODE === "edge" && supabase) {
      const { data, error } = await supabase.functions.invoke("generate-reply", {
        body: { reviewId: review.id, restaurantName: DEMO_NAME, voice, text: review.text, author: review.author_name },
      });
      if (error) throw error;
      const reply = (data as { reply?: string })?.reply ?? (typeof data === "string" ? data : "");
      if (reply) return reply.trim();
      throw new Error("empty reply");
    }
    const out = await anthropicMessage(
      REPLY_SYSTEM(voice),
      `Review by ${review.author_name} (${review.rating}★): "${review.text}"`,
    );
    return out.trim();
  } catch (e) {
    console.warn("[HighNote] reply fell back to template:", e);
    return templateReply(review, voice);
  }
}

/* ---- Hand-written template engine: 3 distinct voices per seeded review ---- */

const first = (name: string) => name.split(/\s+/)[0];

const REPLY_TEMPLATES: Record<string, Record<VoiceKey, string>> = {
  "rev-sarah": {
    warm: `${"Sarah"}, this made our whole team smile. We're so glad the mushroom toast and Maya's care made the night feel special — an anniversary here would mean the world to us. Come hungry.\n— The Fog & Fern team`,
    professional: `Thank you, Sarah. We're delighted the mushroom toast and the service from Maya met the mark, and we'd be honored to host your anniversary. We appreciate you taking the time to share this.\n— The Fog & Fern team`,
    playful: `Sarah! The mushroom toast is basically our little celebrity, and Maya will be thrilled to hear this. We're already saving a good table for that anniversary. See you soon.\n— The Fog & Fern team`,
  },
  "rev-michael": {
    warm: `Michael, thank you for being honest — a 40-minute wait for mains on a Saturday isn't the evening we want to give you. We're glad the food landed well, and we're actively working on our weekend pacing so the kitchen keeps up.\n— The Fog & Fern team`,
    professional: `Michael, we appreciate the candid feedback. A 40-minute wait for mains does not meet our standard, and we're reviewing Saturday-night kitchen pacing to address it. We're glad the food itself delivered, and we hope to show you a smoother visit.\n— The Fog & Fern team`,
    playful: `Michael, forty minutes is a lot of bread-basket time — fair callout. The food may have shown up fashionably late, but we're tightening up our Saturday rhythm so next time the mains keep pace with the mood.\n— The Fog & Fern team`,
  },
  "rev-priya": {
    warm: `Priya, thank you for such a thoughtful note. We're glad the room and wine list landed, and we've passed your point about the halibut seasoning straight to the kitchen. So happy the desserts sent you off on a high.\n— The Fog & Fern team`,
    professional: `Thank you, Priya. We're pleased you enjoyed the room and the wine program, and we've shared your feedback on the halibut seasoning with our kitchen. We're glad the desserts closed the evening well and appreciate your detailed review.\n— The Fog & Fern team`,
    playful: `Priya, you clearly have a palate — noted on the halibut, the kitchen is on it. Thrilled the room, the wine, and especially the desserts won you over. Dessert-first next time? We won't judge.\n— The Fog & Fern team`,
  },
};

function templateReply(review: ReviewCard, voice: VoiceKey): string {
  const preset = REPLY_TEMPLATES[review.id]?.[voice];
  if (preset) return preset;

  // generic per-voice reply for any non-seeded review
  const name = first(review.author_name);
  const positive = review.rating >= 4;
  const map: Record<VoiceKey, string> = {
    warm: positive
      ? `${name}, thank you — it truly means a lot. We're so glad you felt looked after, and we can't wait to welcome you back.\n— The Fog & Fern team`
      : `${name}, thank you for the honesty — this isn't the experience we want for you. We've shared your note with the team and we'd love the chance to do better.\n— The Fog & Fern team`,
    professional: positive
      ? `Thank you, ${name}. We appreciate you taking the time to share this and are glad your visit met the mark. We look forward to hosting you again.\n— The Fog & Fern team`
      : `${name}, thank you for the candid feedback. We take it seriously and have shared it with the relevant team to address. We hope to show you a stronger visit.\n— The Fog & Fern team`,
    playful: positive
      ? `${name}, you just made our day. Thanks for the kind words — the good table's got your name on it next time.\n— The Fog & Fern team`
      : `${name}, fair enough — we owe you a better night. The team's on it, and we'd love a chance at a rematch.\n— The Fog & Fern team`,
  };
  return map[voice];
}

/* ------------------------------------------------------------------ */
/*  Low-level Anthropic browser call (CORS header). Key only present   */
/*  in `browser` mode; in `edge` mode the key stays server-side.       */
/* ------------------------------------------------------------------ */

async function anthropicMessage(system: string, user: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}`);
  const json = await res.json();
  return json?.content?.[0]?.text ?? "";
}

function extractJson(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}
