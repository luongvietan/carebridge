import { describe, it, expect } from "vitest";
import { EXPORT_PAGE_SIZE, fetchAllPages } from "./fetch-all-rows";

describe("fetchAllPages", () => {
  it("concatenates multiple pages until a short page", async () => {
    const pages = [
      Array.from({ length: EXPORT_PAGE_SIZE }, (_, i) => ({ id: i })),
      [{ id: EXPORT_PAGE_SIZE }],
    ];
    let call = 0;
    const { rows, error } = await fetchAllPages(async (from, to) => {
      const data = pages[call++] ?? [];
      expect(from).toBe(call === 1 ? 0 : EXPORT_PAGE_SIZE);
      expect(to).toBe(call === 1 ? EXPORT_PAGE_SIZE - 1 : EXPORT_PAGE_SIZE + EXPORT_PAGE_SIZE - 1);
      return { data, error: null };
    });
    expect(error).toBeNull();
    expect(rows.length).toBe(EXPORT_PAGE_SIZE + 1);
  });

  it("returns an empty array when the first page is empty", async () => {
    const { rows, error } = await fetchAllPages(async () => ({ data: [], error: null }));
    expect(error).toBeNull();
    expect(rows).toEqual([]);
  });
});
