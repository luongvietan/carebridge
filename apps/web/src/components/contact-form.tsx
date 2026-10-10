"use client";
import { RequiredMark } from "@/components/required-mark";
import { makeT, type PortalLocale } from "@/lib/i18n/portal";
import { useActionState } from "react";
import { submitContactMessage, type ContactResult } from "@/lib/contact/actions";

const field =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-heading placeholder:text-muted focus:border-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-strong/15";

type ContactFormLabels = {
  thanksTitle: string;
  thanksBody: string;
  name: string;
  namePlaceholder: string;
  email: string;
  subject: string;
  subjectPlaceholder: string;
  message: string;
  messagePlaceholder: string;
  send: string;
  sending: string;
};

export function ContactForm({ labels, locale = "en-GB" }: { labels: ContactFormLabels; locale?: PortalLocale }) {
  const t = makeT(locale);
  const [state, action, pending] = useActionState<ContactResult, FormData>(submitContactMessage, null);

  if (state && "ok" in state) {
    return (
      <div role="status" className="rounded-3xl border border-[#e7efe9] bg-white p-7 sm:p-8">
        <h2 className="text-xl font-bold text-heading">{labels.thanksTitle}</h2>
        <p className="mt-2 text-sm text-ink">
          {labels.thanksBody}
        </p>
        <p className="mt-2 text-sm text-ink">
          {state.locale === "pt-PT"
            ? state.acknowledgement === "sent" ? "O email de confirmação foi aceite para envio." : "A mensagem está guardada. Não foi enviado um novo email de confirmação."
            : state.acknowledgement === "sent" ? "Your acknowledgement email was accepted for sending." : "Your message is saved. No new acknowledgement email was sent."}
        </p>
      </div>
    );
  }

  return (
    <form action={action} aria-busy={pending} className="rounded-3xl border border-[#e7efe9] bg-white p-7 sm:p-8">
      <div hidden aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-[#33433a]">
          {labels.name}
          <RequiredMark /><input name="name" required placeholder={labels.namePlaceholder} className={field} />
        </label>
        <label className="block text-sm font-medium text-[#33433a]">
          {labels.email}
          <RequiredMark /><input type="email" name="email" required placeholder="you@email.com" className={field} />
        </label>
      </div>
      <label className="mt-4 block text-sm font-medium text-[#33433a]">
        {labels.subject}
        <input name="subject" placeholder={labels.subjectPlaceholder} className={field} />
      </label>
      <label className="mt-4 block text-sm font-medium text-[#33433a]">
        {labels.message}
        <RequiredMark /><textarea name="message" rows={5} required placeholder={labels.messagePlaceholder} className={field} />
      </label>
      {state && "error" in state && <p role="alert" className="mt-4 text-sm text-danger">{t(state.error)}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-full bg-brand-strong px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-strong-hover disabled:opacity-50"
      >
        {pending ? labels.sending : labels.send}
      </button>
    </form>
  );
}
