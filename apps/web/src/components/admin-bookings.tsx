"use client";
import { Tr, usePortalT } from "@/components/portal-locale";
import { TableScroll } from "@/components/table-scroll";
import { AdminTableHeader } from "@/components/admin-table-header";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignBooking, cancelBooking, completeBooking, markNoShow } from "@/lib/bookings/actions";
import { Select } from "@/components/ui/select";
import { useConfirmDialog } from "@/components/ui/app-dialog";

import { formatGbpMoney } from "@/lib/format/money";
import { formatLondon } from "@/lib/format/datetime";

type AdminBooking = {
  id: string;
  status: string;
  booking_type: string;
  scheduled_start: string;
  professional_role_id: string;
  assigned_professional_id: string | null;
  professional_roles: { name: string } | null;
  care_types?: { name: string } | null;
  total_client_charge: number | null;
};

type Professional = {
  id: string;
  full_name: string;
  professional_role_id: string | null;
  /** Every role this professional is currently cleared for. */
  activeRoleIds: string[];
  can_accept_bookings: boolean | null;
};

const TERMINAL = new Set(["completed", "cancelled", "no_show"]);

function formatDate(iso: string) {
  return formatLondon(iso);
}

function formatMoney(amount: number | null) {
  return formatGbpMoney(amount);
}

function AssignControl({
  bookingId,
  roleId,
  professionals,
  onDone,
}: {
  bookingId: string;
  roleId: string;
  professionals: Professional[];
  onDone: () => void;
}) {
  const t = usePortalT();
  const eligible = professionals.filter(
    (p) => p.activeRoleIds.includes(roleId) && !!p.can_accept_bookings,
  );
  const [selected, setSelected] = useState(eligible[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAssign() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    let result: Awaited<ReturnType<typeof assignBooking>>;
    try { result = await assignBooking(bookingId, selected); } catch { setError("Could not complete the operation. Please try again."); return; } finally { setBusy(false); }
    if ("error" in result) setError(result.error);
    else onDone();
  }

  if (eligible.length === 0) {
    return <span className="text-xs text-ink"><Tr>{"No eligible professionals"}</Tr></span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <span role="alert" className="text-xs text-danger"><Tr>{error}</Tr></span>}
      <div className="flex items-center gap-2">
        <Select
          aria-label={t("Assign professional")}
          className="w-48"
          value={selected}
          onValueChange={setSelected}
          options={eligible.map((p) => ({ value: p.id, label: p.full_name }))}
        />
        <button
          type="button"
          onClick={handleAssign}
          disabled={busy || !selected}
          className="rounded-full bg-brand-strong px-3 py-1.5 text-sm text-white hover:bg-brand-strong-hover disabled:opacity-50"
        >
          <Tr>{busy ? "Assigning…" : "Assign"}</Tr>
        </button>
      </div>
    </div>
  );
}

function CancelControl({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const t = usePortalT();
  const { confirm, dialog } = useConfirmDialog();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    if (!(await confirm(t("Cancel this booking?"), { variant: "destructive", confirmLabel: t("Cancel booking") }))) return;
    setBusy(true);
    setError(null);
    let result: Awaited<ReturnType<typeof cancelBooking>>;
    try { result = await cancelBooking(bookingId); } catch { setError("Could not complete the operation. Please try again."); return; } finally { setBusy(false); }
    if ("error" in result) setError(result.error);
    else onDone();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {dialog}
      {error && <span role="alert" className="text-xs text-danger"><Tr>{error}</Tr></span>}
      <button
        type="button"
        onClick={handleCancel}
        disabled={busy}
        className="rounded-full border border-danger px-3 py-1.5 text-sm text-danger hover:bg-[#fff1f1] disabled:opacity-50"
      >
        <Tr>{busy ? "Cancelling…" : "Cancel"}</Tr>
      </button>
    </div>
  );
}

