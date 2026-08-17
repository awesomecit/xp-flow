import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

/**
 * Test unit / component (veloci, in-memory, no server reale).
 * Allineato ad apps/dashboard/vitest.config.ts per convenzione di workspace.
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
    include: ["tests/unit/**/*.spec.{ts,tsx}"],
    exclude: ["node_modules/**"],
    restoreMocks: true,
  },
});
