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

function formatFeeType(type: string, value: number | null, charge: number, payout: number) {
  if (type === "derived") {
    return `Derived (${formatRate(charge - payout, "GBP")})`;
  }
  if (type === "percentage" && value != null) {
    return `${value}%`;
  }
  if (type === "fixed" && value != null) {
    return `${formatRate(value, "GBP")}/hr`;
  }
  return formatLabel(type);
}

export default async function AdminRatesPage() {
  if (!(await requireAdmin())) redirect("/login");

  const admin = createServiceClient();

  const [{ data: roles }, { data: allCards }] = await Promise.all([
    admin.from("professional_roles").select("id, name").eq("is_active", true).order("name"),
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
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">Rate cards</h1>
      <p className="mt-2 text-sm text-[#5b6a62]">
        View effective-dated rates per role and amend the active card. Existing bookings keep their
        snapshotted rates.
      </p>

      <div className="mt-10 space-y-12">
        {(roles ?? []).map((role) => {
          const history = cardsByRole.get(role.id) ?? [];
          const active = history.find((card) => card.effective_to === null) ?? null;

          return (
            <section key={role.id} className="rounded-2xl border border-[#dbe7e0] bg-white p-6 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
              <h2 className="text-xl font-bold">{role.name}</h2>

              {active ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs tracking-wide text-[#5b6a62] uppercase">Client charge</p>
                    <p className="mt-1 text-lg font-bold">
                      {formatRate(active.client_charge_rate, active.currency)}/hr
                    </p>
                  </div>
                  <div>
                    <p className="text-xs tracking-wide text-[#5b6a62] uppercase">Payout</p>
                    <p className="mt-1 text-lg font-bold">
                      {formatRate(active.professional_payout_rate, active.currency)}/hr
                    </p>
                  </div>
                  <div>
                    <p className="text-xs tracking-wide text-[#5b6a62] uppercase">Platform fee</p>
                    <p className="mt-1 text-lg font-bold">
                      {formatFeeType(
                        active.platform_fee_type,
                        active.platform_fee_value,
                        active.client_charge_rate,
                        active.professional_payout_rate,
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs tracking-wide text-[#5b6a62] uppercase">Effective from</p>
                    <p className="mt-1 text-sm text-[#5b6a62]">{formatDate(active.effective_from)}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-[#5b6a62]">No active rate card for this role.</p>
              )}

              {history.length > 0 && (
                <div className="mt-6 overflow-x-auto rounded-2xl border border-[#dbe7e0] shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
                  <table className="w-full text-sm">
                    <thead className="border-b border-[#dbe7e0] bg-[#f5f7f6] text-left text-[#5b6a62]">
                      <tr>
                        <th className="p-3 font-medium">Effective from</th>
                        <th className="p-3 font-medium">Effective to</th>
                        <th className="p-3 font-medium">Client charge</th>
                        <th className="p-3 font-medium">Payout</th>
                        <th className="p-3 font-medium">Fee</th>
                        <th className="p-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dbe7e0]">
                      {history.map((card) => (
                        <tr key={card.id}>
                          <td className="p-3">{formatDate(card.effective_from)}</td>
                          <td className="p-3">
                            {card.effective_to ? formatDate(card.effective_to) : "—"}
                          </td>
                          <td className="p-3">
                            {formatRate(card.client_charge_rate, card.currency)}/hr
                          </td>
                          <td className="p-3">
                            {formatRate(card.professional_payout_rate, card.currency)}/hr
                          </td>
                          <td className="p-3">
                            {formatFeeType(
                              card.platform_fee_type,
                              card.platform_fee_value,
                              card.client_charge_rate,
                              card.professional_payout_rate,
                            )}
                          </td>
                          <td className="p-3">
                            <span className="rounded-full bg-[#f5f7f6] px-2.5 py-0.5 text-xs font-medium text-[#5b6a62]">
                              {card.effective_to === null ? "Active" : "Closed"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-6 border-t border-[#dbe7e0] pt-6">
                <AmendRateForm roleId={role.id} roleName={role.name} />
              </div>
            </section>
          );
        })}

        {(roles ?? []).length === 0 && (
          <p className="text-sm text-[#5b6a62]">No active professional roles found.</p>
        )}
      </div>
    </main>
  );
}
