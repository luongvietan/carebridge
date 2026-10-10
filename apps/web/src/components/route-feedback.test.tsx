import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PortalLocaleProvider } from "@/components/portal-locale";
import { RouteError, RouteLoading } from "@/components/route-feedback";
import { TableScroll } from "@/components/table-scroll";

afterEach(cleanup);

describe("route recovery and table navigation", () => {
  it("keeps a retry action and support route available after an exception", () => {
    const reset = vi.fn();
    render(<PortalLocaleProvider locale="pt-PT"><RouteError reset={reset} /></PortalLocaleProvider>);
    expect(screen.getByRole("alert")).toHaveTextContent("Tente novamente");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(reset).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Contacte-nos" })).toHaveAttribute("href", "/contact");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  });
  it("announces loading without exposing decorative skeletons", () => {
    render(<RouteLoading />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading…");
    expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true");
  });
  it("provides a focusable, described scroll region for Portuguese tables", () => {
    render(<PortalLocaleProvider locale="pt-PT"><TableScroll><table><tbody><tr><td>Test</td></tr></tbody></table></TableScroll></PortalLocaleProvider>);
    const region = screen.getByRole("region", { name: "Tabela de dados" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region).toHaveAccessibleDescription("Deslize horizontalmente para ver todas as colunas.");
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
