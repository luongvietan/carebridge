import { describe, it, expect } from "vitest";
import {
  MAX_RECORDED_FAILURES_PER_WINDOW,
  describeAuthError,
  normalizeEmail,
  parseClientIp,
  shouldRecordFailure,
  truncateUserAgent,
} from "./sign-in-rules";

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Jane.Smith@Example.COM ")).toBe("jane.smith@example.com");
  });
});

describe("shouldRecordFailure", () => {
  it("records while under the cap", () => {
    expect(shouldRecordFailure(0)).toBe(true);
    expect(shouldRecordFailure(MAX_RECORDED_FAILURES_PER_WINDOW - 1)).toBe(true);
  });
  it("stops recording at the cap — the attempt is still rejected either way", () => {
    expect(shouldRecordFailure(MAX_RECORDED_FAILURES_PER_WINDOW)).toBe(false);
    expect(shouldRecordFailure(MAX_RECORDED_FAILURES_PER_WINDOW + 50)).toBe(false);
  });
});

describe("parseClientIp", () => {
  it("takes the original caller from an x-forwarded-for chain", () => {
    expect(parseClientIp("203.0.113.7, 70.41.3.18")).toBe("203.0.113.7");
  });
  it("accepts a plain IPv4 and IPv6", () => {
    expect(parseClientIp("192.168.0.4")).toBe("192.168.0.4");
    expect(parseClientIp("::1")).toBe("::1");
    expect(parseClientIp("2001:db8::8a2e:370:7334")).toBe("2001:db8::8a2e:370:7334");
  });
  it("rejects anything that would not survive the inet column", () => {
    expect(parseClientIp("not-an-ip")).toBe(null);
    expect(parseClientIp("999.999.999.999")).toBe(null);
    expect(parseClientIp("drop table audit_log;--")).toBe(null);
    expect(parseClientIp("")).toBe(null);
    expect(parseClientIp(null)).toBe(null);
    expect(parseClientIp(undefined)).toBe(null);
  });
});

describe("truncateUserAgent", () => {
  it("trims and caps at 300 characters", () => {
    const long = "x".repeat(500);
    expect(truncateUserAgent(`  ${long}  `)).toBe("x".repeat(300));
  });
  it("passes short agents through and drops empty ones", () => {
    expect(truncateUserAgent("Mozilla/5.0")).toBe("Mozilla/5.0");
    expect(truncateUserAgent("   ")).toBe(null);
    expect(truncateUserAgent(null)).toBe(null);
  });
});

describe("describeAuthError", () => {
  it("names the specific provider codes worth distinguishing", () => {
    expect(describeAuthError("email_not_confirmed")).toBe("Email not confirmed");
    expect(describeAuthError("over_request_rate_limit")).toBe("Provider rate limit reached");
  });
  it("stays generic for everything else, including unknown codes", () => {
    expect(describeAuthError("invalid_credentials")).toBe("Invalid credentials");
    expect(describeAuthError(undefined)).toBe("Invalid credentials");
  });
});
