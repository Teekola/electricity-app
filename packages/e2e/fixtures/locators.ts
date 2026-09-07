import type { Locator, Page } from "@playwright/test";

/** Only a Day's own row carries a link, so this cannot pick up the header or the empty state. */
export function dayRows(page: Page): Locator {
  return page.getByRole("row").filter({ has: page.getByRole("link") });
}

export async function columnIndex(page: Page, header: string): Promise<number> {
  const headers = await page.getByRole("columnheader").allInnerTexts();

  return headers.findIndex((label) => label.includes(header));
}

export function listFooter(page: Page): Locator {
  return page.getByText(/^Showing days/);
}
