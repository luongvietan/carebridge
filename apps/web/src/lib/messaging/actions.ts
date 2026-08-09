"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { requireAuth } from "@/lib/auth/require-auth";
import { sendNotification } from "@/lib/notifications/send";

export type MessageResult = { ok: true; threadId?: string } | { error: string };

const MAX_BODY = 4000;

/** Whether this user may post in this thread: a participant, or an admin. */
async function canPost(
  admin: ReturnType<typeof createServiceClient>,
  threadId: string,
  userId: string,
  isAdmin: boolean,
): Promise<boolean> {
  if (isAdmin) return true;
  const { count } = await admin
    .from("thread_participants")
    .select("user_id", { count: "exact", head: true })
    .eq("thread_id", threadId)
    .eq("user_id", userId);
  return (count ?? 0) > 0;
}

/**
 * Start a conversation. Administrators can open one with anybody; everybody else
 * can only open one with CareBridge Connect, which is what a marketplace wants —
 * a professional messaging a client's household directly, outside any booking,
 * is not a feature, it is a safeguarding problem.
 */
export async function startThread(formData: FormData): Promise<MessageResult> {
  const user = await requireAuth();
  const isAdmin = !!(await requireAdmin());
  const admin = createServiceClient();

  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const withUserId = String(formData.get("withUserId") ?? "");
  const bookingId = String(formData.get("bookingId") ?? "") || null;

  if (!subject) return { error: "Give the conversation a subject." };
  if (!body) return { error: "Write a message." };
  if (body.length > MAX_BODY) return { error: "That message is too long." };

  let participants: string[];
  if (isAdmin) {
    if (!withUserId) return { error: "Choose who to message." };
    participants = [user.id, withUserId];
  } else {
    // Route to the administrators rather than to another member.
    const { data: admins } = await admin
      .from("users")
      .select("id")
      .or("account_type.eq.admin,is_founder.eq.true");
    if (!admins?.length) return { error: "No administrator is available to receive messages." };
    participants = [user.id, ...admins.map((a) => a.id)];
  }

  const { data: thread, error } = await admin
    .from("message_threads")
    .insert({ subject, created_by: user.id, booking_id: bookingId })
    .select("id")
    .single();
  if (error || !thread) return { error: error?.message ?? "Could not start the conversation." };

  await admin
    .from("thread_participants")
    .insert([...new Set(participants)].map((id) => ({ thread_id: thread.id, user_id: id })));

  const { error: messageError } = await admin
    .from("messages")
    .insert({ thread_id: thread.id, sender_user_id: user.id, body });
  if (messageError) return { error: messageError.message };

  await admin.from("audit_log").insert({
    actor_user_id: user.id,
    actor_type: isAdmin ? "admin" : "user",
    action: "message.thread_started",
    entity_type: "message_thread",
    entity_id: thread.id,
    summary: subject,
  });

  return { ok: true, threadId: thread.id };
}

export async function postMessage(formData: FormData): Promise<MessageResult> {
  const user = await requireAuth();
  const isAdmin = !!(await requireAdmin());
  const admin = createServiceClient();

  const threadId = String(formData.get("threadId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!threadId) return { error: "Missing conversation." };
  if (!body) return { error: "Write a message." };
  if (body.length > MAX_BODY) return { error: "That message is too long." };

  if (!(await canPost(admin, threadId, user.id, isAdmin))) {
    return { error: "You are not part of this conversation." };
  }

  const { error } = await admin
    .from("messages")
    .insert({ thread_id: threadId, sender_user_id: user.id, body });
  if (error) return { error: error.message };

  await admin
    .from("message_threads")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", threadId);

  // An administrator joining a thread they were not part of becomes a
  // participant, so the other side can see who they are talking to.
  if (isAdmin) {
    await admin
      .from("thread_participants")
      .upsert({ thread_id: threadId, user_id: user.id }, { onConflict: "thread_id,user_id" });
  }

  // Tell the other participants there is something to read.
  const { data: participants } = await admin
    .from("thread_participants")
    .select("user_id")
    .eq("thread_id", threadId)
    .neq("user_id", user.id);
  const { data: thread } = await admin
    .from("message_threads")
    .select("subject")
    .eq("id", threadId)
    .maybeSingle();

  await Promise.all(
    (participants ?? []).map((p) =>
      sendNotification("message_received", p.user_id, {
        subject: thread?.subject ?? "your conversation",
      }),
    ),
  );

  return { ok: true, threadId };
}
