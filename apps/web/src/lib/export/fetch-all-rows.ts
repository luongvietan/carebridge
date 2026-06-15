/** Matches `max_rows` in `supabase/config.toml` and hosted Supabase defaults. */
export const EXPORT_PAGE_SIZE = 1000;

/** Fetch every row from a paginated PostgREST query (`.range(from, to)`). */
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
    if (data.length < EXPORT_PAGE_SIZE) break;
    offset += EXPORT_PAGE_SIZE;
  }
  return { rows, error: null };
}
