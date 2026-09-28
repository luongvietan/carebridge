import { describe, expect, it } from "vitest";
import { detectLocale } from "@/lib/assistant/language";
import { answerFromKnowledge } from "@/lib/assistant/fallback";
import { knowledgeFor } from "@/lib/assistant/knowledge";
import { buildSystemPrompt } from "@/lib/assistant/prompt";
import { allowRequest } from "@/lib/assistant/rate-limit";
import { faqs } from "@/data/faqs";
import { faqsPt } from "@/data/faqs-pt";

describe("detectLocale", () => {
  it("recognises Portuguese and English", () => {
    expect(detectLocale("Como posso fazer uma marcação?", "en-GB")).toBe("pt-PT");
    expect(detectLocale("How do I book a nurse?", "pt-PT")).toBe("en-GB");
  });

  it("falls back to the visitor's market when there is nothing to go on", () => {
    expect(detectLocale("NIF 123", "pt-PT")).toBe("pt-PT");
    expect(detectLocale("???", "en-GB")).toBe("en-GB");
  });
});

describe("answerFromKnowledge", () => {
  it("answers a payments question in Portuguese from the Portuguese content", () => {
    const { answer, matched } = answerFromKnowledge("Como são tratados os pagamentos em Portugal?", "pt-PT");
    expect(matched).toBe(true);
    expect(answer).toMatch(/Stripe|euros/);
  });

  it("answers in English from the English content", () => {
    const { answer, matched } = answerFromKnowledge("What if a document expires?", "en-GB");
    expect(matched).toBe(true);
    expect(answer).toMatch(/restricts/);
  });

  it("declines rather than guessing when nothing matches", () => {
    const { matched } = answerFromKnowledge("What is the weather on Mars", "en-GB");
    expect(matched).toBe(false);
  });
});

describe("knowledge", () => {
  it("keeps the Portuguese FAQ in step with the English one", () => {
    expect(faqsPt).toHaveLength(faqs.length);
    expect(knowledgeFor("pt-PT")).toHaveLength(knowledgeFor("en-GB").length);
  });

  it("puts the knowledge into the prompt and keeps the guard-rails", () => {
    const p = buildSystemPrompt("pt-PT");
    expect(p).toContain(faqsPt[0].question);
    expect(p).toMatch(/ONLY from the knowledge/);
    expect(p).toMatch(/112/);
  });
});

describe("allowRequest", () => {
  it("stops a visitor after the limit and forgives them after the window", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 3; i++) expect(allowRequest("ip-a", 3, 1000, t0 + i)).toBe(true);
    expect(allowRequest("ip-a", 3, 1000, t0 + 10)).toBe(false);
    expect(allowRequest("ip-a", 3, 1000, t0 + 5000)).toBe(true);
  });
});
