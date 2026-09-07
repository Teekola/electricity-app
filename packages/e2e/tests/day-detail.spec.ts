import { expect, test } from "@playwright/test";

import { DAY_WITH_CONSUMPTION } from "../fixtures/dataset.js";
import { dayRows } from "../fixtures/locators.js";

test("opens a Day from the list and returns to the list as it was left", async ({ page }) => {
  await page.goto("/?sort=price&dir=asc");

  const firstDayLink = dayRows(page).first().getByRole("link");
  const day = await firstDayLink.innerText();

  await firstDayLink.click();

  await expect(page).toHaveURL(/\/days\/\d{4}-\d{2}-\d{2}/);
  await expect(page.getByRole("heading", { name: `Electricity data on ${day}` })).toBeVisible();
  await expect(page.getByText("Cheapest hours")).toBeVisible();
  await expect(page.getByText("Longest negative price streak")).toBeVisible();

  await page.getByRole("link", { name: "All days" }).click();

  // The ordering the reader came from is carried back, so the breadcrumb is not a reset.
  await expect(page).toHaveURL(/sort=price/);
  await expect(page).toHaveURL(/dir=asc/);
});

test("draws the price and production charts for a Day", async ({ page }) => {
  await page.goto(`/days/${DAY_WITH_CONSUMPTION}`);

  // Both charts load on the client only, so they arrive after their skeletons.
  await expect(
    page.getByRole("application", { name: "Production and consumption by hour" }),
  ).toBeVisible();
  await expect(page.getByRole("application", { name: "Price by hour" })).toBeVisible();
});
