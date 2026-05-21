import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@budgetlink/config": fileURLToPath(new URL("../config/src/index.ts", import.meta.url))
    }
  },
  test: {
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"]
  }
});
