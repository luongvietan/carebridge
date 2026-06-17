import { describe, it, expect } from "vitest";
import { validateBankDetails } from "./bank";

describe("validateBankDetails", () => {
  it("accepts and normalises valid UK bank details", () => {
    const r = validateBankDetails({
      accountName: "  Jane Doe ",
      sortCode: "12-34-56",
      accountNumber: "1234 5678",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.normalised).toEqual({
        accountName: "Jane Doe",
        sortCode: "123456",
        accountNumber: "12345678",
      });
    }
  });

  it("rejects a missing account name", () => {
    expect(
      validateBankDetails({ accountName: " ", sortCode: "123456", accountNumber: "12345678" }).ok,
    ).toBe(false);
  });

  it("rejects a sort code that is not 6 digits", () => {
    expect(
      validateBankDetails({ accountName: "Jane", sortCode: "12345", accountNumber: "12345678" }).ok,
    ).toBe(false);
  });

  it("rejects an account number that is not 8 digits", () => {
    expect(
      validateBankDetails({ accountName: "Jane", sortCode: "123456", accountNumber: "1234567" }).ok,
    ).toBe(false);
  });

  it("rejects non-numeric sort code / account number", () => {
    expect(
      validateBankDetails({ accountName: "Jane", sortCode: "12ab56", accountNumber: "12345678" }).ok,
    ).toBe(false);
  });
});
