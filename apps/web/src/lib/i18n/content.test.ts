import { describe, expect, it } from "vitest";
import { contentForLocale, roleImage } from "./content";
import { marketingImages } from "@/data/marketing-images";

const pt = contentForLocale("pt-PT");
const en = contentForLocale("en-GB");

function allStrings(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => allStrings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => allStrings(x, out));
  return out;
}

describe("marketing content per market", () => {
  it("falls back to the UK for anything that is not Portuguese", () => {
    expect(contentForLocale("en-GB")).toBe(en);
    expect(contentForLocale("fr-FR")).toBe(en);
  });

  it("lists the eight Portuguese roles, and the UK's ten", () => {
    expect(pt.healthRoles.length + pt.childcareRoles.length).toBe(8);
    expect(en.healthRoles.length + en.childcareRoles.length).toBe(10);
  });

  it("gives every role of both markets a real photo", () => {
    for (const c of [pt, en]) {
      for (const r of [...c.healthRoles, ...c.childcareRoles]) {
        const img = roleImage(r.image);
        expect(img?.src, r.title).toBeTruthy();
      }
    }
    expect(marketingImages.roleCards.length).toBeGreaterThanOrEqual(6);
  });

  it("shows three roles on the Portuguese homepage, as the UK does", () => {
    const featured = [...pt.healthRoles, ...pt.childcareRoles].filter((r) => r.featuredOnHome);
    expect(featured).toHaveLength(3);
  });

  it("keeps UK-only regulators and law out of the Portuguese site", () => {
    const text = allStrings({ ...pt, ui: undefined }).join("\n");
    for (const uk of ["NMC", "Ofsted", "DBS", "CQC", "HCPC", "999", "Right to Work"]) {
      expect(text, uk).not.toContain(uk);
    }
    expect(pt.emergencyDisclaimer).toContain("112");
  });

  it("does not show the founder's words in Portuguese until she has approved them", () => {
    expect(pt.showFounder).toBe(false);
    expect(en.showFounder).toBe(true);
  });
});
