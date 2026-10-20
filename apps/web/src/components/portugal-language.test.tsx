import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PortalLocaleProvider } from "./portal-locale";
import { ProfileForm } from "./profile-form";
import { DocumentUploader } from "./document-uploader";
import { AccountRegisterForm } from "./account-register-form";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/onboarding/actions", () => ({ saveProfile: vi.fn(), uploadDocument: vi.fn() }));
vi.mock("@/lib/accounts/actions", () => ({ saveClientProfile: vi.fn(), saveOrganisationProfile: vi.fn() }));
afterEach(cleanup);
it("keeps Portuguese identity fields and roles in an English profile", () => {
  render(<PortalLocaleProvider locale="en-GB"><ProfileForm locale="en-GB" country="PT" current={null} skills={[]} roles={[{ id: "nurse", name: "Enfermeiro/a — Adultos", code: "pt_enfermeiro_adulto", category: "Saúde", categoryOrder: 0, registrationRegister: "ordem_enfermeiros" }]} /></PortalLocaleProvider>);
  expect(screen.getByLabelText(/NIF \(Portuguese tax number\)/)).toBeRequired();
  expect(screen.getByLabelText(/NISS/)).toBeInTheDocument();
  expect(screen.getAllByText("Nurse — Adults").length).toBeGreaterThan(0);
  expect(screen.queryByText(/National Insurance number/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Home Office/)).not.toBeInTheDocument();
});
it("shows Portugal document guidance and EUR bank reminder in English", () => {
  render(<PortalLocaleProvider locale="en-GB"><DocumentUploader locale="en-GB" country="PT" items={[{ typeId: "nif", code: "nif", name: "Comprovativo de NIF", critical: false, hasExpiry: false, status: null }]} /></PortalLocaleProvider>);
  expect(screen.getByText("Proof of NIF")).toBeInTheDocument();
  expect(screen.getByText(/Proof of your Portuguese NIF/)).toBeInTheDocument();
  expect(screen.getByText(/pay you in EUR/)).toBeInTheDocument();
});
it("shows Portugal organisation requirements in English without a UK regulator field", () => {
  render(<PortalLocaleProvider locale="en-GB"><AccountRegisterForm variant="organisation" locale="en-GB" country="PT" /></PortalLocaleProvider>);
  expect(screen.getByLabelText(/NIPC/)).toBeRequired();
  expect(screen.getByRole("combobox", { name: "Organisation type" })).toBeInTheDocument();
  expect(screen.queryByLabelText(/CQC/)).not.toBeInTheDocument();
});
