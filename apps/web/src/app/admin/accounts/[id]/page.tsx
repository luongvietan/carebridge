import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { formatLondon } from "@/lib/format/datetime";
import { formatGbpMoney } from "@/lib/format/money";

export const dynamic = "force-dynamic";

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-[#9aa8a0]">{label}</dt>
      <dd className="mt-0.5 text-sm text-[#14301e]">{value || "—"}</dd>
    </div>
  );
}

/**
 * Spec §9 — admin detail view for a client or organisation account: profile,
 * their bookings, and the audit history of admin actions on the account.
 * (Professionals have their own richer detail page at /admin/users/[id].)
 */
export default async function AdminAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await requireAdmin())) redirect("/login");
  const { id } = await params;
  const admin = createServiceClient();

  const { data: user } = await admin
    .from("users")
    .select("id, email, account_type, account_status, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!user) notFound();

  const [{ data: client }, { data: org }, { data: bookings }, { data: audit }] = await Promise.all([
    user.account_type === "private_client"
      ? admin.from("private_clients").select("*").eq("user_id", id).maybeSingle()
      : Promise.resolve({ data: null }),
    user.account_type === "organisation"
      ? admin.from("organisations").select("*").eq("user_id", id).maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from("bookings")
      .select("id, status, scheduled_start, location_address, total_client_charge, professional_roles(name)")
      .eq("requester_user_id", id)
      .order("scheduled_start", { ascending: false })
      .limit(50),
    admin
      .from("audit_log")
      .select("id, occurred_at, actor_type, action, summary")
      .eq("entity_id", id)
      .order("occurred_at", { ascending: false })
      .limit(50),
  ]);

  const bookingRows = bookings ?? [];
  const auditRows = audit ?? [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/admin/accounts" className="text-sm text-[#2e7d32] hover:underline">
        ← All accounts
      </Link>
      <h1 className="mt-2 text-3xl font-bold">
        {org?.organisation_name ?? client?.full_name ?? user.email}
      </h1>
      <p className="mt-1 text-sm text-[#5b6a62]">
        {formatLabel(user.account_type)} · {formatLabel(user.account_status)}
      </p>

      <section className="mt-8 rounded-2xl border border-[#dbe7e0] bg-white p-6">
        <h2 className="text-lg font-bold">Profile</h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Login email" value={user.email} />
          {client && (
            <>
              <Field label="Full name" value={client.full_name} />
              <Field label="Phone" value={client.phone} />
              <Field label="Contact email" value={client.email_contact} />
              <Field label="Address" value={[client.address_line1, client.address_line2, client.city, client.postcode].filter(Boolean).join(", ")} />
            </>
          )}
          {org && (
            <>
              <Field label="Organisation" value={org.organisation_name} />
              <Field label="Contact person" value={org.contact_person} />
              <Field label="Phone" value={org.phone} />
              <Field label="Contact email" value={org.email_contact} />
              <Field label="CQC number" value={org.cqc_registration_number} />
              <Field label="Billing email" value={org.billing_email} />
              <Field label="Address" value={[org.address_line1, org.address_line2, org.city, org.postcode].filter(Boolean).join(", ")} />
            </>
          )}
          {!client && !org && user.account_type === "professional" && (
            <Field label="Note" value="Professionals are managed in the Users section." />
          )}
        </dl>
        {user.account_type === "professional" && (
          <Link href="/admin/users" className="mt-4 inline-block text-sm text-[#2e7d32] hover:underline">
            Open in Users →
          </Link>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Bookings ({bookingRows.length})</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-[#dbe7e0]">
          <table className="w-full text-sm">
            <thead className="border-b border-[#dbe7e0] bg-[#f5f7f6] text-left text-[#5b6a62]">
              <tr>
                <th className="p-3 font-medium">Start</th>
                <th className="p-3 font-medium">Role</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Location</th>
                <th className="p-3 font-medium">Charge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dbe7e0]">
              {bookingRows.map((b) => (
                <tr key={b.id}>
                  <td className="whitespace-nowrap p-3 text-[#5b6a62]">{formatLondon(b.scheduled_start)}</td>
                  <td className="p-3">{(b.professional_roles as { name: string } | null)?.name ?? "—"}</td>
                  <td className="p-3">{formatLabel(b.status)}</td>
                  <td className="p-3 text-[#5b6a62]">{b.location_address ?? "—"}</td>
                  <td className="p-3">{formatGbpMoney(Number(b.total_client_charge ?? 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookingRows.length === 0 && <p className="p-6 text-sm text-[#5b6a62]">No bookings for this account.</p>}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Account history</h2>
        {auditRows.length > 0 ? (
          <ul className="mt-3 divide-y divide-[#dbe7e0] rounded-2xl border border-[#dbe7e0] text-sm">
            {auditRows.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 p-3">
                <span>
                  <span className="font-medium">{a.action}</span>
                  {a.summary ? <span className="text-[#5b6a62]"> — {a.summary}</span> : null}
                </span>
                <span className="text-[#9aa8a0]">{formatLondon(a.occurred_at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[#5b6a62]">No recorded actions on this account.</p>
        )}
      </section>
    </main>
  );
}
