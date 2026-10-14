import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { BookingRequestForm } from "./booking-request-form";
import { EMERGENCY_QUESTIONS, QUESTIONS, RESPONDENT_OPTIONS } from "@/lib/risk-assessment/questionnaire";

const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/lib/bookings/actions", () => ({ createBooking: mocks.create }));
vi.mock("@/components/ui/select", () => ({ Select: ({ options, onValueChange, value, ...props }: { options: { value: string; label: string }[]; value?: string; onValueChange?: (value: string) => void }) => <select {...props} value={value} onChange={(e) => onValueChange?.(e.target.value)}><option value="" />{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select> }));
vi.mock("@/components/ui/date-picker", () => ({ DateTimePicker: ({ onValueChange }: { onValueChange: (value: string) => void }) => <input aria-label="Start" onChange={(e) => onValueChange(e.target.value)} /> }));
afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); mocks.create.mockResolvedValue({ ok: true, id: "b1", underReview: true }); });

const roles = [
  { id: "support", code: "pt_auxiliar_saude", name: "Auxiliar", categoryId: "health", category: "Saúde" },
  { id: "nurse", code: "pt_enfermeiro_adulto", name: "Enfermeiro", categoryId: "health", category: "Saúde" },
];

function pick(legend: string, label: string) {
  fireEvent.click(within(screen.getByRole("group", { name: legend })).getByLabelText(label));
}

function answerAll(answers: Record<string, string>) {
  pick("Who is completing this assessment?", RESPONDENT_OPTIONS[1].label.en);
  for (const q of EMERGENCY_QUESTIONS) pick(q.label.en, "No");
  for (const q of QUESTIONS) pick(q.label.en, q.options.find((o) => o.id === (answers[q.id] ?? q.options[0].id))!.label.en);
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "See recommendation" }));
}

it("stops at an emergency answer and points to the emergency number", () => {
  render(<BookingRequestForm requesterType="client" roles={roles} emergencyNumber="112" />);
  pick(EMERGENCY_QUESTIONS[2].label.en, "Yes");
  expect(screen.getByRole("heading", { name: "Call the emergency services now" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Call 112" })).toHaveAttribute("href", "tel:112");
  expect(mocks.create).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: /go back/ }));
  expect(screen.getByRole("heading", { name: "Risk and needs assessment" })).toBeInTheDocument();
});

it("asks for every answer and for consent", () => {
  render(<BookingRequestForm requesterType="client" roles={roles} emergencyNumber="112" />);
  fireEvent.click(screen.getByRole("button", { name: "See recommendation" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Please answer every question.");
});

it("recommends a nurse, pre-selects it, and sends the assessment with the booking", async () => {
  render(<BookingRequestForm requesterType="client" roles={roles} emergencyNumber="112" />);
  answerAll({ support_type: "clinical", behaviour: "often" });
  expect(screen.getByText("Nurse (adult)")).toBeInTheDocument();
  expect(screen.getByText(/our team will review your request/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Continue to booking details" }));

  expect(screen.getByLabelText("Professional role")).toHaveValue("nurse");
  fireEvent.change(screen.getByLabelText("Start"), { target: { value: "2099-05-10T09:00" } });
  fireEvent.change(screen.getByLabelText("Shift duration"), { target: { value: "2" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Location address" }), { target: { value: "10 Test Street" } });
  fireEvent.click(screen.getByRole("button", { name: "Review booking" }));
  fireEvent.click(screen.getByRole("button", { name: "Create booking" }));
  await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
  expect(mocks.create.mock.calls[0][0].riskAssessment).toMatchObject({
    respondent: "family",
    consent: true,
    answers: expect.objectContaining({ support_type: "clinical", behaviour: "often" }),
  });
  expect(await screen.findByRole("status")).toHaveTextContent("Request received — under review");
});

it("warns when the chosen role differs from the recommendation", () => {
  render(<BookingRequestForm requesterType="client" roles={roles} emergencyNumber="112" />);
  answerAll({ support_type: "clinical" });
  fireEvent.click(screen.getByRole("button", { name: "Continue to booking details" }));
  fireEvent.change(screen.getByLabelText("Professional role"), { target: { value: "support" } });
  expect(screen.getByText(/differs from the recommendation/)).toBeInTheDocument();
});
