import ExcelJS from "exceljs";

function defuse(v: unknown): ExcelJS.CellValue {
  if (v == null) return "";
  if (typeof v === "string") {
    return /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  }
  return v as ExcelJS.CellValue;
}

/** Serialise rows to a single-sheet XLSX workbook buffer. */
export async function toXlsx(
  rows: Record<string, unknown>[],
  headers?: string[],
): Promise<Buffer> {
  const cols = headers ?? (rows[0] ? Object.keys(rows[0]) : []);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Export");
  ws.addRow(cols);
  for (const r of rows) {
    ws.addRow(cols.map((c) => defuse(r[c])));
  }
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
