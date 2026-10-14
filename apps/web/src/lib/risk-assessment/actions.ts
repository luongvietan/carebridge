"use server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import { requireAuth } from "@/lib/auth/require-auth";
import { applyTransition } from "@/lib/bookings/transitions";
import { writeCancelBooking } from "@/lib/bookings/service-writes";
import { notifyMatchingProfessionals } from "@/lib/bookings/notify-matches";
import { sendNotification } from "@/lib/notifications/send";
import { buildSnapshot, type RateCard } from "@/lib/rates/snapshot";
import { needsClinicalReview, roleFamilyOf } from "./score";
import type { Database } from "@/lib/supabase/types";

export type ReviewActionResult = { ok: true } | { error: string };

/** Ana's admin review record (spec section 15). */
export type ReviewInput = {
  /** Reason and risk-control measures — internal, never sent to the client. */
  reason: string;
  /** What the client is told (required to decline or ask for more information). */
  clientMessage?: string;
  /** Professional category permitted; a different role re-prices the booking. */
  permittedRoleId?: string;
  requiresTwoWorkers?: boolean;
  /** Specific competency or equipment the professional needs. */
  requiredCompetency?: string;
  /** Instructions added to the professional's safety brief. */
  professionalInstructions?: string;
  /** Reassessment date, `YYYY-MM-DD`. */
  reassessOn?: string;
};

const MAX = 2000;
const clean = (v: string | undefined) => v?.trim().slice(0, MAX) || null;

async function guard(bookingId: string) {
  await requireAuth();
  const adminId = await requireAdmin();
  if (!adminId) return { ok: false, error: "Administrator access required." } as const;
  const admin = createServiceClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("status, requester_user_id, professional_role_id, care_type_id, scheduled_start")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return { ok: false, error: "Booking not found." } as const;
  if (booking.status !== "pending_review") return { ok: false, error: "This request is no longer waiting for review." } as const;
  const [{ data: assessment }, { data: reviewer }] = await Promise.all([
    admin.from("booking_risk_assessments").select("risk_level, outcome").eq("booking_id", bookingId).maybeSingle(),
    admin.from("users").select("is_clinical_reviewer").eq("id", adminId).maybeSingle(),
  ]);
  if (needsClinicalReview(assessment?.risk_level, assessment?.outcome) && !reviewer?.is_clinical_reviewer) {
    return { ok: false, error: "Only a clinical reviewer can decide nursing or red-risk requests." } as const;
  }
  return { ok: true, adminId, admin, booking } as const;
}

