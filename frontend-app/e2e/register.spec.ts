import { test, expect } from "@playwright/test";

test.describe("Register", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/auth/register/", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          detail:
            "Registration successful. Check your email to activate your account.",
          user_id: 1,
        }),
      });
    });
  });

  test("submits the form and shows success", async ({ page }) => {
    await page.goto("/register");
    await page.getByTestId("register-email").fill("e2e-register@example.com");
    await page.getByTestId("register-password").fill("password12");
    await page.getByTestId("register-org-name").fill("E2E Org");
    await page.getByTestId("register-submit").click();
    await expect(page.getByTestId("register-success")).toBeVisible();
    await expect(page.getByTestId("register-success")).toContainText(
      "Registration successful",
    );
  });
});
