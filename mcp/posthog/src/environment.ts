import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(packageDir, "../.env") });
loadEnv({ path: resolve(packageDir, "../.env.local"), override: true });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`[mcp-posthog] ❌ ${name} environment variable is not defined.`);
    console.error("[mcp-posthog] Set it in mcp/posthog/.env.local");
    process.exit(1);
  }
  return value;
}

export const POSTHOG_API_KEY = requireEnv("POSTHOG_API_KEY");
export const POSTHOG_PROJECT_ID = requireEnv("POSTHOG_PROJECT_ID");
export const POSTHOG_HOST = process.env.POSTHOG_HOST ?? "https://us.posthog.com";
