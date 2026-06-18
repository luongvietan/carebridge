"use client";
import { useActionState } from "react";
import { submitContactMessage, type ContactResult } from "@/lib/contact/actions";

const field =
  "mt-1.5 w-full rounded-xl border border-[#dbe7e0] bg-white px-4 py-2.5 text-sm text-[#14301e] placeholder:text-[#9aa8a0] focus:border-[#2e7d32] focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/15";

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactResult, FormData>(submitContactMessage, null);

  if (state && "ok" in state) {
    return (
      <div className="rounded-3xl border border-[#e7efe9] bg-white p-7 sm:p-8">
        <h2 className="text-xl font-bold text-[#14301e]">Thanks — your message is on its way</h2>
        <p className="mt-2 text-sm text-[#445049]">
          We&apos;ve received your message and will get back to you by email shortly.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-3xl border border-[#e7efe9] bg-white p-7 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-[#33433a]">
          Full name
          <input name="name" required placeholder="Your name" className={field} />
        </label>
        <label className="block text-sm font-medium text-[#33433a]">
          Email
          <input type="email" name="email" required placeholder="you@email.com" className={field} />
        </label>
      </div>
      <label className="mt-4 block text-sm font-medium text-[#33433a]">
        Subject
        <input name="subject" placeholder="How can we help?" className={field} />
      </label>
      <label className="mt-4 block text-sm font-medium text-[#33433a]">
        Message
        <textarea name="message" rows={5} required placeholder="Tell us a little more…" className={field} />
      </label>
      {state && "error" in state && <p className="mt-4 text-sm text-[#da1e28]">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-full bg-[#2e7d32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#246627] disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
