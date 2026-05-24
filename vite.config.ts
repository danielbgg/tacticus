import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },
  test: {
    environment: "jsdom",
    environmentMatchGlobs: [["tests/integration/**", "node"]],
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    resolve: {
      alias: { "@": resolve(__dirname, "src") },
    },
    coverage: {
      provider: "v8",
      thresholds: {
        "src/shared/lib/**": { lines: 95, functions: 95 },
        "src/features/*/domain/**": { lines: 95, functions: 95 },
        "src/db/queries/**": { lines: 85, functions: 85 },
        "src/features/*/components/**": { lines: 70, functions: 70 },
      },
    },
  },
});
