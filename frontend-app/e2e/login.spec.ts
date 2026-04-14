import { test, expect } from "@playwright/test";

test.describe("Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/auth/login/", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access: "e2e-access-token",
          refresh: "e2e-refresh-token",
          user: {
            id: 1,
            username: "e2e_user",
            email: "e2e-login@example.com",
            first_name: "",
            last_name: "",
            phone: null,
            is_active: true,
            email_verified_at: null,
            deleted_at: null,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
          },
        }),
      });
    });

    const orgJson = {
      id: 1,
      name: "E2E Test Org",
      org_type: "property_manager",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    await page.route("**/api/v1/auth/me/orgs/", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([orgJson]),
      });
    });

    await page.route("**/api/v1/orgs/**", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      const pathname = new URL(route.request().url()).pathname.replace(/\/$/, "");
      const detail = pathname.match(/\/orgs\/(\d+)$/);
      if (detail) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(orgJson),
        });
        return;
      }
      if (pathname.endsWith("/orgs")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([orgJson]),
        });
        return;
      }
      await route.continue();
    });
  });

  test("submits valid credentials and opens the dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-email").fill("e2e-login@example.com");
    await page.getByTestId("login-password").fill("password12");
    await page.getByTestId("login-submit").click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId("dashboard")).toBeVisible();
    await expect(page.getByTestId("user-email")).toHaveText("e2e-login@example.com");
  });
});
