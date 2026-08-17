import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Config Vite della landing del catalogo pattern (issue #6).
 * Porta 8090 fissa (8080 è già la dashboard): evita collisioni quando le
 * due app girano in dev insieme.
 */
export default defineConfig({
  server: { port: 8090 },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  plugins: [react(), tailwindcss()],
});
