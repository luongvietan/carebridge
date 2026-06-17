import { type NextRequest, NextResponse } from "next/server";
import { sendDueComplianceReminders } from "@/lib/compliance/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Scheduled endpoint for sending compliance expiry reminder emails.
 * Point any external scheduler (Vercel Cron, GitHub Actions, Supabase scheduled
 * function, etc.) at this URL daily with an `Authorization: Bearer <CRON_SECRET>`
 * header. The daily document-expiry sweep that raises the alerts is scheduled
 * separately via pg_cron (migration 0015).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response("CRON_SECRET not configured", { status: 503 });

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });

  const { sent } = await sendDueComplianceReminders();
  return NextResponse.json({ ok: true, sent });
}
