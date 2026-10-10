"use client";
import { TableScroll } from "@/components/table-scroll";
import { AdminTableHeader } from "@/components/admin-table-header";

import { usePortalLocale, usePortalT, Tr } from "@/components/portal-locale";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptBooking, declineBooking, completeBooking, undoDecline } from "@/lib/bookings/actions";
import { useConfirmDialog } from "@/components/ui/app-dialog";

import { formatMoney } from "@/lib/format/money";
import { formatLondon } from "@/lib/format/datetime";

type BookingRow = {
  id: string;
  status: string;
  scheduled_start: string;
  scheduled_end: string;
  location_address: string;
  professional_role_id: string;
  assigned_professional_id: string | null;
  total_payout: number | null;
  snap_currency?: string | null;
  care_types?: { name: string } | null;
};

function BookingActions({
  bookingId,
  eligible,
  onDone,
}: {
  bookingId: string;
  eligible: boolean;
  onDone: () => void;
}) {
  const t = usePortalT();
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setBusy("accept");
    setError(null);
    let result: Awaited<ReturnType<typeof acceptBooking>>;
    try { result = await acceptBooking(bookingId); } catch { setError(t("Could not complete the operation. Please try again.")); return; } finally { setBusy(null); }
    if ("error" in result) setError(t(result.error));
    else onDone();
  }

  async function handleDecline() {
    setBusy("decline");
    setError(null);
    let result: Awaited<ReturnType<typeof declineBooking>>;
    try { result = await declineBooking(bookingId); } catch { setError(t("Could not complete the operation. Please try again.")); return; } finally { setBusy(null); }
    if ("error" in result) setError(t(result.error));
    else onDone();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <span role="alert" className="text-xs text-danger"><Tr>{error}</Tr></span>}
      {!eligible && (
        <span className="text-xs text-[#684e1b]">{t("Complete onboarding to accept bookings")}</span>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAccept}
          disabled={!eligible || busy !== null}
          className="rounded-full bg-brand-strong px-3 py-1.5 text-sm text-white hover:bg-brand-strong-hover disabled:opacity-50"
        >
          {busy === "accept" ? t("Accepting…") : t("Accept")}
        </button>
        <button
          type="button"
          onClick={handleDecline}
          disabled={busy !== null}
          className="rounded-full border border-line px-4 py-1.5 text-sm font-medium text-brand-ink transition hover:border-line-hover hover:bg-surface disabled:opacity-50"
        >
          {busy === "decline" ? t("Declining…") : t("Decline")}
        </button>
      </div>
    </div>
  );
}

function UndoDeclineControl({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const t = usePortalT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUndo() {
    setBusy(true);
    setError(null);
    let result: Awaited<ReturnType<typeof undoDecline>>;
    try { result = await undoDecline(bookingId); } catch { setError("Could not complete the operation. Please try again."); return; } finally { setBusy(false); }
    if ("error" in result) setError(t(result.error));
    else onDone();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <span role="alert" className="text-xs text-danger"><Tr>{error}</Tr></span>}
      <button
        type="button"
        onClick={handleUndo}
        disabled={busy}
        className="rounded-full border border-line px-4 py-1.5 text-sm font-medium text-brand-ink transition hover:border-line-hover hover:bg-surface disabled:opacity-50"
      >
        {busy ? t("Restoring…") : t("Undo decline")}
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
    if ("error" in result) setError(t(result.error));
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
        {busy ? t("Saving…") : t("Mark completed")}
      </button>
    </div>
  );
}

function BookingTable({ rows, showActions, showComplete, showUndo, eligible, onRefresh }: {
  rows: BookingRow[];
  showActions?: boolean;
  showComplete?: boolean;
  showUndo?: boolean;
  eligible?: boolean;
  onRefresh: () => void;
}) {
  const t = usePortalT();
  const locale = usePortalLocale();
  if (rows.length === 0) {
    return <p className="mt-3 text-sm text-ink">{t("None.")}</p>;
  }

  const hasActionsCol = showActions || showComplete || showUndo;

  return (
    <TableScroll className="mt-4 rounded-2xl border border-line shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
      <table className="w-full text-sm">
        <AdminTableHeader>
          <tr>
            <th className="p-3 font-medium">{t("Start")}</th>
            <th className="p-3 font-medium">{t("Type of care")}</th>
            <th className="p-3 font-medium">{t("Location")}</th>
            <th className="p-3 font-medium">{t("Status")}</th>
            <th className="p-3 font-medium">{t("Payout")}</th>
            {hasActionsCol && (
              <th scope="col" className="p-3 font-medium"><span className="sr-only">{t("Actions")}</span></th>
            )}
          </tr>
        </AdminTableHeader>
        <tbody className="divide-y divide-line">
          {rows.map((b) => (
            <tr key={b.id}>
              <td className="p-3">{formatLondon(b.scheduled_start, locale)}</td>
              <td className="p-3">{b.care_types?.name ?? "—"}</td>
              <td className="p-3">{b.location_address}</td>
              <td className="p-3">
                <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-ink">
                  {t(b.status.replace(/_/g, " "))}
                </span>
              </td>
              <td className="p-3">{formatMoney(b.total_payout, b.snap_currency ?? "GBP")}</td>
              {hasActionsCol && (
                <td className="p-3 text-right">
                  {showActions && (
                    <BookingActions bookingId={b.id} eligible={!!eligible} onDone={onRefresh} />
                  )}
                  {showComplete && (
                    <CompleteControl bookingId={b.id} onDone={onRefresh} />
                  )}
                  {showUndo && (
                    <UndoDeclineControl bookingId={b.id} onDone={onRefresh} />
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}

export function ProfessionalBookings({
  open,
  mine,
  declined = [],
  eligible,
}: {
  open: BookingRow[];
  mine: BookingRow[];
  declined?: BookingRow[];
  eligible: boolean;
}) {
  const t = usePortalT();
  const router = useRouter();
  const active = mine.filter((b) => !["completed", "cancelled", "no_show"].includes(b.status));
  const history = mine.filter((b) => ["completed", "cancelled", "no_show"].includes(b.status));

  return (
    <div>
      <section>
        <h2 className="text-xl font-bold">{t("Open bookings")}</h2>
        <BookingTable rows={open} showActions eligible={eligible} onRefresh={() => router.refresh()} />
      </section>

      {declined.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold">{t("Declined bookings")}</h2>
          <p className="mt-1 text-sm text-ink">
            {t("Still open for others — undo a decline to offer it to yourself again.")}
          </p>
          <BookingTable rows={declined} showUndo onRefresh={() => router.refresh()} />
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-xl font-bold">{t("My bookings")}</h2>
        <BookingTable rows={active} showComplete onRefresh={() => router.refresh()} />
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">{t("History")}</h2>
        <BookingTable rows={history} onRefresh={() => router.refresh()} />
      </section>
    </div>
  );
}
