import { fileURLToPath } from "node:url";

import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

/**
 * Profilo E2E "reale": nessun MSW, il server legge un event log fixture
 * deterministico via XPFLOW_EVENTS_FILE. Porta 8081 per convivere col
 * profilo demo (8080); outputDir bddgen distinto per lo stesso motivo.
 */
const testDir = defineBddConfig({
  outputDir: ".features-gen-reale",
  features: "tests/e2e/reale/features/**/*.feature",
  steps: ["tests/e2e/steps/**/*.ts", "tests/e2e/fixtures.ts"],
});

const baseURL = "http://localhost:8081";

export default defineConfig({
  testDir,
  fullyParallel: true,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  workers: process.env["CI"] ? 2 : 4,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  reporter: [["list"]],
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
  ],
  webServer: {
    command: "pnpm dev --port 8081",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      XPFLOW_EVENTS_FILE: fileURLToPath(
        new URL("./tests/e2e/reale/events.fixture.jsonl", import.meta.url),
      ),
      VITE_DEMO_MODE: "false",
    },
  },
});
