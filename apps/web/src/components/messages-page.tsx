import { StartThreadForm, ThreadList } from "@/components/messaging";
import type { T } from "@/lib/i18n/portal";

export function MessagesPage({ t, threads }: { t: T; threads: Parameters<typeof ThreadList>[0]["threads"] }) {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">{t("Messages")}</h1>
      <p className="mt-2 text-sm text-ink">
        {t("Your conversations with the CareBridge Connect team. Messages are stored as part of the platform record.")}
      </p>
      <div className="mt-6"><StartThreadForm recipients={[]} /></div>
      <ThreadList threads={threads} />
    </main>
  );
}
