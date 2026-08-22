import { describe, it, expect } from "vitest";
import {
  MARKET_COOKIE,
  localeForCountry,
  parseSelectedMarket,
} from "./market";

describe("parseSelectedMarket", () => {
  it("accepts a stored choice for a known market", () => {
    expect(parseSelectedMarket("GB")).toBe("GB");
    expect(parseSelectedMarket("PT")).toBe("PT");
  });

  it("falls back to the home market on anything unrecognised", () => {
    expect(parseSelectedMarket(null)).toBe("GB");
    expect(parseSelectedMarket(undefined)).toBe("GB");
    expect(parseSelectedMarket("")).toBe("GB");
    expect(parseSelectedMarket("US")).toBe("GB");
    expect(parseSelectedMarket("pt")).toBe("GB"); // case matters in the cookie
    expect(parseSelectedMarket("GB; drop table countries")).toBe("GB");
  });

  it("exposes the cookie name the action writes", () => {
    expect(MARKET_COOKIE).toBe("cbc_market");
  });
});

describe("localeForCountry", () => {
  it("maps each market to its document locale", () => {
    expect(localeForCountry("GB")).toBe("en-GB");
    expect(localeForCountry("PT")).toBe("pt-PT");
  });
});
