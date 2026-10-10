import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { FaqList } from "./faq-list";
import { ComplianceShowcase } from "./compliance-showcase";
vi.mock("@/components/ui/icon", () => ({ Icon: () => null, Add01Icon: {}, MinusSignIcon: {}, MessageQuestionIcon: {}, ChevronDownIcon: {}, ArrowRight01Icon: {}, ArrowUpRight01Icon: {} }));
vi.mock("@/components/cta-pill-link", () => ({ CtaPillLink: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

afterEach(cleanup);

it("keeps the FAQ help sidebar Portuguese and the accordion operable", () => {
  render(<FaqList locale="pt-PT" defaultOpenIndex={-1} faqs={[{ question: "Como funciona?", answer: "A equipa verifica os profissionais." }]} />);
  expect(screen.getByRole("heading", { name: "Tem mais perguntas?" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Contacte-nos" })).toHaveAttribute("href", "/contact");
  expect(screen.queryByText("Do you have more questions?")).not.toBeInTheDocument();
  const question = screen.getByRole("button", { name: "Como funciona?" });
  expect(question).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(question);
  expect(question).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByText("A equipa verifica os profissionais.")).toBeVisible();
});

it("localizes the compliance illustration status without changing supplied copy", () => {
  render(<ComplianceShowcase locale="pt-PT" heading="Profissionais verificados" body="Verificação contínua" getStarted="Começar" features={[]} checklist={[]} />);
  expect(screen.getByText("Estado de conformidade")).toBeVisible();
  expect(screen.queryByText("Compliance status")).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Profissionais verificados" })).toBeVisible();
});
