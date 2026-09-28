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

import { isValidIban, validatePayoutAccount } from "./bank";

describe("IBAN payout accounts (Portugal)", () => {
  // Published example IBANs; both pass the ISO 13616 check.
  const PT = "PT50 0002 0123 1234 5678 9015 4";
  const GB = "GB82 WEST 1234 5698 7654 32";

  it("accepts a valid Portuguese IBAN with or without spaces", () => {
    expect(isValidIban(PT)).toBe(true);
    expect(isValidIban(PT.replace(/\s/g, "").toLowerCase())).toBe(true);
  });

  it("accepts another country's valid IBAN", () => {
    expect(isValidIban(GB)).toBe(true);
  });

  it("rejects a wrong check digit, wrong Portuguese length and junk", () => {
    expect(isValidIban("PT50 0002 0123 1234 5678 9015 5")).toBe(false);
    expect(isValidIban("PT50 0002 0123 1234 5678 901")).toBe(false);
    expect(isValidIban("not an iban")).toBe(false);
  });

  it("stores an IBAN in the account-number slot with the IBAN marker", () => {
    const r = validatePayoutAccount({ kind: "iban", accountName: " Ana Silva ", iban: PT });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.normalised).toEqual({
        accountName: "Ana Silva",
        sortCode: "IBAN",
        accountNumber: "PT50000201231234567890154",
      });
    }
  });

  it("still validates UK details through the same entry point", () => {
    expect(
      validatePayoutAccount({ kind: "uk", accountName: "Jane", sortCode: "12-34-56", accountNumber: "12345678" }).ok,
    ).toBe(true);
    expect(validatePayoutAccount({ kind: "iban", accountName: "A", iban: PT }).ok).toBe(false);
  });
});
