import { describe, it, expect } from "vitest";
import { pickQuestions } from "./selection";

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
