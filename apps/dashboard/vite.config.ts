import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

/**
 * Config scritta a mano (sostituisce il preset @lovable.dev/vite-tanstack-config).
 * Porta 8080 fissa: è la baseURL attesa da Playwright (il preset la otteneva
 * via sandbox detection).
 */
export default defineConfig({
  server: { port: 8080 },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  plugins: [
    // srcDirectory default "src"; entry "server" -> src/server.ts, il wrapper
    // SSR con l'intercettore REST /api/flow/*.
    tanstackStart({ server: { entry: "server" } }),
    viteReact(),
    tailwindcss(),
  ],
});