async function recordReview(
  admin: ReturnType<typeof createServiceClient>,
  bookingId: string,
  adminId: string,
  decision: "approved" | "declined" | "more_info_requested",
  input: ReviewInput,
  permittedRoleId: string | null,
) {
  await admin
    .from("booking_risk_assessments")
    .update({
      review_decision: decision,
      review_note: clean(input.reason),
      client_message: clean(input.clientMessage),
      permitted_role_id: permittedRoleId,
      requires_two_workers: !!input.requiresTwoWorkers,
      required_competency: clean(input.requiredCompetency),
      reassess_on: input.reassessOn && /^\d{4}-\d{2}-\d{2}$/.test(input.reassessOn) ? input.reassessOn : null,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("booking_id", bookingId);
  await admin.from("audit_log").insert({
    actor_user_id: adminId,
    actor_type: "admin",
    action: `booking.review_${decision}`,
    entity_type: "booking",
    entity_id: bookingId,
    summary: clean(input.reason),
  });
}

/**
 * Approve and publish a held request, optionally permitting a different
 * professional category (re-priced from that role's active rate card) and
 * adding instructions to the professional's safety brief.
 */
export async function approveBookingReview(bookingId: string, input: ReviewInput): Promise<ReviewActionResult> {
  const g = await guard(bookingId);
  if (!g.ok) return { error: g.error };
  const { adminId, admin, booking } = g;
  if (!clean(input.reason)) return { error: "Please record the reason and any risk-control measures." };
  if (!applyTransition("pending_review", "approve", "admin").ok) return { error: "This request is no longer waiting for review." };
  if (new Date(booking.scheduled_start).getTime() <= Date.now()) {
    return { error: "This request's start time has passed. Decline it so the client can book again." };
  }

  const update: Database["public"]["Tables"]["bookings"]["Update"] = { status: "open" };
  let roleId = booking.professional_role_id;
  if (input.permittedRoleId && input.permittedRoleId !== booking.professional_role_id) {
    const [{ data: oldRole }, { data: newRole }, { data: rate }] = await Promise.all([
      admin.from("professional_roles").select("category_id, country_code").eq("id", booking.professional_role_id).single(),
      admin.from("professional_roles").select("id, code, category_id, country_code, is_active").eq("id", input.permittedRoleId).maybeSingle(),
      admin
        .from("rate_cards")
        .select("id, client_charge_rate, professional_payout_rate, platform_fee_type, platform_fee_value, currency")
        .eq("professional_role_id", input.permittedRoleId)
        .is("effective_to", null)
        .maybeSingle(),
    ]);
    if (!newRole?.is_active || newRole.country_code !== oldRole?.country_code) {
      return { error: "Choose an active professional category in the same country." };
    }
    if (!rate) return { error: "That professional category has no active rate card." };
    const rc: RateCard = {
      id: rate.id,
      client_charge_rate: Number(rate.client_charge_rate),
      professional_payout_rate: Number(rate.professional_payout_rate),
      platform_fee_type: rate.platform_fee_type as RateCard["platform_fee_type"],
      platform_fee_value: rate.platform_fee_value != null ? Number(rate.platform_fee_value) : null,
      currency: rate.currency.trim(),
    };
    Object.assign(update, buildSnapshot(rc), { professional_role_id: newRole.id });
    // A type of care belongs to a category; drop it if the category changed.
    if (newRole.category_id !== oldRole?.category_id) update.care_type_id = null;
    roleId = newRole.id;
    await admin
      .from("booking_risk_assessments")
      .update({ chosen_role_family: roleFamilyOf(newRole.code) })
      .eq("booking_id", bookingId);
  }

  const { data: updated, error } = await admin
    .from("bookings")
    .update(update)
    .eq("id", bookingId)
    .eq("status", "pending_review")
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) return { error: "This request is no longer waiting for review." };

  await Promise.all([
    admin.from("booking_status_history").insert({
      booking_id: bookingId, from_status: "pending_review", to_status: "open", changed_by: adminId, reason: clean(input.reason),
    }),
    recordReview(admin, bookingId, adminId, "approved", input, roleId),
    admin
      .from("booking_safety_briefs")
      .update({
        instructions: [clean(input.professionalInstructions), clean(input.requiredCompetency)].filter(Boolean).join("\n") || null,
        requires_two_workers: !!input.requiresTwoWorkers,
        updated_at: new Date().toISOString(),
      })
      .eq("booking_id", bookingId),
  ]);
  await Promise.all([
    sendNotification("booking_review_approved", booking.requester_user_id, { booking_id: bookingId, note: clean(input.clientMessage) ?? "" }),
    notifyMatchingProfessionals(bookingId, roleId),
  ]);
  revalidatePath("/admin/bookings/review");
  return { ok: true };
}

/** Keep the request held and ask the client for more information. */
export async function requestMoreInformation(bookingId: string, input: ReviewInput): Promise<ReviewActionResult> {
  const g = await guard(bookingId);
  if (!g.ok) return { error: g.error };
  const { adminId, admin, booking } = g;
  if (!clean(input.clientMessage)) return { error: "Please write what you need from the client." };
  await recordReview(admin, bookingId, adminId, "more_info_requested", input, null);
  await sendNotification("booking_review_more_info", booking.requester_user_id, { booking_id: bookingId, note: clean(input.clientMessage) ?? "" });
  revalidatePath("/admin/bookings/review");
  return { ok: true };
}

/** Decline a held request: it is cancelled and the client is told why. */
export async function declineBookingReview(bookingId: string, input: ReviewInput): Promise<ReviewActionResult> {
  const g = await guard(bookingId);
  if (!g.ok) return { error: g.error };
  const { adminId, admin, booking } = g;
  const message = clean(input.clientMessage);
  if (!message) return { error: "Please give the client a reason." };
  if (!applyTransition("pending_review", "cancel", "admin").ok) return { error: "This request is no longer waiting for review." };

  const result = await writeCancelBooking(bookingId, "pending_review", adminId, "admin", false, clean(input.reason) ?? message);
  if ("error" in result) return result;
  await recordReview(admin, bookingId, adminId, "declined", input, null);
  await sendNotification("booking_review_declined", booking.requester_user_id, { booking_id: bookingId, note: message });
  revalidatePath("/admin/bookings/review");
  return { ok: true };
}

/**
 * The safety brief for a booking, read as the signed-in user — row-level
 * security decides who may see it (requester, matching or assigned
 * professional, admins). Every read is written to the audit log.
 */
export async function readSafetyBrief(
  bookingId: string,
): Promise<{ items: string[]; instructions: string | null; requiresTwoWorkers: boolean } | null> {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data } = await supabase
    .from("booking_safety_briefs")
    .select("items, instructions, requires_two_workers")
    .eq("booking_id", bookingId)
    .maybeSingle();
  if (!data) return null;
  await createServiceClient().from("audit_log").insert({
    actor_user_id: user.id,
    actor_type: "user",
    action: "booking.safety_brief_viewed",
    entity_type: "booking",
    entity_id: bookingId,
  });
  return { items: data.items, instructions: data.instructions, requiresTwoWorkers: data.requires_two_workers };
}
