"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon, MessageQuestionIcon } from "@/components/ui/icon";

type Turn = { role: "user" | "assistant"; content: string };

const COPY = {
  "en-GB": {
    open: "Ask a question",
    title: "CareBridge assistant",
    hint: "Ask about verification, bookings, payments or how to register. Please don't share personal or health details here.",
    greeting: "Hello! How can I help you today?",
    placeholder: "Type your question…",
    send: "Send",
    close: "Close",
    error: "Sorry, something went wrong. Please try again, or use our Contact page.",
    busy: "Too many questions just now. Please try again in a few minutes.",
  },
  "pt-PT": {
    open: "Faça uma pergunta",
    title: "Assistente CareBridge",
    hint: "Pergunte sobre verificação, marcações, pagamentos ou como se registar. Não partilhe aqui dados pessoais nem de saúde.",
    greeting: "Olá! Como posso ajudar?",
    placeholder: "Escreva a sua pergunta…",
    send: "Enviar",
    close: "Fechar",
    error: "Desculpe, ocorreu um erro. Tente novamente ou use a página de Contacto.",
    busy: "Demasiadas perguntas neste momento. Tente novamente dentro de alguns minutos.",
  },
} as const;

/** Areas where a public help bubble has no place: staff tooling and the gate. */
const HIDDEN_ON = ["/admin", "/gate"];

export function AssistantWidget({ locale }: { locale: "en-GB" | "pt-PT" }) {
  const pathname = usePathname();
  const t = COPY[locale];
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [turns, busy, open]);

  if (HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const next: Turn[] = [...turns, { role: "user", content: text }];
    setTurns(next);
    setInput("");
    setNotice(null);
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-12) }),
      });
      if (res.status === 429) {
        setNotice(t.busy);
      } else if (!res.ok) {
        setNotice(t.error);
      } else {
        const data = (await res.json()) as { reply: string };
        setTurns([...next, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setNotice(t.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <section
          role="dialog"
          aria-label={t.title}
          className="flex h-[min(32rem,calc(100vh-7rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[#d8e4dc] bg-white shadow-xl"
        >
          <header className="flex items-center justify-between bg-[#2e7d32] px-4 py-3 text-white">
            <h2 className="text-sm font-semibold">{t.title}</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t.close}
              className="rounded-full px-2 text-lg leading-none hover:bg-white/15"
            >
              ×
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
            <p className="rounded-xl bg-[#f3f7f4] px-3 py-2 text-[#4a4a4a]">{t.greeting}</p>
            <p className="text-xs text-[#7a8a81]">{t.hint}</p>
            {turns.map((m, i) => (
              <p
                key={i}
                className={
                  m.role === "user"
                    ? "ml-8 rounded-xl bg-[#2e7d32] px-3 py-2 text-white"
                    : "mr-8 whitespace-pre-line rounded-xl bg-[#f3f7f4] px-3 py-2 text-[#14301e]"
                }
              >
                {m.content}
              </p>
            ))}
            {busy && <p className="mr-8 rounded-xl bg-[#f3f7f4] px-3 py-2 text-[#7a8a81]">…</p>}
            {notice && (
              <p role="alert" className="text-xs text-[#b3261e]">
                {notice}
              </p>
            )}
          </div>

          <form onSubmit={send} className="flex gap-2 border-t border-[#e3ebe6] p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1000}
              placeholder={t.placeholder}
              aria-label={t.placeholder}
              className="min-w-0 flex-1 rounded-full border border-[#cfdcd3] px-4 py-2 text-sm outline-none focus:border-[#2e7d32]"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-full bg-[#2e7d32] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {t.send}
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t.open}
        className="grid h-14 w-14 place-items-center rounded-full bg-[#2e7d32] text-white shadow-lg transition hover:bg-[#276b2b]"
      >
        <Icon icon={MessageQuestionIcon} size={26} color="#ffffff" strokeWidth={1.75} />
      </button>
    </div>
  );
}
