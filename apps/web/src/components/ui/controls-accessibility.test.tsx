import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { Modal } from "./modal";
import { Select } from "./select";
import { DatePicker, DateTimePicker } from "./date-picker";
import { SiteNavClient } from "@/components/site-nav-client";
import { RoleNav } from "@/components/role-nav";
import { AssistantWidget } from "@/components/assistant-widget";
import { PortalLocaleProvider } from "@/components/portal-locale";
vi.mock("@/components/cta-pill-link", () => ({ CtaPillLink: ({children}: {children: React.ReactNode}) => <span>{children}</span> }));
vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/lib/i18n/preference-actions", () => ({ setPreferredLocale: vi.fn() }));
vi.mock("next/image", () => ({ default: () => <span>CareBridge</span> }));
vi.mock("@/lib/auth/actions", () => ({ signOut: vi.fn() }));
afterEach(cleanup);
beforeEach(() => {
  HTMLElement.prototype.scrollTo = vi.fn();
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) { this.open = true; });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) { this.open = false; });
});
describe("accessible controls", () => {
  it("opens a native modal, localizes its close button and restores trigger focus", () => {
    function Example() {
      const [open, setOpen] = useState(false);
      return <><button onClick={() => setOpen(true)}>Open</button><Modal open={open} onClose={() => setOpen(false)} title="Confirm"><button>Continue</button></Modal></>;
    }
    render(<PortalLocaleProvider locale="pt-PT"><Example /></PortalLocaleProvider>);
    const trigger = screen.getByRole("button", { name: "Open" });
    trigger.focus(); fireEvent.click(trigger);
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Confirm" })).toHaveAttribute("aria-modal", "true");
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(trigger).toHaveFocus();
  });
  it("keeps combobox focus, skips disabled options, commits keyboard selection and submits its value", () => {
    const changed = vi.fn();
    const { container } = render(<form><Select name="choice" required aria-label="Choice" onValueChange={changed} options={[{value:"a",label:"Alpha"},{value:"b",label:"Blocked",disabled:true},{value:"c",label:"Charlie"}]} /></form>);
    const control = screen.getByRole("combobox"); control.focus();
    fireEvent.keyDown(control, { key: "ArrowDown" });
    const list = screen.getByRole("listbox");
    expect(control).toHaveAttribute("aria-controls", list.id);
    expect(screen.getByRole("option", {name:"Blocked"})).toHaveAttribute("aria-disabled", "true");
    fireEvent.keyDown(control, { key: "ArrowDown" });
    expect(control).toHaveAttribute("aria-activedescendant", screen.getByRole("option", {name:"Charlie"}).id);
    fireEvent.keyDown(control, { key: "Enter" });
    expect(changed).toHaveBeenCalledWith("c"); expect(control).toHaveFocus();
    expect(new FormData(container.querySelector("form")!).get("choice")).toBe("c");
    expect(container.querySelector("select")!.checkValidity()).toBe(true);
  });
  it("keeps select options in the native dialog top layer and blocks empty required choices", () => {
    const {container} = render(<Modal open onClose={() => {}} title="Booking"><form><Select name="role" required aria-label="Role" options={[{value:"carer",label:"Carer"}]} /><DatePicker aria-label="Visit date" /></form></Modal>);
    const dialog = screen.getByRole("dialog", {name:"Booking"});
    act(() => { expect(container.querySelector("form")!.checkValidity()).toBe(false); });
    const list = screen.getByRole("listbox"); expect(dialog).toContainElement(list);
    fireEvent.click(screen.getByRole("option", {name:"Carer"}));
    expect(container.querySelector("form")!.checkValidity()).toBe(true);
    fireEvent.click(screen.getByRole("button", {name:"Visit date"}));
    expect(dialog).toContainElement(screen.getByRole("dialog", {name:"Visit date"}));
  });
  it("gives marketing and portal mobile menus a controlled region and Escape focus return", () => {
    render(<><SiteNavClient dashboardHref={null} labels={{home:"Home",about:"About",roles:"Services",faq:"FAQ",contactUs:"Contact",signIn:"Sign in",dashboard:"Dashboard",openMenu:"Open marketing menu",closeMenu:"Close marketing menu"}} /><RoleNav areaLabel="Client" email={null} items={[{href:"/client",label:"Bookings"}]} /></>);
    for (const name of ["Open marketing menu", "Open menu"]) {
      const toggle = screen.getByRole("button", { name }); toggle.focus(); fireEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(document.getElementById(toggle.getAttribute("aria-controls")!)?.contains(document.activeElement)).toBe(true);
      fireEvent.keyDown(document.activeElement!, {key:"Escape"});
      expect(toggle).toHaveAttribute("aria-expanded", "false"); expect(toggle).toHaveFocus();
    }
  });
  it("focuses the assistant input and restores its toggle when dismissed", () => {
    render(<AssistantWidget locale="en-GB" />);
    const toggle = screen.getByRole("button", {name:"Ask a question"}); fireEvent.click(toggle);
    expect(screen.getByRole("textbox")).toHaveFocus();
    expect(screen.getByRole("log")).toHaveAttribute("aria-live", "polite");
    fireEvent.keyDown(screen.getByRole("textbox"), {key:"Escape"});
    expect(toggle).toHaveFocus(); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("restores date trigger focus on Escape and localizes time labels", () => {
    render(<PortalLocaleProvider locale="pt-PT"><DatePicker aria-label="Data" minDate={new Date(2030,0,10)} /><DateTimePicker aria-label="Data e hora" /></PortalLocaleProvider>);
    const trigger = screen.getByRole("button", {name:"Data"}); fireEvent.click(trigger);
    expect(screen.getByRole("button", {name:"10/01/2030"})).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, {key:"Escape"}); expect(trigger).toHaveFocus();
    fireEvent.click(screen.getByRole("button", {name:"Data e hora"}));
    expect(screen.getByRole("combobox", {name:"Hora"})).toBeVisible();
    expect(screen.getByRole("combobox", {name:"Minuto"})).toBeVisible();
  });
});
