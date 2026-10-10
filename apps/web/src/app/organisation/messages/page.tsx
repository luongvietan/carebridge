import { getPortalT } from "@/lib/i18n/portal-server";
import { requireAuth } from "@/lib/auth/require-auth";
import { createServiceClient } from "@/lib/supabase/service";
import { loadThreads } from "@/lib/messaging/load";
import { MessagesPage } from "@/components/messages-page";

export const dynamic = "force-dynamic";

export default async function MessagesRoute() {
  const [{ t }, user] = await Promise.all([
    getPortalT().then((t) => ({ t })),
    requireAuth(),
  ]);
  const threads = await loadThreads(createServiceClient(), user.id, false);

  return <MessagesPage t={t} threads={threads} />;
}
