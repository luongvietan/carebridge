import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ notifications: vi.fn(), rpcError: null as null | { message: string }, rpc: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/require-auth", () => ({ requireAuth: async () => ({ id: "admin" }) }));
vi.mock("@/lib/auth/admin", () => ({ requireAdmin: async () => "admin" }));
vi.mock("@/lib/bookings/notify-matches", () => ({ notifyMatchingProfessionals: state.notifications }));
vi.mock("@/lib/notifications/send", () => ({ sendNotification: state.notifications }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => ({
  rpc: (...args: unknown[]) => { state.rpc(...args); return Promise.resolve({ error: state.rpcError }); },
  from: (table: string) => {
    const data = table === "bookings" ? { status: "pending_review", requester_user_id: "client", professional_role_id: "role", scheduled_start: "2099-01-01" }
      : table === "users" ? { is_clinical_reviewer: true } : { risk_level: "red", outcome: "N" };
    const q = { select: () => q, eq: () => q, update: () => q, insert: () => q,
      maybeSingle: async () => ({ data }), then: (resolve: (value: unknown) => void) => resolve({ data: [{ id: "booking" }], error: null }) };
    return q;
  },
}) }));
import { approveBookingReview, declineBookingReview, requestMoreInformation } from "./actions";
beforeEach(() => { state.rpcError = null; state.notifications.mockClear(); state.rpc.mockClear(); });
it("rejects impossible calendar dates before publishing", async () => {
  expect(await approveBookingReview("booking", { reason: "Reviewed", reassessOn: "2026-02-31" })).toHaveProperty("error");
  expect(state.notifications).not.toHaveBeenCalled();
});
it.each([approveBookingReview, declineBookingReview, requestMoreInformation])("does not notify success when the review transaction fails (%#)", async (action) => {
  state.rpcError = { message: "Review transaction failed" };
  expect(await action("booking", { reason: "Reviewed", clientMessage: "Please contact us" })).toHaveProperty("error");
  expect(state.notifications).not.toHaveBeenCalled();
});
