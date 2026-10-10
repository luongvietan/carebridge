import { Tr } from "@/components/portal-locale";
import { TableScroll } from "@/components/table-scroll";
import { AdminTableHeader } from "@/components/admin-table-header";
import { redirect } from "next/navigation";
import { AmendRateForm } from "@/components/amend-rate-form";
import { requireAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { formatRate } from "@/lib/format/money";

export const dynamic = "force-dynamic";

type RateCardRow = {
  id: string;
  professional_role_id: string;
  client_charge_rate: number;
  professional_payout_rate: number;
  platform_fee_type: string;
  platform_fee_value: number | null;
  currency: string;
  effective_from: string;
  effective_to: string | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function formatFeeType(
  type: string,
  value: number | null,
  charge: number,
  payout: number,
  currency: string,
) {
  if (type === "derived") {
    return `Derived (${formatRate(charge - payout, currency)})`;
  }
  if (type === "percentage" && value != null) {
    return `${value}%`;
  }
  if (type === "fixed" && value != null) {
    return `${formatRate(value, currency)}/hr`;
  }
  return formatLabel(type);
}

export default async function AdminRatesPage() {
  if (!(await requireAdmin())) redirect("/login");

  const admin = createServiceClient();

  const [{ data: roles }, { data: allCards }] = await Promise.all([
    admin.from("professional_roles").select("id, name, country_code").eq("is_active", true).order("name"),
    admin
      .from("rate_cards")
      .select(
        "id, professional_role_id, client_charge_rate, professional_payout_rate, platform_fee_type, platform_fee_value, currency, effective_from, effective_to",
      )
      .order("effective_from", { ascending: false }),
  ]);

  const roleIds = new Set((roles ?? []).map((role) => role.id));

  const cardsByRole = new Map<string, RateCardRow[]>();
  for (const card of (allCards ?? []) as RateCardRow[]) {
    if (!roleIds.has(card.professional_role_id)) continue;
    const list = cardsByRole.get(card.professional_role_id) ?? [];
    list.push(card);
    cardsByRole.set(card.professional_role_id, list);
  }

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold"><Tr>{"Rate cards"}</Tr></h1>
      <p className="mt-2 text-sm text-ink"><Tr>{"View effective-dated rates per role and amend the active card. Existing bookings keep their snapshotted rates."}</Tr></p>

      <div className="mt-10 space-y-12">
        {(roles ?? []).map((role) => {
          const history = cardsByRole.get(role.id) ?? [];
          const active = history.find((card) => card.effective_to === null) ?? null;

          return (
            <section key={role.id} className="rounded-2xl border border-line bg-white p-6 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
              <h2 className="text-xl font-bold">{role.name}</h2>

              {active ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs tracking-wide text-ink uppercase"><Tr>{"Client charge"}</Tr></p>
                    <p className="mt-1 text-lg font-bold">
                      {formatRate(active.client_charge_rate, active.currency)}<Tr>{"/hr"}</Tr></p>
                  </div>
                  <div>
                    <p className="text-xs tracking-wide text-ink uppercase"><Tr>{"Payout"}</Tr></p>
                    <p className="mt-1 text-lg font-bold">
                      {formatRate(active.professional_payout_rate, active.currency)}<Tr>{"/hr"}</Tr></p>
                  </div>
                  <div>
                    <p className="text-xs tracking-wide text-ink uppercase"><Tr>{"Platform fee"}</Tr></p>
                    <p className="mt-1 text-lg font-bold">
                      {formatFeeType(
                        active.platform_fee_type,
                        active.platform_fee_value,
                        active.client_charge_rate,
                        active.professional_payout_rate,
                        active.currency,
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs tracking-wide text-ink uppercase"><Tr>{"Effective from"}</Tr></p>
                    <p className="mt-1 text-sm text-ink">{formatDate(active.effective_from)}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-ink"><Tr>{"No active rate card for this role."}</Tr></p>
              )}

              {history.length > 0 && (
                <TableScroll className="mt-6 rounded-2xl border border-line shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
                  <table className="w-full text-sm">
                    <AdminTableHeader>
                      <tr>
                        <th className="p-3 font-medium"><Tr>{"Effective from"}</Tr></th>
                        <th className="p-3 font-medium"><Tr>{"Effective to"}</Tr></th>
                        <th className="p-3 font-medium"><Tr>{"Client charge"}</Tr></th>
                        <th className="p-3 font-medium"><Tr>{"Payout"}</Tr></th>
                        <th className="p-3 font-medium"><Tr>{"Fee"}</Tr></th>
                        <th className="p-3 font-medium"><Tr>{"Status"}</Tr></th>
                      </tr>
                    </AdminTableHeader>
                    <tbody className="divide-y divide-line">
                      {history.map((card) => (
                        <tr key={card.id}>
                          <td className="p-3">{formatDate(card.effective_from)}</td>
                          <td className="p-3">
                            {card.effective_to ? formatDate(card.effective_to) : "—"}
                          </td>
                          <td className="p-3">
                            {formatRate(card.client_charge_rate, card.currency)}<Tr>{"/hr"}</Tr></td>
                          <td className="p-3">
                            {formatRate(card.professional_payout_rate, card.currency)}<Tr>{"/hr"}</Tr></td>
                          <td className="p-3">
                            {formatFeeType(
                              card.platform_fee_type,
                              card.platform_fee_value,
                              card.client_charge_rate,
                              card.professional_payout_rate,
                              card.currency,
                            )}
                          </td>
                          <td className="p-3">
                            <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-ink">
                              <Tr>{card.effective_to === null ? "Active" : "Closed"}</Tr>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
              )}

              <div className="mt-6 border-t border-line pt-6">
                <AmendRateForm
                  roleId={role.id}
                  roleName={role.name}
                  defaultCurrency={role.country_code === "PT" ? "EUR" : "GBP"}
                />
              </div>
            </section>
          );
        })}

        {(roles ?? []).length === 0 && (
          <p className="text-sm text-ink"><Tr>{"No active professional roles found."}</Tr></p>
        )}
      </div>
    </main>
  );
}
