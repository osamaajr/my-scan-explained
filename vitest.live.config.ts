import { defineConfig } from "vitest/config";
import path from "node:path";

// Live-model checks only; kept out of the regular `test` run. Needs LOVABLE_API_KEY.
export default defineConfig({
  test: { environment: "node", include: ["src/**/*.live.ts"], testTimeout: 30_000 },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
