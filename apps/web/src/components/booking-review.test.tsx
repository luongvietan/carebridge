import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { BookingRequestForm } from "./booking-request-form";

const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/lib/bookings/actions", () => ({ createBooking: mocks.create }));
vi.mock("@/components/ui/select", () => ({ Select: ({ options, onValueChange, ...props }: { options: { value: string; label: string }[]; onValueChange?: (value: string) => void }) => <select {...props} onChange={(e) => onValueChange?.(e.target.value)}><option value="" />{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select> }));
vi.mock("@/components/ui/date-picker", () => ({ DateTimePicker: ({ onValueChange }: { onValueChange: (value: string) => void }) => <input aria-label="Start" onChange={(e) => onValueChange(e.target.value)} /> }));
afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); mocks.create.mockResolvedValue({ ok: true }); });

it("requires a fresh review after edits and creates only on confirmation", async () => {
  render(<BookingRequestForm requesterType="client" roles={[{ id: "role", name: "Nurse", categoryId: "health", category: "Health" }]} />);
  fireEvent.change(screen.getByLabelText("Professional role"), { target: { value: "role" } });
  fireEvent.change(screen.getByLabelText("Start"), { target: { value: "2099-05-10T09:00" } });
  fireEvent.change(screen.getByLabelText("Shift duration"), { target: { value: "2" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Location address" }), { target: { value: "10 Test Street" } });
  fireEvent.click(screen.getByRole("button", { name: "Review booking" }));
  expect(mocks.create).not.toHaveBeenCalled();
  expect(screen.getByRole("region", { name: "Review booking" })).toHaveTextContent("10 Test Street");
  fireEvent.change(screen.getByRole("textbox", { name: "Location address" }), { target: { value: "20 Test Street" } });
  expect(screen.queryByRole("region", { name: "Review booking" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Review booking" }));
  fireEvent.click(screen.getByRole("button", { name: "Create booking" }));
  await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
  expect(mocks.create.mock.calls[0][0]).toMatchObject({ locationAddress: "20 Test Street", scheduledStart: "2099-05-10T08:00:00.000Z" });
  expect(await screen.findByRole("status")).toHaveTextContent("Booking request created");
});
