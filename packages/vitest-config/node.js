import { defineConfig } from "vitest/config";

export const nodeConfig = defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.spec.ts"],
    exclude: ["**/dist/**", "**/node_modules/**", "**/.next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text"],
    },
  },
});
