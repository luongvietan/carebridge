/**
 * Neutralise spreadsheet formula prefixes so attacker-controlled cell values
 * cannot execute when an admin opens the export in Excel / LibreOffice / Sheets.
 * Cells starting with `=`, `+`, `-`, `@`, TAB or CR get a single-quote prefix.
 */
function defuseFormula(s: string): string {
  // Leave plain numeric values (incl. negatives and decimals) untouched so
  // financial figures like "-50.00" stay numeric in the spreadsheet; only
  // genuine formula-trigger prefixes on other text are neutralised.
  if (/^-?\d+(\.\d+)?$/.test(s)) return s;
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

/** Serialise rows to an RFC-4180 CSV string (CRLF). Always emits a header row. */
export function toCsv(
  rows: Record<string, unknown>[],
  headers?: string[],
): string {
  const cols = headers ?? (rows[0] ? Object.keys(rows[0]) : []);
  const esc = (v: unknown): string => {
    const raw = v == null ? "" : String(v);
    const s = defuseFormula(raw);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  let out = cols.map(esc).join(",") + "\r\n";
  out += rows.map((r) => cols.map((c) => esc(r[c])).join(",")).join("\r\n");
  return out;
}
