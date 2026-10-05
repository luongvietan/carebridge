import { describe, expect, it } from "vitest";
import {
  LIVRO_RECLAMACOES_URL,
  PORTAL_CONSUMIDOR_URL,
  consumerInfoForLocale,
  portugueseConsumerInfo,
} from "./consumer-info";

describe("Portuguese consumer information", () => {
  it("always links the official Livro de Reclamações Eletrónico", () => {
    const info = portugueseConsumerInfo({});
    expect(info.complaintsBook.href).toBe(LIVRO_RECLAMACOES_URL);
  });

  it("points to the Portal do Consumidor list until a RAL entity is chosen", () => {
    const { disputeResolution } = portugueseConsumerInfo({ name: "  ", url: null });
    expect(disputeResolution.href).toBe(PORTAL_CONSUMIDOR_URL);
    expect(disputeResolution.text).toContain("Portal do Consumidor");
  });

  it("names the configured RAL entity and links its site", () => {
    const { disputeResolution } = portugueseConsumerInfo({
      name: "CNIACC",
      url: "https://www.cniacc.pt/",
    });
    expect(disputeResolution.text).toContain("CNIACC");
    expect(disputeResolution.href).toBe("https://www.cniacc.pt/");
    expect(disputeResolution.linkLabel).toBe("www.cniacc.pt");
  });

  it("shows nothing on the UK site", () => {
    expect(consumerInfoForLocale("en-GB")).toBeNull();
    expect(consumerInfoForLocale("pt-PT")).not.toBeNull();
  });
});
