import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { toXlsx } from "./xlsx";

describe("toXlsx", () => {
  it("returns a non-empty buffer with the zip magic bytes", async () => {
    const buf = await toXlsx([{ a: 1, b: 2 }], ["a", "b"]);
    expect(buf.length).toBeGreaterThan(0);
    expect(buf.subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  });

  it("defuses formula-prefixed string cells to prevent XLSX formula injection", async () => {
    const buf = await toXlsx([{ a: "=HYPERLINK(1,2)", b: "+1" }], ["a", "b"]);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as Parameters<typeof wb.xlsx.load>[0]);
    const ws = wb.getWorksheet("Export")!;
    expect(ws.getCell("A2").value).toBe("'=HYPERLINK(1,2)");
    expect(ws.getCell("B2").value).toBe("'+1");
  });
});
