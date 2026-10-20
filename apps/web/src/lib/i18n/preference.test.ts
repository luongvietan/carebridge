import { expect, it } from "vitest";
import { resolveLocale } from "./preference";
it("defaults to European Portuguese independently of country", () => {
  expect(resolveLocale(undefined, undefined)).toBe("pt-PT");
  expect(resolveLocale("GB", "invalid")).toBe("pt-PT");
});
it("retains an explicit browser selection and falls back to the saved account preference", () => {
  expect(resolveLocale("en-GB", "pt-PT")).toBe("en-GB");
  expect(resolveLocale(undefined, "en-GB")).toBe("en-GB");
});
