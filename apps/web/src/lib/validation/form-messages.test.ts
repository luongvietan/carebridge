import { describe, expect, it } from "vitest";
import { z } from "zod";
import { validationMessage } from "./form-messages";

const labels = { fullName: "Full name", city: "City" };

describe("validationMessage", () => {
  it("lists missing required fields by label", () => {
    const result = z.object({ fullName: z.string().min(1), city: z.string().min(1) }).safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(validationMessage(result.error, labels)).toBe(
        "Please check these fields: Full name, City.",
      );
    }
  });

  it("includes custom refine messages on object fields", () => {
    const schema = z.object({
      dateOfBirth: z.string().refine(() => false, "Enter a valid date of birth."),
    });
    const result = schema.safeParse({ dateOfBirth: "bad" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(validationMessage(result.error, { dateOfBirth: "Date of birth" })).toBe(
        "Please check these fields: Date of birth: Enter a valid date of birth..",
      );
    }
  });
});
