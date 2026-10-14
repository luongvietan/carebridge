import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { BookingRequestForm } from "./booking-request-form";
import { EMERGENCY_QUESTIONS, QUESTIONS, RESPONDENT_OPTIONS, RESPONDENT_QUESTION } from "@/lib/risk-assessment/questionnaire";

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

function start() {
  pick(RESPONDENT_QUESTION.en, RESPONDENT_OPTIONS[1].label.en);
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
}

function noEmergencies() {
  for (const q of EMERGENCY_QUESTIONS) pick(q.label.en, "No");
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
}

/** Answers every shown question (first option unless given), repeating as follow-ups appear. */
function answerShown(answers: Record<string, string>) {
  for (let pass = 0; pass < 3; pass++) {
    for (const q of QUESTIONS) {
      const group = screen.queryByRole("group", { name: q.label.en });
      if (!group) continue;
      const option = q.options.find((o) => o.id === (answers[q.id] ?? q.options[0].id))!;
      fireEvent.click(within(group).getByLabelText(option.label.en));
    }
  }
  fireEvent.click(screen.getByRole("button", { name: "See recommendation" }));
}

it("asks who is answering and for consent before any health question", () => {
  render(<BookingRequestForm requesterType="client" roles={roles} emergencyNumber="112" />);
  expect(screen.queryByRole("group", { name: EMERGENCY_QUESTIONS[0].label.en })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Please say who is completing the assessment.");
  pick(RESPONDENT_QUESTION.en, RESPONDENT_OPTIONS[0].label.en);
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByRole("alert")).toHaveTextContent("give your consent");
});

it("stops at any emergency answer with the 112 guidance and a confirmation", () => {
  render(<BookingRequestForm requesterType="client" roles={roles} emergencyNumber="112" />);
  start();
  expect(screen.getByText(/CareBridge is not an emergency service/)).toBeInTheDocument();
  pick(EMERGENCY_QUESTIONS[4].label.en, "Yes");
  expect(screen.getByRole("heading", { name: "Call 112 now" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Call 112" })).toHaveAttribute("href", "tel:112");
  expect(screen.getByRole("link", { name: "I understand" })).toHaveAttribute("href", "/client/bookings");
  expect(mocks.create).not.toHaveBeenCalled();
});

it("shows the child branch only for a child", () => {
  render(<BookingRequestForm requesterType="client" roles={roles} emergencyNumber="112" />);
  start();
  noEmergencies();
  const k1 = QUESTIONS.find((q) => q.id === "K1")!.label.en;
  const b1 = QUESTIONS.find((q) => q.id === "B1")!.label.en;
  expect(screen.queryByRole("group", { name: k1 })).not.toBeInTheDocument();
  pick(b1, "Child or young person");
  expect(screen.getByRole("group", { name: k1 })).toBeInTheDocument();
  expect(screen.queryByRole("group", { name: QUESTIONS.find((q) => q.id === "D1")!.label.en })).not.toBeInTheDocument();
});

it("routes medicine administration to a nurse, offers only nurses and sends the assessment", async () => {
  render(<BookingRequestForm requesterType="client" roles={roles} emergencyNumber="112" />);
  start();
  noEmergencies();
  answerShown({ C1: "administer" });
  expect(screen.getByText("Nurse")).toBeInTheDocument();
  expect(screen.getByText(/nursing skills may be required/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Continue to booking details" }));

  const roleSelect = screen.getByLabelText("Professional role");
  expect(roleSelect).toHaveValue("nurse");
  expect(within(roleSelect).queryByText("Auxiliar")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Start"), { target: { value: "2099-05-10T09:00" } });
  fireEvent.change(screen.getByLabelText("Shift duration"), { target: { value: "2" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Location address" }), { target: { value: "10 Test Street" } });
  fireEvent.click(screen.getByRole("button", { name: "Review booking" }));
  fireEvent.click(screen.getByRole("button", { name: "Create booking" }));
  await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
  const sent = mocks.create.mock.calls[0][0].riskAssessment;
  expect(sent).toMatchObject({ respondent: "family", consent: true, answers: expect.objectContaining({ C1: "administer" }) });
  expect(sent.answers.K1).toBeUndefined();
  expect(await screen.findByRole("status")).toHaveTextContent("Request received — under review");
}, 30_000);

it("tells a green request it may suit a support professional", () => {
  render(<BookingRequestForm requesterType="client" roles={roles} emergencyNumber="112" />);
  start();
  noEmergencies();
  answerShown({});
  expect(screen.getByText(/may be suitable for a support professional/)).toBeInTheDocument();
}, 30_000);
