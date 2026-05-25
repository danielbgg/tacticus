import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { copyFileSync, existsSync } from "fs";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// Copia stockfish.js + stockfish.wasm para public/ a cada build/dev start.
// O worker usa importScripts("/stockfish.js") que exige os dois arquivos em public/.
function pluginCopiarStockfish() {
  return {
    name: "copiar-stockfish",
    buildStart() {
      const src = resolve(__dirname, "node_modules/stockfish/src");
      const dst = resolve(__dirname, "public");
      for (const arq of ["stockfish.js", "stockfish.wasm"]) {
        const origem = resolve(src, arq);
        if (existsSync(origem)) copyFileSync(origem, resolve(dst, arq));
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
