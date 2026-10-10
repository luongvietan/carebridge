import "server-only";

export type EmailDelivery = "sent" | "skipped";
export type EmailMessage = { to: string; subject: string; text: string; html: string };

/** 'sent' means accepted by Resend, not confirmed delivery to an inbox. */
export async function sendEmail(message: EmailMessage, idempotencyKey?: string): Promise<EmailDelivery> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  if (!key || !from) return "skipped";
  const headers = message.to + from + message.subject;
  if (["\r", "\n", "\u0000"].some((char) => headers.includes(char))) throw new Error("Invalid email header");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}) },
    body: JSON.stringify({ from, to: message.to, subject: message.subject, text: message.text, html: message.html }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Email provider rejected delivery (${response.status})`);
  return "sent";
}
