import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = dirname(fileURLToPath(import.meta.url));
// `.env` then `.env.local` (override) — paths relative to this package, not cwd
loadEnv({ path: resolve(packageDir, "../.env") });
loadEnv({ path: resolve(packageDir, "../.env.local"), override: true });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(
      `[mcp-database] ❌ ${name} environment variable is not defined.`,
    );
    console.error(
      "[mcp-database] Set it in .claude/settings.json → mcpServers.database.env." +
        name,
    );
    process.exit(1);
  }
  return value;
}

export const DATABASE_URL = requireEnv("DATABASE_URL");
