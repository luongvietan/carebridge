import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Portuguese legal pack", () => {
  it("has all seven documents in both languages", async () => {
    const { PT_LEGAL_PACK, PT_LEGAL_ROUTES } = await import("@/data/legal-copy-pt");
    const keys = Object.keys(PT_LEGAL_ROUTES).sort();
    expect(keys).toHaveLength(7);
    expect(Object.keys(PT_LEGAL_PACK.pt).sort()).toEqual(keys);
    expect(Object.keys(PT_LEGAL_PACK.en).sort()).toEqual(keys);
  });

  it("keeps the pack's placeholder until the company address is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_PT_COMPANY_ADDRESS", "");
    const { PT_LEGAL_PACK } = await import("@/data/legal-copy-pt");
    expect(PT_LEGAL_PACK.pt.generalTerms.sections[0].paragraphs?.[0]).toContain("a inserir antes da publicação");
  });

  it("names the configured address in both languages", async () => {
    vi.stubEnv("NEXT_PUBLIC_PT_COMPANY_ADDRESS", "Rua Exemplo 1, 1000-001 Lisboa");
    const { PT_LEGAL_PACK } = await import("@/data/legal-copy-pt");
    expect(PT_LEGAL_PACK.pt.generalTerms.sections[0].paragraphs?.[0]).toContain("com endereço geográfico em Rua Exemplo 1");
    expect(PT_LEGAL_PACK.en.privacy.sections[0].paragraphs?.[0]).toContain("Geographic address: Rua Exemplo 1");
    expect(PT_LEGAL_PACK.pt.legalNotice.facts?.find((f) => f.label === "Endereço geográfico")?.value).toBe(
      "Rua Exemplo 1, 1000-001 Lisboa",
    );
  });

  it("reads the language from ?lang", async () => {
    const { legalLangFromParam } = await import("@/data/legal-copy-pt");
    expect(legalLangFromParam("en")).toBe("en");
    expect(legalLangFromParam(["en"])).toBe("en");
    expect(legalLangFromParam(undefined)).toBe("pt");
    expect(legalLangFromParam("fr")).toBe("pt");
  });
});
