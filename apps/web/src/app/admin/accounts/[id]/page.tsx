import { getPortalT } from "@/lib/i18n/portal-server";
import { Tr } from "@/components/portal-locale";
import { TableScroll } from "@/components/table-scroll";
import { AdminTableHeader } from "@/components/admin-table-header";
import { BackLink } from "@/components/back-link";
import { organisationCategoryLabel } from "@/lib/accounts/organisation-categories";
import { ForwardLink } from "@/components/forward-link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { formatLondon } from "@/lib/format/datetime";
import { formatMoney } from "@/lib/format/money";

export const dynamic = "force-dynamic";

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-heading">{value || "—"}</dd>
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
  const t = await getPortalT();

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
      .select("id, status, scheduled_start, location_address, total_client_charge, snap_currency, professional_roles(name)")
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
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-10">
      <BackLink href="/admin/accounts" className="text-sm text-brand-strong hover:underline"><Tr>{"All accounts"}</Tr></BackLink>
      <h1 className="mt-2 text-3xl font-bold">
        {org?.organisation_name ?? client?.full_name ?? user.email}
      </h1>
      <p className="mt-1 text-sm text-ink">
        {formatLabel(user.account_type)} · {formatLabel(user.account_status)}
      </p>

      <section className="mt-8 rounded-2xl border border-line bg-white p-6">
        <h2 className="text-lg font-bold"><Tr>{"Profile"}</Tr></h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label={t("Login email")} value={user.email} />
          {client && (
            <>
              <Field label={t("Full name")} value={client.full_name} />
              <Field label={t("Phone")} value={client.phone} />
              <Field label={t("Contact email")} value={client.email_contact} />
              <Field label={t("Address")} value={[client.address_line1, client.address_line2, client.city, client.postcode].filter(Boolean).join(", ")} />
            </>
          )}
          {org && (
            <>
              <Field label={t("Organisation")} value={org.organisation_name} />
              <Field label={t("Contact person")} value={org.contact_person} />
              <Field label={t("Phone")} value={org.phone} />
              <Field label={t("Contact email")} value={org.email_contact} />
              <Field label={t("Market")} value={org.country_code === "PT" ? "Portugal" : "United Kingdom"} />
              {org.country_code === "PT" ? (
                <>
                  <Field label={t("Type of organisation")} value={organisationCategoryLabel(org.organisation_category)} />
                  <Field label={t("NIPC")} value={org.tax_number} />
                  <Field label={t("ERS / ISS licence")} value={org.licence_number} />
                </>
              ) : (
                <Field label={t("CQC number")} value={org.cqc_registration_number} />
              )}
              <Field label={t("Billing email")} value={org.billing_email} />
              <Field label={t("Address")} value={[org.address_line1, org.address_line2, org.city, org.postcode].filter(Boolean).join(", ")} />
            </>
          )}
          {!client && !org && user.account_type === "professional" && (
            <Field label={t("Note")} value="Professionals are managed in the Users section." />
          )}
        </dl>
        {user.account_type === "professional" && (
          <ForwardLink href="/admin/users" className="mt-4 inline-block text-sm text-brand-strong hover:underline"><Tr>{"Open in Users"}</Tr></ForwardLink>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold"><Tr>{"Bookings ("}</Tr>{bookingRows.length})</h2>
        <TableScroll className="mt-3 rounded-2xl border border-line">
          <table className="w-full text-sm">
            <AdminTableHeader>
              <tr>
                <th className="p-3 font-medium"><Tr>{"Start"}</Tr></th>
                <th className="p-3 font-medium"><Tr>{"Role"}</Tr></th>
                <th className="p-3 font-medium"><Tr>{"Status"}</Tr></th>
                <th className="p-3 font-medium"><Tr>{"Location"}</Tr></th>
                <th className="p-3 font-medium"><Tr>{"Charge"}</Tr></th>
              </tr>
            </AdminTableHeader>
            <tbody className="divide-y divide-line">
              {bookingRows.map((b) => (
                <tr key={b.id}>
                  <td className="whitespace-nowrap p-3 text-ink">{formatLondon(b.scheduled_start)}</td>
                  <td className="p-3">{(b.professional_roles as { name: string } | null)?.name ?? "—"}</td>
                  <td className="p-3">{formatLabel(b.status)}</td>
                  <td className="p-3 text-ink">{b.location_address ?? "—"}</td>
                  <td className="p-3">{formatMoney(Number(b.total_client_charge ?? 0), b.snap_currency ?? "GBP")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookingRows.length === 0 && <p className="p-6 text-sm text-ink"><Tr>{"No bookings for this account."}</Tr></p>}
        </TableScroll>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold"><Tr>{"Account history"}</Tr></h2>
        {auditRows.length > 0 ? (
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line text-sm">
            {auditRows.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 p-3">
                <span>
                  <span className="font-medium">{a.action}</span>
                  {a.summary ? <span className="text-ink"> — {a.summary}</span> : null}
                </span>
                <span className="text-muted">{formatLondon(a.occurred_at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink"><Tr>{"No recorded actions on this account."}</Tr></p>
        )}
      </section>
    </main>
  );
}
