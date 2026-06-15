import { describe, it, expect } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("quotes commas, quotes and newlines (RFC-4180, CRLF)", () => {
    expect(toCsv([{ a: "x,y", b: 'he said "hi"' }])).toBe(
      'a,b\r\n"x,y","he said ""hi"""',
    );
  });

  it("emits a header row even with no data", () => {
    expect(toCsv([], ["a", "b"])).toBe("a,b\r\n");
  });

  it("renders null/undefined as empty fields", () => {
    expect(toCsv([{ a: null, b: undefined }], ["a", "b"])).toBe("a,b\r\n,");
  });

  it("quotes fields containing newlines", () => {
    expect(toCsv([{ a: "line1\nline2" }], ["a"])).toBe('a\r\n"line1\nline2"');
  });
});
