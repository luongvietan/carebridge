import { describe, it, expect } from "vitest";
import {
  MARKET_COOKIE,
  localeForCountry,
  parseSelectedMarket,
  isMarketOpen,
} from "./market";

describe("parseSelectedMarket", () => {
  it("accepts a stored choice for a known market", () => {
    expect(parseSelectedMarket("GB")).toBe("GB");
    expect(parseSelectedMarket("PT")).toBe("PT");
  });

  it("falls back to the home market on anything unrecognised", () => {
    for (const value of [null, undefined, "", "US", "pt", "GB; drop table countries"]) {
      expect(parseSelectedMarket(value)).toBe("PT");
    }
  });

  it("exposes the cookie name the action writes", () => {
    expect(MARKET_COOKIE).toBe("cbc_market");
  });
});

describe("Portugal-first launch policy", () => {
  it("keeps the UK closed even with a stale live flag or private preview", () => {
    expect(isMarketOpen("GB", true, true)).toBe(false);
    expect(isMarketOpen("GB", true, false)).toBe(false);
  });
  it("opens Portugal only when approved live or inside the private preview", () => {
    expect(isMarketOpen("PT", false, false)).toBe(false);
    expect(isMarketOpen("PT", true, false)).toBe(true);
    expect(isMarketOpen("PT", false, true)).toBe(true);
    expect(isMarketOpen("US", true, true)).toBe(false);
  });
});

describe("localeForCountry", () => {
  it("maps each market to its document locale", () => {
    expect(localeForCountry("GB")).toBe("en-GB");
    expect(localeForCountry("PT")).toBe("pt-PT");
  });
});
