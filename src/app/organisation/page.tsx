import { createClient } from "@/lib/supabase/server";

export default async function OrganisationHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-bold">Organisation dashboard</h1>
      <p className="mt-2 text-slate-600">Signed in as {user?.email}.</p>
      <p className="mt-4 text-sm text-slate-500">Booking requests arrive in a later subsystem.</p>
    </main>
  );
}
