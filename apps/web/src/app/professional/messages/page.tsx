import { requireAuth } from "@/lib/auth/require-auth";
import { createServiceClient } from "@/lib/supabase/service";
import { loadThreads } from "@/lib/messaging/load";
import { StartThreadForm, ThreadList } from "@/components/messaging";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const user = await requireAuth();
  const threads = await loadThreads(createServiceClient(), user.id, false);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">Messages</h1>
      <p className="mt-2 text-sm text-[#4a4a4a]">
        Your conversations with the CareBridge Connect team. Messages are stored as part of the
        platform record.
      </p>

      <div className="mt-6">
        <StartThreadForm recipients={[]} />
      </div>

      <ThreadList threads={threads} />
    </main>
  );
}
