import ExcelJS from "exceljs";

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
    ws.addRow(cols.map((c) => (r[c] == null ? "" : (r[c] as ExcelJS.CellValue))));
  }
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
