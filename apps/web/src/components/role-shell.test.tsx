import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { RoleShell } from "@/components/role-shell";
import { PortalLocaleProvider, Tr } from "@/components/portal-locale";

const mocks = vi.hoisted(() => ({ locale: vi.fn() }));
vi.mock("@/lib/i18n/portal-server", () => ({ getPortalLocale: mocks.locale }));
vi.mock("@/components/role-nav", () => ({ RoleNav: () => <nav><Tr>Dashboard</Tr></nav> }));
vi.mock("@/components/portal-breadcrumbs", () => ({ PortalBreadcrumbs: () => null }));
afterEach(cleanup);

it("uses the persisted account locale even when the marketing locale differs", async () => {
  mocks.locale.mockResolvedValue("pt-PT");
  const shell = await RoleShell({ accountType: "professional", email: null, children: <p><Tr>Bookings</Tr></p> });
  const { container } = render(<PortalLocaleProvider locale="en-GB">{shell}</PortalLocaleProvider>);
  expect(screen.getByText("Marcações")).toBeInTheDocument();
  expect(container.querySelector("[lang]")).toHaveAttribute("lang", "pt-PT");
});
