import { describe, it, expect } from "vitest";
import { EXPORT_PAGE_SIZE, fetchAllPages } from "./fetch-all-rows";

/**
 * Simulate a PostgREST endpoint over `total` rows that never returns more than
 * `cap` rows per request — models a hosted `max_rows` set lower than the page
 * size we request. Advancing by the requested window (rather than the rows
 * actually returned) would silently truncate such an export.
 */
function makeServer(total: number, cap: number) {
  let calls = 0;
  const fetchPage = async (from: number, to: number) => {
    calls += 1;
    const end = Math.min(to + 1, from + cap, total);
    const data: { id: number }[] = [];
    for (let i = from; i < end; i += 1) data.push({ id: i });
    return { data, error: null };
  };
  return { fetchPage, getCalls: () => calls };
}

describe("fetchAllPages", () => {
  it("fetches every row when the server returns full pages", async () => {
    const { fetchPage } = makeServer(EXPORT_PAGE_SIZE + 1, EXPORT_PAGE_SIZE);
    const { rows, error } = await fetchAllPages(fetchPage);
    expect(error).toBeNull();
    expect(rows.length).toBe(EXPORT_PAGE_SIZE + 1);
  });

  it("fetches every row even when the server caps pages below the requested size", async () => {
    // Hosted max_rows = 2 while we request EXPORT_PAGE_SIZE per page.
    const { fetchPage } = makeServer(5, 2);
    const { rows, error } = await fetchAllPages(fetchPage);
    expect(error).toBeNull();
    expect((rows as { id: number }[]).map((r) => r.id)).toEqual([0, 1, 2, 3, 4]);
  });

  it("returns an empty array when the first page is empty", async () => {
    const { rows, error } = await fetchAllPages(async () => ({ data: [], error: null }));
    expect(error).toBeNull();
    expect(rows).toEqual([]);
  });

  it("propagates an error from a page fetch", async () => {
    const { rows, error } = await fetchAllPages(async () => ({ data: null, error: new Error("boom") }));
    expect(rows).toEqual([]);
    expect((error as Error).message).toBe("boom");
  });
});
