import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { PORTAL_PT } from "./portal-pt";
import { makeT } from "./portal";
import { MONEY_STATE_LABEL } from "@/lib/finance/booking-finance";
import { ROLE_STATUS_LABEL } from "@/lib/roles/outstanding";
import ts from "typescript";

const SRC = join(__dirname, "..", "..");

function files(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) files(p, out);
    else if (/\.tsx?$/.test(name) && !/\.test\./.test(name)) out.push(p);
  }
  return out;
}

describe("signed-in app translations", () => {
  it("has Portuguese for every static Tr label", () => {
    const missing: string[] = [];
    const decode = (text: string) => text.replace(/&(amp|apos|quot|lt|gt);/g, (_, entity: string) => ({ amp: "&", apos: "'", quot: '"', lt: "<", gt: ">" })[entity]!);
    for (const file of files(SRC).filter((path) => path.endsWith(".tsx"))) {
      const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const visit = (node: ts.Node) => {
        if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === "Tr") {
          for (const child of node.children) {
            if (ts.isJsxExpression(child) && child.expression && ts.isConditionalExpression(child.expression)) {
              const checkLabels = (branch: ts.Node) => {
                if (ts.isStringLiteral(branch) && branch.text && !(branch.text in PORTAL_PT)) missing.push(`${file.slice(SRC.length + 1)}: ${branch.text}`);
                ts.forEachChild(branch, checkLabels);
              };
              checkLabels(child.expression);
            }
            const key = ts.isJsxText(child) ? decode(child.text.replace(/\s+/g, " ").trim())
              : ts.isJsxExpression(child) && child.expression && ts.isStringLiteral(child.expression) ? child.expression.text : undefined;
            if (key && !(key in PORTAL_PT)) missing.push(`${file.slice(SRC.length + 1)}: ${key}`);
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
    expect(missing).toEqual([]);
  });
  it("has Portuguese for every string the app passes to t()", () => {
    const missing: string[] = [];
    const re = /\bt\(\s*"((?:[^"\\]|\\.)*)"/g;
    for (const f of files(SRC)) {
      const src = readFileSync(f, "utf8");
      for (const m of src.matchAll(re)) {
        const key = JSON.parse(`"${m[1]}"`) as string;
        if (!(key in PORTAL_PT)) missing.push(`${f.slice(SRC.length + 1)}: ${key}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("translates the labels the app takes from data", () => {
    for (const label of [...Object.values(MONEY_STATE_LABEL), ...Object.values(ROLE_STATUS_LABEL)]) {
      expect(PORTAL_PT[label], label).toBeTruthy();
    }
  });

  it("leaves English untouched and fills in values", () => {
    const en = makeT("en-GB");
    const pt = makeT("pt-PT");
    expect(en("Bookings")).toBe("Bookings");
    expect(pt("Bookings")).toBe("Marcações");
    expect(pt("{n} messages", { n: 3 })).toBe("3 mensagens");
    expect(pt("Add your Cédula profissional")).toBe("Indique: Cédula profissional");
    expect(pt("Please check these fields: Full name, City.")).toBe(
      "Verifique estes campos: Nome completo, Localidade.",
    );
    expect(pt("Something never translated")).toBe("Something never translated");
  });
});
