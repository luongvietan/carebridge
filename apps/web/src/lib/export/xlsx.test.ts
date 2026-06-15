import { describe, it, expect } from "vitest";
import { toXlsx } from "./xlsx";

describe("toXlsx", () => {
  it("returns a non-empty buffer with the zip magic bytes", async () => {
    const buf = await toXlsx([{ a: 1, b: 2 }], ["a", "b"]);
    expect(buf.length).toBeGreaterThan(0);
    expect(buf.subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  });
});
