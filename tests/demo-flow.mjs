import { chromium } from "playwright";

const BASE = "http://localhost:5173";
let fail = 0;
const ok = (c, m) => { console.log(`${c ? "✓" : "✗"} ${m}`); if (!c) fail++; };

const browser = await chromium.launch();
// One shared context so BroadcastChannel/localStorage is visible across "phone" + "projector" tabs.
const ctx = await browser.newContext();

// ---- Dashboard (projector) ----
const dash = await ctx.newPage();
await dash.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });

const liveBadge = dash.getByText("live", { exact: true });
const liveBadgesBefore = await liveBadge.count();
const distRowBefore = await dash.locator("text=RATING DISTRIBUTION").count();
ok(distRowBefore === 1, "dashboard: rating distribution widget present");
const kpiReviews = await dash.locator("text=REVIEWS THIS WEEK").count();
ok(kpiReviews === 1, "dashboard: KPI cards rendered");
const radar = await dash.locator("text=AI Radar").count();
ok(radar === 1, "dashboard: AI Radar present");
// no zero widgets
const bodyText = await dash.locator("body").innerText();
ok(!/Submissions\s*0\b/.test(bodyText), "dashboard: no 'Submissions 0'");
ok(!/No insights yet/.test(bodyText), "dashboard: no 'No insights yet'");
const feedRowsBefore = await dash.locator("div.animate-slide-in").count();
ok(feedRowsBefore > 0, `dashboard: live feed pre-seeded (${feedRowsBefore} rows)`);

// ---- Guest (phone) submits in SAME context ----
const phone = await ctx.newPage();
await phone.setViewportSize({ width: 390, height: 844 });
await phone.goto(`${BASE}/r/fog-and-fern?t=12`, { waitUntil: "networkidle" });

// compliance: Google button (on the review step, reached via Continue→Skip) must be
// identical regardless of rating. Reach it with 1★, then with 5★, and compare.
async function reachGoogleText(stars) {
  await phone.goto(`${BASE}/r/fog-and-fern?t=12`, { waitUntil: "networkidle" });
  await phone.getByRole("radio", { name: new RegExp(`^${stars} star`) }).click();
  await phone.getByRole("button", { name: /Continue/ }).click();
  await phone.getByRole("button", { name: /^Skip$/ }).click();
  return (await phone.locator("button", { hasText: "Post your review on Google" }).innerText()).trim();
}
const btn1 = await reachGoogleText(1);
const btn5 = await reachGoogleText(5);
ok(btn1 === btn5, `compliance: Google button text identical 1★/5★ ("${btn1}")`);

// full submit: 4 stars + Food + comment, skip the optional interlude, then Google step
await phone.goto(`${BASE}/r/fog-and-fern?t=12`, { waitUntil: "networkidle" });
await phone.getByRole("radio", { name: /^4 star/ }).click();
await phone.getByRole("button", { name: /Food/ }).click();
await phone.locator("#comment").fill("Mushroom toast was incredible — E2E test");
await phone.getByRole("button", { name: /Continue/ }).click(); // rate -> dishes
await phone.getByRole("button", { name: /^Skip$/ }).click(); // dishes -> review
phone.on("popup", (p) => p.close().catch(() => {}));
await phone.locator("button", { hasText: "Post your review on Google" }).click();
await phone.waitForTimeout(400);
const posted = await phone.locator("body").innerText();
ok(/Review accepted|thank you/i.test(posted), "guest: confirmation shown after submit");

// ---- Back on dashboard: did it appear live (<=2s)? ----
await dash.waitForTimeout(1500);
const feedRowsAfter = await dash.locator("div.animate-slide-in").count();
const liveBadgesAfter = await liveBadge.count();
ok(feedRowsAfter >= feedRowsBefore, `dashboard: feed updated (${feedRowsBefore} → ${feedRowsAfter})`);
ok(liveBadgesAfter > liveBadgesBefore, `dashboard: new 'live' badge appeared (${liveBadgesBefore} → ${liveBadgesAfter})`);
const newComment = await dash.locator("text=Mushroom toast was incredible — E2E test").count();
ok(newComment >= 1, "dashboard: the submitted comment is visible in the live stream");

// ---- AI reply: generate + voice switch ----
const genBtn = dash.locator("button", { hasText: "Generate reply with AI" }).first();
await genBtn.click();
await dash.waitForSelector("textarea", { timeout: 5000 });
const warmDraft = await dash.locator("textarea").first().inputValue();
ok(/The Fog & Fern team/.test(warmDraft), "AI reply: draft signed correctly");
ok(!/discount|free|refund|coupon/i.test(warmDraft), "AI reply: no incentive language");
// switch voice to playful and regenerate
await dash.getByRole("button", { name: "playful" }).click();
await dash.locator("button", { hasText: "Regenerate" }).first().click();
await dash.waitForTimeout(300);
const playfulDraft = await dash.locator("textarea").first().inputValue();
ok(playfulDraft !== warmDraft, "AI reply: playful voice differs from warm");

// ---- Refresh insights ----
await dash.locator("button", { hasText: "Refresh insights" }).click();
await dash.waitForTimeout(400);
const insightCards = await dash.getByText("demo data", { exact: true }).count();
ok(insightCards === 3, `AI Radar: 3 insight cards after refresh (${insightCards})`);

// ---- i18n ----
await phone.goto(`${BASE}/r/fog-and-fern?t=7`, { waitUntil: "networkidle" });
await phone.getByRole("button", { name: "中文" }).click();
await phone.waitForTimeout(200);
const zh = await phone.locator("h1").first().innerText();
ok(/今天的用餐体验/.test(zh), `i18n: Chinese heading rendered ("${zh}")`);
await phone.getByRole("button", { name: "ES" }).click();
await phone.waitForTimeout(200);
const es = await phone.locator("h1").first().innerText();
ok(/Qué tal estuvo/.test(es), `i18n: Spanish heading rendered ("${es}")`);

// ---- Onboarding + QR ----
const onb = await ctx.newPage();
await onb.goto(`${BASE}/onboarding?step=3`, { waitUntil: "networkidle" });
await onb.waitForSelector("img[alt^='QR code for table']", { timeout: 5000 });
const qrCount = await onb.locator("img[alt^='QR code for table']").count();
ok(qrCount === 12, `onboarding: 12 table QR codes rendered (${qrCount})`);
const qrSrc = await onb.locator("img[alt='QR code for table 1']").getAttribute("src");
ok(qrSrc?.startsWith("data:image/png"), "onboarding: QR is a real generated PNG");

console.log(fail === 0 ? "\n✅ ALL E2E PASS" : `\n❌ ${fail} FAILURES`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
