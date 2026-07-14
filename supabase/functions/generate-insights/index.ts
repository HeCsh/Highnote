// Supabase Edge Function: generate-insights
// Proxies Anthropic so ANTHROPIC_API_KEY never ships to the browser.
// Deploy: `supabase functions deploy generate-insights`
// Secret:  `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM =
  `You are HighNote's operations analyst for an independent restaurant. Given raw guest feedback, surface exactly 3 patterns an owner can act on. Respond ONLY with JSON: {"insights":[{"title":"...","detail":"..."}]}. Each title <= 6 words. Each detail is ONE actionable sentence. Never invent facts. Never suggest discounts, rewards, or incentives.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { restaurantName, feedback } = await req.json();
    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) throw new Error("ANTHROPIC_API_KEY not set");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 400,
        system: SYSTEM,
        messages: [{ role: "user", content: `Restaurant: ${restaurantName}\nFeedback:\n${feedback}` }],
      }),
    });
    const json = await res.json();
    const text = json?.content?.[0]?.text ?? "{}";
    return new Response(text, { headers: { ...CORS, "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "content-type": "application/json" },
    });
  }
});
