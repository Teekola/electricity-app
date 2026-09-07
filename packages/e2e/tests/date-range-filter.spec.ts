import { expect, test } from "@playwright/test";

import { CALENDAR } from "../fixtures/dataset.js";
import { listFooter } from "../fixtures/locators.js";

test("narrows the list to a range of Days and clears it again", async ({ page }) => {
  await page.goto("/");

  const footer = listFooter(page);
  const unfiltered = await footer.innerText();

  await page.getByRole("button", { name: "All days" }).click();

  const september = page.getByRole("grid", { name: CALENDAR.grid });

  await september.getByRole("button", { name: new RegExp(CALENDAR.from.label) }).click();
  await september.getByRole("button", { name: new RegExp(CALENDAR.to.label) }).click();

  await expect(page).toHaveURL(new RegExp(`dateFrom=${CALENDAR.from.iso}`));
  await expect(page).toHaveURL(new RegExp(`dateTo=${CALENDAR.to.iso}`));

  await page.keyboard.press("Escape");

  await expect(
    page.getByRole("button", { name: `${CALENDAR.from.short} – ${CALENDAR.to.short}` }),
  ).toBeVisible();
  await expect(footer).toContainText("matching days.");
  await expect(footer).not.toHaveText(unfiltered);

  await page.getByRole("button", { name: "Reset" }).click();

  await expect(page).not.toHaveURL(/dateFrom/);
  await expect(page.getByRole("button", { name: "All days" })).toBeVisible();
  await expect(footer).toHaveText(unfiltered);
});
