import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    exclude: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.next/**",
      "apps/**",
      "packages/**",
      "tests/**",
      "**/.claude/**",
    ],
    setupFiles: ["./vitest.setup.ts"],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reporter: ["text"],
    },
  },
});
