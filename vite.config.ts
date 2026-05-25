import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { copyFileSync, existsSync } from "fs";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// Copia stockfish.js para public/ se o pacote estiver instalado
function pluginCopiarStockfish() {
  return {
    name: "copiar-stockfish",
    buildStart() {
      const candidatos = [
        "node_modules/stockfish/src/stockfish.js",
        "node_modules/stockfish/stockfish.js",
      ];
      const dst = resolve(__dirname, "public/stockfish.js");
      for (const rel of candidatos) {
        const src = resolve(__dirname, rel);
        if (existsSync(src)) {
          copyFileSync(src, dst);
          break;
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), pluginCopiarStockfish()],
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
    exclude: ["node_modules/**", "tests/e2e/**"],
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
