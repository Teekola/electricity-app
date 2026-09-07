import { expect, test } from "@playwright/test";

import { dayRows } from "../fixtures/locators.js";

test("orders, pages and resizes the list through the URL", async ({ page }) => {
  await page.goto("/");

  const rows = dayRows(page);
  const firstDayBefore = await rows.first().getByRole("link").innerText();

  await page.getByRole("button", { name: "Production (MWh)" }).click();

  await expect(page).toHaveURL(/sort=prod/);
  await expect(page.getByRole("columnheader", { name: "Production (MWh)" })).toHaveAttribute(
    "aria-sort",
    /ascending|descending/,
  );
  // Reordering the whole dataset, not just the page in hand, so the top Day changes.
  await expect(rows.first().getByRole("link")).not.toHaveText(firstDayBefore);

  // A pager control is an anchor Base UI reports as a button. Exact, or page 28 matches too.
  await page.getByRole("button", { name: "Go to page 2", exact: true }).click();

  await expect(page).toHaveURL(/page=2/);
  await expect(page).toHaveURL(/sort=prod/);

  await page.getByRole("combobox", { name: "Days per page" }).click();
  await page.getByRole("option", { name: "25", exact: true }).click();

  // Resizing returns to page 1, because the page the reader was on no longer means the same thing.
  await expect(page).toHaveURL(/size=25/);
  await expect(rows).toHaveCount(25);
});
