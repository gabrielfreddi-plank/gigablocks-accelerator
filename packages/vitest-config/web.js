import { defineConfig } from "vitest/config";

export const webConfig = defineConfig({
  test: {
    environment: "jsdom",
    include: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    exclude: ["**/dist/**", "**/node_modules/**", "**/.next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text"],
    },
  },
});