function CompleteControl({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const t = usePortalT();
  const { confirm, dialog } = useConfirmDialog();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    if (!(await confirm(t("Mark this booking as completed?"), { confirmLabel: t("Mark completed") }))) return;
    setBusy(true);
    setError(null);
    let result: Awaited<ReturnType<typeof completeBooking>>;
    try { result = await completeBooking(bookingId); } catch { setError("Could not complete the operation. Please try again."); return; } finally { setBusy(false); }
    if ("error" in result) setError(result.error);
    else onDone();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {dialog}
      {error && <span role="alert" className="text-xs text-danger"><Tr>{error}</Tr></span>}
      <button
        type="button"
        onClick={handleComplete}
        disabled={busy}
        className="rounded-full bg-brand-strong px-3 py-1.5 text-sm text-white hover:bg-brand-strong-hover disabled:opacity-50"
      >
        <Tr>{busy ? "Saving…" : "Mark completed"}</Tr>
      </button>
    </div>
  );
}

function NoShowControl({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const t = usePortalT();
  const { confirm, dialog } = useConfirmDialog();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleNoShow() {
    if (!(await confirm(t("Mark this booking as no-show?"), { confirmLabel: t("Mark no-show") }))) return;
    setBusy(true);
    setError(null);
    let result: Awaited<ReturnType<typeof markNoShow>>;
    try { result = await markNoShow(bookingId); } catch { setError("Could not complete the operation. Please try again."); return; } finally { setBusy(false); }
    if ("error" in result) setError(result.error);
    else onDone();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {dialog}
      {error && <span role="alert" className="text-xs text-danger"><Tr>{error}</Tr></span>}
      <button
        type="button"
        onClick={handleNoShow}
        disabled={busy}
        className="rounded-full border border-line px-4 py-1.5 text-sm font-medium text-brand-ink transition hover:border-line-hover hover:bg-surface disabled:opacity-50"
      >
        <Tr>{busy ? "Saving…" : "No-show"}</Tr>
      </button>
    </div>
  );
}

export function AdminBookings({
  bookings,
  professionals,
}: {
  bookings: AdminBooking[];
  professionals: Professional[];
}) {

  const router = useRouter();

  return (
    <TableScroll className="mt-8 rounded-2xl border border-line shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
      <table className="w-full text-sm">
        <AdminTableHeader>
          <tr>
            <th className="p-3 font-medium"><Tr>{"Date"}</Tr></th>
            <th className="p-3 font-medium"><Tr>{"Role"}</Tr></th>
            <th className="p-3 font-medium"><Tr>{"Type"}</Tr></th>
            <th className="p-3 font-medium"><Tr>{"Status"}</Tr></th>
            <th className="p-3 font-medium"><Tr>{"Total"}</Tr></th>
            <th className="p-3 font-medium"><Tr>{"Actions"}</Tr></th>
          </tr>
        </AdminTableHeader>
        <tbody className="divide-y divide-line">
          {bookings.map((b) => (
            <tr key={b.id}>
              <td className="p-3">{formatDate(b.scheduled_start)}</td>
              <td className="p-3">
                {b.professional_roles?.name ?? b.professional_role_id}
                {b.care_types?.name && (
                  <span className="mt-0.5 block text-xs text-muted">{b.care_types.name}</span>
                )}
              </td>
              <td className="p-3">{b.booking_type.replace(/_/g, " ")}</td>
              <td className="p-3">
                <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-ink">
                  {b.status.replace(/_/g, " ")}
                </span>
              </td>
              <td className="p-3">{formatMoney(b.total_client_charge)}</td>
              <td className="p-3">
                <div className="flex flex-col items-end gap-2">
                  {b.status === "open" && (
                    <AssignControl
                      bookingId={b.id}
                      roleId={b.professional_role_id}
                      professionals={professionals}
                      onDone={() => router.refresh()}
                    />
                  )}
                  {!TERMINAL.has(b.status) && (
                    <>
                      <CompleteControl bookingId={b.id} onDone={() => router.refresh()} />
                      <NoShowControl bookingId={b.id} onDone={() => router.refresh()} />
                      <CancelControl bookingId={b.id} onDone={() => router.refresh()} />
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {bookings.length === 0 && (
        <p className="p-6 text-sm text-ink"><Tr>{"No bookings yet."}</Tr></p>
      )}
    </TableScroll>
  );
}
