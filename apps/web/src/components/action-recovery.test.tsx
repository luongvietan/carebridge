import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PayNowButton } from "./pay-now-button";
import { PortalLocaleProvider } from "./portal-locale";

const mocks = vi.hoisted(() => ({ checkout: vi.fn() }));
vi.mock("@/lib/payments/actions", () => ({ startCheckout: mocks.checkout }));
afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

describe("server action recovery", () => {
  it("restores payment controls and shows a Portuguese error after a thrown action", async () => {
    mocks.checkout.mockRejectedValueOnce(new Error("private provider internals")).mockResolvedValueOnce({ error: "Booking not found." });
    render(<PortalLocaleProvider locale="pt-PT"><PayNowButton bookingId="booking" /></PortalLocaleProvider>);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    await waitFor(() => expect(button).toBeEnabled());
    expect(screen.getByText("Não foi possível concluir a operação. Tente novamente.")).toBeVisible();
    expect(screen.queryByText("private provider internals")).not.toBeInTheDocument();
    fireEvent.click(button);
    await waitFor(() => expect(mocks.checkout).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(button).toBeEnabled());
  });
});
