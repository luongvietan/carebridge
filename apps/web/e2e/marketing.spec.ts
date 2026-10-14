import { test, expect } from "@playwright/test";
import { localService } from "./local-market";

/**
 * The homepage country switch reads `countries.is_live` from the database, so
 * this spec exercises the whole story on the local stack: Portugal starts as a
 * "launching soon" badge, going live makes it selectable while UK stays closed.
 */
test("Portugal stays default and UK stays launching soon when Portugal opens", async ({ page }) => {
  const admin = localService();
  const { data: prior, error } = await admin.from("countries").select("code,is_live").in("code", ["PT", "GB"]);
  if (error || !prior) throw error ?? new Error("Market state unavailable");
  try {

  // Start from a known state: Portugal not yet live.
  await admin.from("countries").update({ is_live: false }).eq("code", "PT");

  await page.goto("/");
  const markets = page.getByRole("list", { name: "Países onde operamos" });
  const uk = markets.locator("li").filter({ hasText: "Reino Unido" });
  const ptChip = markets.locator("li").filter({ hasText: "Portugal" });

  await expect(uk).toContainText("em breve");
  await expect(markets.getByRole("button", { name: /Reino Unido/ })).toHaveCount(0);

  // Not live: Portugal is a badge, not a button.
  await expect(ptChip).toContainText("em breve");
  expect(await markets.getByRole("button", { name: /Portugal/ }).count()).toBe(0);

  // Go live: the badge becomes a real choice, with no code change.
  // A stale GB live flag must not reopen UK under the PT-first launch policy.
  const { error: openError } = await admin.from("countries").update({ is_live: true }).in("code", ["PT", "GB"]);
  if (openError) throw openError;
  await page.goto("/");
  const pt = markets.getByRole("button", { name: /Portugal/ });
  await expect(pt).toBeVisible();

  await pt.click();
  await expect(pt).toHaveAttribute("aria-pressed", "true");
  await expect(uk).toContainText("em breve");
  await expect(markets.getByRole("button", { name: /Reino Unido/ })).toHaveCount(0);

  // The dictionary follows the market: the hero and the journey speak Portuguese.
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Ligamos Famílias e Organizações",
  );
  // The journey section sits below the fold where the scroll-reveal keeps it
  // out of the a11y tree until scrolled — assert on the DOM, not visibility.
  await expect(page.locator("h2", { hasText: "Como funciona" })).toHaveCount(1);
  await expect(
    page.locator("p", { hasText: "Da verificação ao pagamento" }),
  ).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Solicitar um profissional/ })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-PT");

  // Restore: Portugal goes back behind its regulatory gate.
  await admin.from("countries").update({ is_live: false }).eq("code", "PT");
  await page.goto("/");
  await expect(markets.locator("li").filter({ hasText: "Portugal" })).toContainText(
    "em breve",
  );
  } finally {
    for (const market of prior) {
      const { error: restoreError } = await admin.from("countries").update({ is_live: market.is_live }).eq("code", market.code);
      if (restoreError) throw restoreError;
    }
  }
});
