/** Window size we request per page. Pagination does NOT assume the server
 *  honours it — a hosted `max_rows` lower than this is handled by advancing
 *  by the number of rows actually returned (see below). */
export const EXPORT_PAGE_SIZE = 1000;

/** Fetch every row from a paginated PostgREST query (`.range(from, to)`).
 *  Stops only when a page comes back empty, advancing the offset by the rows
 *  actually returned. This is robust to a server-side row cap below
 *  EXPORT_PAGE_SIZE, which would otherwise truncate the export silently. */
export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => Promise<{ data: T[] | null; error: unknown }>,
): Promise<{ rows: T[]; error: unknown }> {
  const rows: T[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await fetchPage(offset, offset + EXPORT_PAGE_SIZE - 1);
    if (error) return { rows: [], error };
    if (!data?.length) break;
    rows.push(...data);
    offset += data.length;
  }
  return { rows, error: null };
}
