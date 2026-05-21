import { test } from "@playwright/test";

test.describe("BudgetLink web smoke", () => {
  test("loads the sign-in screen", async ({ page }) => {
    await page.goto("/");
    await page.getByText("BudgetLink").waitFor();
  });
});
