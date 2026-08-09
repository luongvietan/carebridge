import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { requireAuth } from "@/lib/auth/require-auth";
import { createServiceClient } from "@/lib/supabase/service";
import { loadThreads } from "@/lib/messaging/load";
import { StartThreadForm, ThreadList } from "@/components/messaging";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const user = await requireAuth();
  if (!(await requireAdmin())) redirect("/login");

  const admin = createServiceClient();
  const [threads, { data: recipients }] = await Promise.all([
    loadThreads(admin, user.id, true),
    admin
      .from("users")
      .select("id, email, account_type")
      .neq("account_type", "admin")
      .eq("is_active", true)
      .order("email"),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">Messages</h1>
      <p className="mt-2 text-sm text-[#4a4a4a]">
        Conversations with professionals, clients and organisations. Every message is stored and
        visible here, and administrators can read and join any conversation.
      </p>

      <div className="mt-6">
        <StartThreadForm
          recipients={(recipients ?? []).map((r) => ({
            userId: r.id,
            label: `${r.email} (${r.account_type.replace(/_/g, " ")})`,
          }))}
        />
      </div>

      <ThreadList threads={threads} />
    </main>
  );
}
