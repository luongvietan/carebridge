import { type NextRequest, NextResponse } from "next/server";
import {
  sendDueComplianceReminders,
  sendDueAutoRestrictionNotices,
} from "@/lib/compliance/reminders";
import { autoConfirmDueTimesheets } from "@/lib/timesheets/auto-confirm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Scheduled endpoint for sending compliance expiry reminder emails.
 *
 * Invoked daily by Vercel Cron (see apps/web/vercel.json), which issues a GET
 * and — when a CRON_SECRET env var is set on the project — automatically adds an
 * `Authorization: Bearer <CRON_SECRET>` header. Any external scheduler that can
 * send that header works too. The daily document-expiry sweep that *raises* the
 * alerts is scheduled separately via pg_cron (migration 0015).
 *
 * It also closes the timesheet loop: hours a client has left unanswered for
 * three working days are confirmed automatically, so a silent client cannot
 * withhold a professional's pay indefinitely.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response("CRON_SECRET not configured", { status: 503 });

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });

  const { sent } = await sendDueComplianceReminders();
  const { sent: restrictionNotices } = await sendDueAutoRestrictionNotices();
  const { confirmed: timesheetsConfirmed } = await autoConfirmDueTimesheets();
  return NextResponse.json({ ok: true, sent, restrictionNotices, timesheetsConfirmed });
}
