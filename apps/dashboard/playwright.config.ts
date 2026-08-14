import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

/**
 * E2E BDD: i .feature in Gherkin vengono compilati in spec Playwright
 * (cartella .features-gen, generata, da non versionare/editare).
 */
const testDir = defineBddConfig({
  features: "tests/e2e/features/**/*.feature",
  steps: ["tests/e2e/steps/**/*.ts", "tests/e2e/fixtures.ts"],
});

const baseURL = process.env["E2E_BASE_URL"] ?? "http://localhost:8080";

export default defineConfig({
  testDir,
  fullyParallel: true,
  // Anti-flaky: attese esplicite generose (dev server con compilazione on-demand)
  timeout: 60_000,
  expect: { timeout: 15_000 },
  workers: process.env["CI"] ? 4 : 6,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  reporter: process.env["CI"] ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "tablet",
      use: { ...devices["Desktop Chrome"], viewport: { width: 820, height: 1180 } },
    },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
