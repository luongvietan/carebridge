import "server-only";

export type ChatTurn = { role: "user" | "assistant"; content: string };

const MODEL = process.env.ASSISTANT_MODEL ?? "claude-haiku-4-5-20251001";

/**
 * One call to the Claude Messages API. Returns null whenever the assistant
 * cannot use it (no key, network error, non-2xx), so the caller falls back to
 * the keyword answer instead of showing an error to a visitor.
 */
export async function askClaude(system: string, messages: ChatTurn[]): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 400, system, messages }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((c) => c.type === "text")?.text?.trim();
    return text || null;
  } catch {
    return null;
  }
}
