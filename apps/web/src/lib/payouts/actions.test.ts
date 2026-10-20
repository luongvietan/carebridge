import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ inserted: {} as Record<string, unknown> }));
vi.mock("@/lib/auth/require-auth", () => ({ requireAuth: async () => ({ id: "admin" }) }));
vi.mock("@/lib/auth/admin", () => ({ requireAdmin: async () => "admin" }));
vi.mock("@/lib/notifications/send", () => ({ sendNotification: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => ({ from: (table: string) => {
  const data = table === "bookings" ? { id: "booking", status: "completed", assigned_professional_id: "pro", total_payout: 83, requires_timesheet: true, snap_currency: "EUR" }
    : table === "timesheets" ? { status: "confirmed" }
    : table === "payments" ? [{ status: "succeeded", refunded_at: null, refunded_amount: 0 }] : null;
  const query = {
    select: () => query, eq: () => query,
    single: async () => ({ data }), maybeSingle: async () => ({ data }),
    insert: async (row: Record<string, unknown>) => { if (table === "payouts") state.inserted = row; return { error: null }; },
    then: (resolve: (value: unknown) => void) => resolve({ data, count: 0, error: null }),
  };
  return query;
} }) }));
import { recordPayout } from "./actions";
beforeEach(() => { state.inserted = {}; });
it("records a Portugal payout in the booking's EUR currency", async () => {
  expect(await recordPayout("booking")).toEqual({ ok: true });
  expect(state.inserted).toMatchObject({ amount: 83, currency: "EUR", status: "recorded" });
});
