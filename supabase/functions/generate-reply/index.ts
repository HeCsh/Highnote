// Supabase Edge Function: generate-reply
// Drafts a public reply to a review in the selected Voice of the House.
// Deploy: `supabase functions deploy generate-reply`
// Secret:  `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const system = (voice: string, restaurant: string) =>
  `You are the owner of ${restaurant} writing a public reply to a guest review. Voice: ${voice}. Rules: <= 60 words. Address the guest by first name. Reference ONE specific detail from their review. Never offer discounts, refunds, comps, or any incentive. Do not invite off-platform contact for compensation. Sign exactly "— The Fog & Fern team". Output only the reply text.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { restaurantName, voice, text, author } = await req.json();
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
        max_tokens: 200,
        system: system(voice ?? "warm", restaurantName ?? "the restaurant"),
        messages: [{ role: "user", content: `Review by ${author}: "${text}"` }],
      }),
    });
    const json = await res.json();
    const reply = json?.content?.[0]?.text ?? "";
    return new Response(JSON.stringify({ reply }), {
      headers: { ...CORS, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "content-type": "application/json" },
    });
  }
});
