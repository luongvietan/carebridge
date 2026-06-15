/** Serialise rows to an RFC-4180 CSV string (CRLF). Always emits a header row. */
export function toCsv(
  rows: Record<string, unknown>[],
  headers?: string[],
): string {
  const cols = headers ?? (rows[0] ? Object.keys(rows[0]) : []);
  const esc = (v: unknown): string => {
    const s = v == null ? "" : String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  let out = cols.map(esc).join(",") + "\r\n";
  out += rows.map((r) => cols.map((c) => esc(r[c])).join(",")).join("\r\n");
  return out;
}
