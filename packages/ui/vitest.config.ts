import { defineConfig, mergeConfig } from "vitest/config";
import { webConfig } from "@repo/vitest-config/web";

export default mergeConfig(
  webConfig,
  defineConfig({
    test: {
      setupFiles: ["./vitest.setup.ts"],
    },
  }),
);
