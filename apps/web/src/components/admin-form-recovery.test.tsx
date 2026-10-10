import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AmendRateForm } from "./amend-rate-form";
import { StatusActionForm } from "./status-action-form";
import { PortalLocaleProvider } from "./portal-locale";

const mocks = vi.hoisted(() => ({ amend: vi.fn(), status: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/admin/rate-actions", () => ({ amendRateCard: mocks.amend }));
vi.mock("@/lib/admin/status-actions", () => ({ applyProfessionalStatusAction: mocks.status }));
vi.mock("@/components/ui/select", () => ({ Select: ({ options, onValueChange, ...props }: { options: { value: string; label: string }[]; onValueChange?: (value: string) => void }) => <select {...props} onChange={(e) => onValueChange?.(e.target.value)}>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select> }));
afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); mocks.amend.mockRejectedValue(new Error("private detail")); mocks.status.mockRejectedValue(new Error("private detail")); });

it("restores the rate form and preserves inputs after a thrown action", async () => {
  render(<PortalLocaleProvider locale="pt-PT"><AmendRateForm roleId="role" roleName="Nurse" defaultCurrency="EUR" /></PortalLocaleProvider>);
  const inputs = screen.getAllByRole("spinbutton");
  fireEvent.change(inputs[0], { target: { value: "25" } });
  fireEvent.change(inputs[1], { target: { value: "20" } });
  fireEvent.submit(screen.getByRole("button", { name: "Alterar tabela de preços" }).closest("form")!);
  await waitFor(() => expect(mocks.amend).toHaveBeenCalledOnce());
  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível concluir a operação. Tente novamente.");
  expect(inputs[0]).toHaveValue(25);
  expect(screen.getByRole("button", { name: "Alterar tabela de preços" })).toBeEnabled();
});

it("restores a status form after a thrown non-destructive action", async () => {
  render(<PortalLocaleProvider locale="pt-PT"><StatusActionForm professionalId="professional" currentStatus="compliance_hold" /></PortalLocaleProvider>);
  const action = screen.getByLabelText("Ação");
  fireEvent.change(action, { target: { value: "reinstate" } });
  fireEvent.submit(screen.getByRole("button", { name: "Aplicar ação" }).closest("form")!);
  await waitFor(() => expect(mocks.status).toHaveBeenCalledOnce());
  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível concluir a operação. Tente novamente.");
  expect(screen.getByRole("button", { name: "Aplicar ação" })).toBeEnabled();
});
