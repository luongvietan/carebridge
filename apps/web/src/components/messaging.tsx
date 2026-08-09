"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { postMessage, startThread } from "@/lib/messaging/actions";
import { formatLondon } from "@/lib/format/datetime";

const field =
  "mt-1 w-full rounded-xl border border-[#dbe7e0] bg-white px-3 py-2 text-sm text-[#1e5a33] focus:border-[#2e7d32] focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/15";

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
    const result = await startThread(fd);
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-[#2e7d32] px-4 py-2 text-sm text-white hover:bg-[#246627]"
      >
        New message
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 rounded-2xl border border-[#dbe7e0] p-4">
      {recipients.length > 0 ? (
        <div className="text-sm font-medium">
          To
          <Select
            name="withUserId"
            aria-label="Recipient"
            required
            value={withUserId}
            onValueChange={setWithUserId}
            placeholder="Choose who to message…"
            className="mt-1"
            options={recipients.map((r) => ({ value: r.userId, label: r.label }))}
          />
        </div>
      ) : (
        <p className="text-sm text-[#4a4a4a]">
          Your message goes to the CareBridge Connect team.
        </p>
      )}

      <label className="mt-3 block text-sm font-medium">
        Subject
        <input name="subject" required className={field} />
      </label>
      <label className="mt-3 block text-sm font-medium">
        Message
        <textarea name="body" required rows={4} className={field} />
      </label>

      {error && <p className="mt-2 text-sm text-[#da1e28]">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-[#2e7d32] px-4 py-2 text-sm text-white hover:bg-[#246627] disabled:opacity-50"
        >
          {busy ? "Sending…" : "Send"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-[#dbe7e0] px-4 py-2 text-sm text-[#4a4a4a] hover:bg-[#f5f7f6]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function ThreadList({ threads }: { threads: ThreadSummary[] }) {
  if (threads.length === 0) {
    return <p className="mt-4 text-sm text-[#4a4a4a]">No conversations yet.</p>;
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
    const result = await postMessage(fd);
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <li className="rounded-2xl border border-[#dbe7e0] p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-baseline justify-between gap-2 text-left"
      >
        <span>
          <span className="font-semibold">{thread.subject}</span>
          <span className="ml-2 text-xs text-[#7a8a81]">{thread.participants.join(", ")}</span>
        </span>
        <span className="text-xs text-[#7a8a81]">
          {formatLondon(thread.lastMessageAt)} · {thread.messages.length} message
          {thread.messages.length === 1 ? "" : "s"}
        </span>
      </button>

      {!open && latest && (
        <p className="mt-2 truncate text-sm text-[#4a4a4a]">
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
                  message.isMine ? "bg-[#f2fbf5]" : "bg-[#f5f7f6]"
                }`}
              >
                <p className="text-xs text-[#7a8a81]">
                  {message.senderName} · {formatLondon(message.createdAt)}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[#1e5a33]">{message.body}</p>
              </li>
            ))}
          </ul>

          <form onSubmit={onReply} className="mt-3">
            <textarea name="body" required rows={3} className={field} placeholder="Write a reply…" />
            {error && <p className="mt-2 text-sm text-[#da1e28]">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="mt-2 rounded-full bg-[#2e7d32] px-4 py-2 text-sm text-white hover:bg-[#246627] disabled:opacity-50"
            >
              {busy ? "Sending…" : "Reply"}
            </button>
          </form>
        </>
      )}
    </li>
  );
}
