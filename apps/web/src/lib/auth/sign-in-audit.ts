import { createServiceClient } from "@/lib/supabase/service";

export async function recordFailedSignIn(input: {
  email: string; reason: string; ip: string | null; userAgent: string | null; count: number;
}) {
  if (input.count >= 10) return;
  await createServiceClient().from("audit_log").insert({
    actor_type: "user", actor_user_id: null, action: "auth.sign_in_failed", entity_type: "user",
    entity_id: input.email, summary: input.ip ? `${input.reason} · ${input.ip}` : input.reason,
    ip_address: input.ip, user_agent: input.userAgent,
  });
}

export async function recordSuccessfulSignIn(userId: string, email: string) {
  await createServiceClient().from("audit_log").insert({
    actor_user_id: userId, actor_type: "user", action: "auth.signed_in", entity_type: "user",
    entity_id: userId, summary: email,
  });
}
