import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/domain/vitest.config.ts",
  "apps/functions/vitest.config.ts"
]);
