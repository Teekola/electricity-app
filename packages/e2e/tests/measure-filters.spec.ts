import { expect, test } from "@playwright/test";

test("bounds a measure, and says which Days that silently excludes", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Filters" }).click();

  const filters = page.getByRole("dialog", { name: "Filters" });

  await filters.getByRole("group", { name: "Consumption (MWh)" }).getByLabel("Min").fill("1");
  await filters.getByRole("button", { name: "Apply" }).click();

  await expect(page).toHaveURL(/consMin=1/);
  await expect(page.getByText("Consumption at least 1 MWh")).toBeVisible();

  /**
   * The only filter outcome the reader cannot check against the table: a bound on consumption
   * drops every Day that never measured it, which is most of the dataset.
   */
  await expect(page.getByText("Days that never measured consumption are excluded.")).toBeVisible();

  await page.getByRole("button", { name: "Clear consumption filter" }).click();

  await expect(page).not.toHaveURL(/consMin/);
  await expect(page.getByText("Days that never measured consumption are excluded.")).toBeHidden();
});
