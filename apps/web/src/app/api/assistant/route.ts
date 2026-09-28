import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { detectLocale, type AssistantLocale } from "@/lib/assistant/language";
import { answerFromKnowledge } from "@/lib/assistant/fallback";
import { buildSystemPrompt } from "@/lib/assistant/prompt";
import { askClaude } from "@/lib/assistant/llm";
import { allowRequest } from "@/lib/assistant/rate-limit";
import { LOCALE_BY_COUNTRY, MARKET_COOKIE, parseSelectedMarket } from "@/lib/marketing/market";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(1000) }))
    .min(1)
    .max(12),
});

/**
 * Public help assistant. Answers in the language the visitor writes in
 * (falling back to their market's), from the site's own content only.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!allowRequest(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const { messages } = parsed.data;
  const last = messages[messages.length - 1];
  if (last.role !== "user") return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const store = await cookies();
  const marketLocale = LOCALE_BY_COUNTRY[
    parseSelectedMarket(store.get(MARKET_COOKIE)?.value)
  ] as AssistantLocale;
  const locale = detectLocale(last.content, marketLocale);

  const reply = await askClaude(buildSystemPrompt(locale), messages);
  if (reply) return NextResponse.json({ reply, locale, source: "model" });

  const { answer } = answerFromKnowledge(last.content, locale);
  return NextResponse.json({ reply: answer, locale, source: "faq" });
}
