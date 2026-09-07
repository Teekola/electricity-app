import { expect, test } from "@playwright/test";

import { NEWEST_DAY, NEWEST_DAY_HOURS } from "../fixtures/dataset.js";
import { columnIndex } from "../fixtures/locators.js";

test("lists Daily Statistics newest first, flagging what the dataset does not hold", async ({
  page,
}) => {
  await page.goto("/");

  const newest = page
    .getByRole("row")
    .filter({ has: page.getByRole("link", { name: NEWEST_DAY.label }) });

  await expect(newest).toBeVisible();

  await expect(
    newest.getByRole("button", {
      name: new RegExp(
        `Incomplete day: the dataset holds ${String(NEWEST_DAY_HOURS.withData)} of ${String(NEWEST_DAY_HOURS.inDay)} hours`,
      ),
    }),
  ).toBeVisible();

  const consumption = await columnIndex(page, "Consumption");

  await expect(newest.getByRole("cell").nth(consumption)).toHaveText("—");
});
