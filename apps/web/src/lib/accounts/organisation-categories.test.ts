import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PT_ORGANISATION_CATEGORIES,
  organisationCategory,
  organisationCategoryLabel,
} from "./organisation-categories";

const MIGRATION = join(
  __dirname, "..", "..", "..", "..", "..",
  "supabase", "migrations", "0087_organisation_market_categories.sql",
);

describe("Portuguese organisation categories", () => {
  it("has unique pt_ codes", () => {
    const codes = PT_ORGANISATION_CATEGORIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) expect(code).toMatch(/^pt_[a-z_]+$/);
  });

  it("matches the database check constraint exactly", () => {
    const sql = readFileSync(MIGRATION, "utf8");
    const block = /organisation_category in \(([^)]*)\)/.exec(sql)?.[1] ?? "";
    const inDb = [...block.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort();
    expect(inDb).toEqual(PT_ORGANISATION_CATEGORIES.map((c) => c.code).sort());
  });

  it("keeps each group's options adjacent, as the Select requires", () => {
    const groups = PT_ORGANISATION_CATEGORIES.map((c) => c.group);
    const seen = new Set<string>();
    groups.forEach((g, i) => {
      if (i > 0 && g !== groups[i - 1]) expect(seen.has(g)).toBe(false);
      seen.add(g);
    });
  });

  it("asks a care home for its ISS licence and a clinic for its ERS number", () => {
    expect(organisationCategory("pt_erpi")?.licence).toBe("iss");
    expect(organisationCategory("pt_hospital_clinica")?.licence).toBe("ers");
    expect(organisationCategory("pt_empresa")?.licence).toBeNull();
  });

  it("labels unknown and empty codes without crashing", () => {
    expect(organisationCategoryLabel("pt_sad")).toBe("Serviço de Apoio Domiciliário (SAD)");
    expect(organisationCategoryLabel("legacy_code")).toBe("legacy_code");
    expect(organisationCategoryLabel(null)).toBe("");
  });
});
