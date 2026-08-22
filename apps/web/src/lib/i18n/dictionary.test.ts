import { describe, it, expect } from "vitest";
import { dictionaries, dictionaryForLocale } from "./dictionary";

/** Every key path in a bundle, flattened — the shape comparison below walks these. */
function keyPaths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((v, i) => keyPaths(v, `${prefix}[${i}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => keyPaths(v, prefix ? `${prefix}.${k}` : k));
  }
  return [prefix];
}

/** Walk a flattened path back to its value. */
function at<T>(bundle: T, path: string): unknown {
  return path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .reduce<unknown>((acc, key) => (acc as Record<string, unknown>)[key], bundle);
}

describe("dictionaries", () => {
  it("Portuguese mirrors the English shape exactly", () => {
    expect(keyPaths(dictionaries["pt-PT"]).sort()).toEqual(keyPaths(dictionaries["en-GB"]).sort());
  });

  it("has no empty or whitespace strings in either language", () => {
    for (const dict of Object.values(dictionaries)) {
      for (const path of keyPaths(dict)) {
        expect(String(at(dict, path)).trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("falls back to English for an unknown locale", () => {
    expect(dictionaryForLocale("fr-FR")).toBe(dictionaries["en-GB"]);
    expect(dictionaryForLocale("pt-PT")).toBe(dictionaries["pt-PT"]);
  });
});
