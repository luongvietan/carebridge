import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import { translatePilotQuestion } from "./translation";

it("translates every seeded PT question without changing answer keys or exposing answers", () => {
  const sql = readFileSync(resolve("../../supabase/migrations/0082_assessment_country_dimension.sql"), "utf8");
  const rows = [...sql.matchAll(/\(null,'PT','[^']+',\s*'([^']+)',\s*'([^']+)'::jsonb/g)];
  expect(rows).toHaveLength(20);
  for (const [, text, optionsJson] of rows) {
    const options = (JSON.parse(optionsJson) as string[]).map((text, i) => ({ key: String.fromCharCode(97 + i), text }));
    const source = { id: "q", topic: "safety", question_text: text, options };
    const english = translatePilotQuestion(source, "en-GB");
    expect(english.question_text).not.toBe(text);
    expect(english.options.map(o => o.key)).toEqual(["a", "b", "c", "d"]);
    expect(english.options.every((o, i) => o.text !== options[i].text && !!o.text)).toBe(true);
    expect(english).not.toHaveProperty("correct_option");
    expect(translatePilotQuestion(source, "pt-PT")).toEqual(source);
  }
});
