"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { registerSchema } from "@/lib/validation/auth";

export type SignUpResult = { ok: true } | { error: string } | null;

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) await supabase.auth.signOut();
  redirect("/login");
}

export async function signUp(_prev: SignUpResult, formData: FormData): Promise<SignUpResult> {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    accountType: formData.get("accountType"),
    acceptedTerms: formData.get("acceptedTerms") === "on",
  });
  if (!parsed.success) return { error: "Please check the form and try again." };

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { account_type: parsed.data.accountType, full_name: parsed.data.fullName },
    },
  });
  if (error) return { error: error.message };

  // Record privacy + terms consent (server-only service client; user isn't signed in yet).
  if (data.user) {
    const admin = createServiceClient();
    await admin.from("consents").insert([
      { user_id: data.user.id, consent_type: "terms_conditions", version: "v1" },
      { user_id: data.user.id, consent_type: "privacy_policy", version: "v1" },
    ]);
  }
  return { ok: true };
}
