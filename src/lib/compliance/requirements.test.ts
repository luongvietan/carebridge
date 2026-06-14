import { describe, it, expect } from "vitest";
import { eligibilityOutcome } from "./requirements";

describe("eligibilityOutcome", () => {
  it("continues when all mandatory training is current", () => {
    expect(eligibilityOutcome(true)).toBe("continue");
  });
  it("pends when training is not current", () => {
    expect(eligibilityOutcome(false)).toBe("pending");
  });
});
