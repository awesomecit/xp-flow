import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

/**
 * Test unit / integration (veloci, in-memory).
 * Gli E2E in Gherkin girano con Playwright: vedi playwright.config.ts.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.spec.{ts,tsx}", "src/**/*.spec.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**"],
    restoreMocks: true,
    // Base URL assoluta: in node la fetch relativa non esiste; MSW intercetta */api/events.
    env: { VITE_API_BASE_URL: "http://localhost/api" },
  },
});
