import { describe, it, expect } from "vitest";
import { validateDocumentExpiry, validateDocumentIssueDate } from "./document-expiry";

describe("validateDocumentExpiry", () => {
  const today = "2026-06-18";

  it("accepts a missing expiry when the document type does not expire", () => {
    expect(validateDocumentExpiry({ hasExpiry: false, expiryDate: "", today })).toEqual({ ok: true });
  });

  it("accepts a missing expiry for a non-expiring type even if a date is supplied", () => {
    expect(validateDocumentExpiry({ hasExpiry: false, expiryDate: "2020-01-01", today })).toEqual({
      ok: true,
    });
  });

  it("rejects a missing expiry when the document type requires one", () => {
    const r = validateDocumentExpiry({ hasExpiry: true, expiryDate: "", today });
    expect(r.ok).toBe(false);
  });

  it("rejects a whitespace-only expiry for an expiring type", () => {
    const r = validateDocumentExpiry({ hasExpiry: true, expiryDate: "   ", today });
    expect(r.ok).toBe(false);
  });

  it("rejects an unparseable expiry for an expiring type", () => {
    const r = validateDocumentExpiry({ hasExpiry: true, expiryDate: "not-a-date", today });
    expect(r.ok).toBe(false);
  });

  it("rejects an expiry in the past", () => {
    const r = validateDocumentExpiry({ hasExpiry: true, expiryDate: "2026-06-17", today });
    expect(r.ok).toBe(false);
  });

  it("accepts an expiry of today", () => {
    expect(validateDocumentExpiry({ hasExpiry: true, expiryDate: "2026-06-18", today })).toEqual({
      ok: true,
    });
  });

  it("accepts a future expiry", () => {
    expect(validateDocumentExpiry({ hasExpiry: true, expiryDate: "2027-01-01", today })).toEqual({
      ok: true,
    });
  });
});

describe("validateDocumentIssueDate", () => {
  const today = "2026-08-07";

  it("skips documents with no recency rule", () => {
    expect(validateDocumentIssueDate({ maxAgeMonths: undefined, issuedDate: "", today })).toEqual({
      ok: true,
    });
  });

  it("requires an issue date where one applies", () => {
    const r = validateDocumentIssueDate({ maxAgeMonths: 3, issuedDate: "", today });
    expect(r).toEqual({ ok: false, error: "An issue date is required for this document." });
  });

  it("rejects a malformed date", () => {
    expect(validateDocumentIssueDate({ maxAgeMonths: 3, issuedDate: "07/05/2026", today }).ok).toBe(
      false,
    );
  });

  it("rejects an issue date in the future", () => {
    const r = validateDocumentIssueDate({ maxAgeMonths: 3, issuedDate: "2026-08-08", today });
    expect(r.ok).toBe(false);
  });

  it("accepts a bill issued inside the window", () => {
    expect(validateDocumentIssueDate({ maxAgeMonths: 3, issuedDate: "2026-06-01", today })).toEqual({
      ok: true,
    });
  });

  it("accepts the earliest day still in the window", () => {
    expect(validateDocumentIssueDate({ maxAgeMonths: 3, issuedDate: "2026-05-07", today })).toEqual({
      ok: true,
    });
  });

  it("rejects a bill issued the day before the window opens", () => {
    const r = validateDocumentIssueDate({ maxAgeMonths: 3, issuedDate: "2026-05-06", today });
    expect(r).toEqual({
      ok: false,
      error: "This document must have been issued within the last 3 months.",
    });
  });
});
