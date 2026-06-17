import { type Page, type Locator } from "@playwright/test";

/**
 * Drive the app's custom <Select> (a combobox button that opens a portal of
 * role="option" buttons) — the app uses these instead of native <select>, so
 * Playwright's selectOption() does not apply. Click the combobox, then the option.
 */
export async function chooseFrom(page: Page, combo: Locator, optionName: string | RegExp) {
  await combo.click();
  await page
    .getByRole("option", { name: optionName, exact: typeof optionName === "string" })
    .click();
}
