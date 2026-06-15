import { describe, it, expect } from "vitest";
import { canSetAccountStatus } from "./account-status";

describe("canSetAccountStatus", () => {
  it("allows active → suspended and back", () => {
    expect(canSetAccountStatus("active", "suspended").ok).toBe(true);
    expect(canSetAccountStatus("suspended", "active").ok).toBe(true);
  });
  it("allows deactivate from active/suspended and reactivate", () => {
    expect(canSetAccountStatus("active", "deactivated").ok).toBe(true);
    expect(canSetAccountStatus("deactivated", "active").ok).toBe(true);
  });
  it("rejects a no-op and unknown transitions", () => {
    expect(canSetAccountStatus("active", "active").ok).toBe(false);
    expect(canSetAccountStatus("deactivated", "suspended").ok).toBe(false);
  });
});
