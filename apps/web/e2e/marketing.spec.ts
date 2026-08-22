import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * The homepage country switch reads `countries.is_live` from the database, so
 * this spec exercises the whole story on the local stack: Portugal starts as a
 * "launching soon" badge, going live makes it selectable, and selecting it
 * moves the visitor's market.
 */
test("market switch: launching soon until live, then selectable", async ({ page }) => {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // Start from a known state: Portugal not yet live.
  await admin.from("countries").update({ is_live: false }).eq("code", "PT");

  await page.goto("/");
  const markets = page.getByLabel("Countries we serve");
  const uk = markets.getByRole("button", { name: /United Kingdom/ });
  const ptChip = markets.locator("li").filter({ hasText: "Portugal" });

  await expect(uk).toHaveAttribute("aria-pressed", "true");

  // Not live: Portugal is a badge, not a button.
  await expect(ptChip).toContainText("launching soon");
  expect(await markets.getByRole("button", { name: /Portugal/ }).count()).toBe(0);

  // Go live: the badge becomes a real choice, with no code change.
  await admin.from("countries").update({ is_live: true }).eq("code", "PT");
  await page.goto("/");
  const pt = markets.getByRole("button", { name: /Portugal/ });
  await expect(pt).toBeVisible();

  await pt.click();
  await expect(pt).toHaveAttribute("aria-pressed", "true");
  await expect(uk).not.toHaveAttribute("aria-pressed", "true");

  // Restore: Portugal goes back behind its regulatory gate.
  await admin.from("countries").update({ is_live: false }).eq("code", "PT");
  await page.goto("/");
  await expect(markets.locator("li").filter({ hasText: "Portugal" })).toContainText(
    "launching soon",
  );
});
