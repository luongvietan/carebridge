"use client";

import { RequiredMark } from "@/components/required-mark";
import { usePortalLocale, usePortalT, Tr } from "@/components/portal-locale";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { postMessage, startThread } from "@/lib/messaging/actions";
import { formatLondon } from "@/lib/format/datetime";

const field =
  "mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-brand-ink focus:border-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-strong/15";

export type ThreadSummary = {
  id: string;
  subject: string;
  lastMessageAt: string;
  participants: string[];
  messages: { id: string; body: string; senderName: string; isMine: boolean; createdAt: string }[];
};

export function StartThreadForm({
  recipients,
}: {
  /** Empty for non-admins: they can only message CareBridge Connect. */
  recipients: { userId: string; label: string }[];
}) {
  const t = usePortalT();
  const locale = usePortalLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [withUserId, setWithUserId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (recipients.length > 0) fd.set("withUserId", withUserId);
    try {
      const result = await startThread(fd);
      if ("error" in result) {
        setError(t(result.error));
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError(locale === "pt-PT" ? "Não foi possível concluir a operação. Tente novamente." : "Could not complete the operation. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-brand-strong px-4 py-2 text-sm text-white hover:bg-brand-strong-hover"
      >
        {t("New message")}
      </button>
    );
  }

  return (
    <form aria-busy={busy} onSubmit={onSubmit} className="mt-4 rounded-2xl border border-line p-4">
      {recipients.length > 0 ? (
        <div className="text-sm font-medium">
          {t("To")}
          <Select
            name="withUserId"
            aria-label={t("Recipient")}
            required
            value={withUserId}
            onValueChange={setWithUserId}
            placeholder={t("Choose who to message…")}
            className="mt-1"
            options={recipients.map((r) => ({ value: r.userId, label: r.label }))}
          />
        </div>
      ) : (
        <p className="text-sm text-ink">
          {t("Your message goes to the CareBridge Connect team.")}
        </p>
      )}

      <label className="mt-3 block text-sm font-medium">
        {t("Subject")}
        <RequiredMark /><input name="subject" required className={field} />
      </label>
      <label className="mt-3 block text-sm font-medium">
        {t("Message")}
        <RequiredMark /><textarea name="body" required rows={4} className={field} />
      </label>

      {error && <p role="alert" className="mt-2 text-sm text-danger"><Tr>{error}</Tr></p>}

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-brand-strong px-4 py-2 text-sm text-white hover:bg-brand-strong-hover disabled:opacity-50"
        >
          {busy ? t("Sending…") : t("Send")}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:bg-surface"
        >
          {t("Cancel")}
        </button>
      </div>
    </form>
  );
}

export function ThreadList({ threads }: { threads: ThreadSummary[] }) {
  const t = usePortalT();
  if (threads.length === 0) {
    return <p className="mt-4 text-sm text-ink">{t("No conversations yet.")}</p>;
  }
  return (
    <ul className="mt-4 space-y-4">
      {threads.map((thread) => (
        <Thread key={thread.id} thread={thread} />
      ))}
    </ul>
  );
}

function Thread({ thread }: { thread: ThreadSummary }) {
  const t = usePortalT();
  const locale = usePortalLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latest = thread.messages.at(-1);

  async function onReply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setError(null);
    const fd = new FormData(form);
    fd.set("threadId", thread.id);
    try {
      const result = await postMessage(fd);
      if ("error" in result) {
        setError(t(result.error));
        return;
      }
      form.reset();
      router.refresh();
    } catch {
      setError(locale === "pt-PT" ? "Não foi possível concluir a operação. Tente novamente." : "Could not complete the operation. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-2xl border border-line p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-baseline justify-between gap-2 text-left"
      >
        <span>
          <span className="font-semibold">{thread.subject}</span>
          <span className="ml-2 text-xs text-muted">{thread.participants.join(", ")}</span>
        </span>
        <span className="text-xs text-muted">
          {formatLondon(thread.lastMessageAt, locale)} · {thread.messages.length === 1 ? t("1 message") : t("{n} messages", { n: thread.messages.length })}
        </span>
      </button>

      {!open && latest && (
        <p className="mt-2 truncate text-sm text-ink">
          {latest.senderName}: {latest.body}
        </p>
      )}

      {open && (
        <>
          <ul className="mt-3 space-y-3">
            {thread.messages.map((message) => (
              <li
                key={message.id}
                className={`rounded-xl p-3 text-sm ${
                  message.isMine ? "bg-[#f2fbf5]" : "bg-surface"
                }`}
              >
                <p className="text-xs text-muted">
                  {message.senderName} · {formatLondon(message.createdAt, locale)}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-brand-ink">{message.body}</p>
              </li>
            ))}
          </ul>

          <form aria-busy={busy} onSubmit={onReply} className="mt-3">
            <textarea name="body" required rows={3} className={field} placeholder={t("Write a reply…")} />
            {error && <p role="alert" className="mt-2 text-sm text-danger"><Tr>{error}</Tr></p>}
            <button
              type="submit"
              disabled={busy}
              className="mt-2 rounded-full bg-brand-strong px-4 py-2 text-sm text-white hover:bg-brand-strong-hover disabled:opacity-50"
            >
              {busy ? t("Sending…") : t("Reply")}
            </button>
          </form>
        </>
      )}
    </li>
  );
}
