"use client";
import { useActionState } from "react";
import Link from "next/link";
import { signUp, type SignUpResult } from "@/lib/auth/actions";

const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

export default function RegisterPage() {
  const [state, action, pending] = useActionState<SignUpResult, FormData>(signUp, null);

  if (state && "ok" in state) {
    return (
      <main className="mx-auto max-w-md p-8">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="mt-3 text-slate-600">
          We&apos;ve sent a confirmation link. Confirm your email, then{" "}
          <Link href="/login" className="font-medium underline">
            sign in
          </Link>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <form action={action} className="mt-6 space-y-4">
        <fieldset>
          <legend className="text-sm font-medium">I am a…</legend>
          <div className="mt-2 space-y-1 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="accountType" value="professional" defaultChecked /> Healthcare
              professional
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="accountType" value="private_client" /> Private client
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="accountType" value="organisation" /> Organisation
            </label>
          </div>
        </fieldset>
        <label className="block text-sm font-medium">
          Full name
          <input name="fullName" required className={inputClass} />
        </label>
        <label className="block text-sm font-medium">
          Email
          <input type="email" name="email" required className={inputClass} />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input type="password" name="password" required minLength={8} className={inputClass} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="acceptedTerms" required /> I accept the{" "}
          <Link href="/terms" className="underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
        </label>
        {state && "error" in state && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Already registered?{" "}
        <Link href="/login" className="font-medium underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
