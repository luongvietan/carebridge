import { describe, it, expect } from "vitest";
import { pickQuestions, pickStratified } from "./selection";

const pool = ["q1", "q2", "q3", "q4", "q5"];

describe("pickQuestions", () => {
  it("returns the requested count", () => {
    expect(pickQuestions(pool, 3)).toHaveLength(3);
  });
  it("returns unique items only", () => {
    const got = pickQuestions(pool, 5);
    expect(new Set(got).size).toBe(got.length);
  });
  it("caps at pool size when n is larger", () => {
    expect(pickQuestions(pool, 99)).toHaveLength(5);
  });
  it("draws only from the pool", () => {
    expect(pickQuestions(pool, 4).every((q) => pool.includes(q))).toBe(true);
  });
});

describe("pickStratified", () => {
  const common = Array.from({ length: 50 }, (_, i) => `c${i}`);
  const role = Array.from({ length: 6 }, (_, i) => `r${i}`);

  it("draws commonN from common and roleN from role-specific", () => {
    const got = pickStratified(common, role, 15, 5);
    expect(got).toHaveLength(20);
    expect(got.filter((q) => q.startsWith("c"))).toHaveLength(15);
    expect(got.filter((q) => q.startsWith("r"))).toHaveLength(5);
  });

  it("returns unique items only", () => {
    const got = pickStratified(common, role, 15, 5);
    expect(new Set(got).size).toBe(got.length);
  });

  it("degrades gracefully when a pool is smaller than requested", () => {
    const got = pickStratified(["c0", "c1"], ["r0"], 15, 5);
    expect(got).toHaveLength(3);
    expect(got.filter((q) => q.startsWith("c"))).toHaveLength(2);
    expect(got.filter((q) => q.startsWith("r"))).toHaveLength(1);
  });

  it("tops up to the full total from common when no role-specific questions exist", () => {
    const got = pickStratified(common, [], 15, 5);
    expect(got).toHaveLength(20);
    expect(got.every((q) => q.startsWith("c"))).toBe(true);
  });

  it("tops up a partial role-specific shortfall from common", () => {
    // 2 role-specific available, 5 requested -> 3 short, topped up from common.
    const got = pickStratified(common, ["r0", "r1"], 15, 5);
    expect(got).toHaveLength(20);
    expect(got.filter((q) => q.startsWith("r"))).toHaveLength(2);
    expect(got.filter((q) => q.startsWith("c"))).toHaveLength(18);
  });
});
