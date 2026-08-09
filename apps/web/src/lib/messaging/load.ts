import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { ThreadSummary } from "@/components/messaging";

/**
 * Conversations visible to one user, newest first.
 *
 * Read with the SERVICE role after resolving which threads the user belongs to,
 * rather than relying on the caller's client: an administrator has to see every
 * thread ("all messages logged"), and a participant only their own, and doing
 * that scoping here keeps both answers in one place.
 */
export async function loadThreads(
  admin: SupabaseClient<Database>,
  userId: string,
  isAdmin: boolean,
): Promise<ThreadSummary[]> {
  let threadIds: string[] | null = null;
  if (!isAdmin) {
    const { data: mine } = await admin
      .from("thread_participants")
      .select("thread_id")
      .eq("user_id", userId);
    threadIds = (mine ?? []).map((row) => row.thread_id);
    if (threadIds.length === 0) return [];
  }

  let threadQuery = admin
    .from("message_threads")
    .select("id, subject, last_message_at")
    .order("last_message_at", { ascending: false })
    .limit(50);
  if (threadIds) threadQuery = threadQuery.in("id", threadIds);

  const { data: threads } = await threadQuery;
  if (!threads?.length) return [];

  const ids = threads.map((t) => t.id);
  const [{ data: participants }, { data: messages }] = await Promise.all([
    admin.from("thread_participants").select("thread_id, user_id").in("thread_id", ids),
    admin
      .from("messages")
      .select("id, thread_id, sender_user_id, body, created_at")
      .in("thread_id", ids)
      .order("created_at"),
  ]);

  const userIds = new Set<string>();
  for (const p of participants ?? []) userIds.add(p.user_id);
  for (const m of messages ?? []) userIds.add(m.sender_user_id);

  const { data: users } = await admin
    .from("users")
    .select("id, email, account_type")
    .in("id", [...userIds]);
  const nameByUser = new Map(
    (users ?? []).map((u) => [u.id, u.account_type === "admin" ? "CareBridge Connect" : u.email]),
  );

  return threads.map((thread) => ({
    id: thread.id,
    subject: thread.subject,
    lastMessageAt: thread.last_message_at,
    participants: [
      ...new Set(
        (participants ?? [])
          .filter((p) => p.thread_id === thread.id)
          .map((p) => nameByUser.get(p.user_id) ?? "Unknown"),
      ),
    ],
    messages: (messages ?? [])
      .filter((m) => m.thread_id === thread.id)
      .map((m) => ({
        id: m.id,
        body: m.body,
        senderName: nameByUser.get(m.sender_user_id) ?? "Unknown",
        isMine: m.sender_user_id === userId,
        createdAt: m.created_at,
      })),
  }));
}
