import { describe, it, expect } from "vitest";
import { validateDocumentExpiry } from "./document-expiry";

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
