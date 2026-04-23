/**
 * MCP Server — Supabase Database (gigablocks-accelerator)
 *
 * Connects via Postgres directly to Supabase using the connection string from
 * the Transaction Pooler (port 6543) or Session Pooler (port 5432).
 *
 * Required environment variables:
 *   DATABASE_URL  — postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
 *
 * Primitives:
 *   Tools:    query, schema, describe-table, list-users, list-companies, get-company-overview, get-user-companies
 *   Resource: tables
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import postgres from "postgres";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("[mcp-database] ❌ DATABASE_URL environment variable is not defined.");
  console.error(
    "[mcp-database] Set it in .claude/settings.json → mcpServers.database.env.DATABASE_URL"
  );
  process.exit(1);
}

// max:5 because each MCP invocation is independent — we don't need a large pool
const sql = postgres(DATABASE_URL, {
  max: 5,
  // Force SSL for Supabase cloud; remove if using local
  ssl: DATABASE_URL.includes("supabase.co") ? "require" : false,
  // Do not run implicit transactions — ensures read-only at the connection level
  onnotice: () => {},
});

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "gigablocks-database",
  version: "1.0.0",
  description: "Read-only access to the gigablocks-accelerator Supabase database",
});

// ---------------------------------------------------------------------------
// TOOL: query
// Executes read-only SQL and returns the results.
// ---------------------------------------------------------------------------
server.registerTool(
  "query",
  {
    description:
      "Executes a read-only SQL query on the project database and returns the results as JSON. Only SELECT statements are allowed.",
    inputSchema: {
      sql: z
        .string()
        .describe("SQL query (SELECT only). E.g: SELECT * FROM public.users LIMIT 10"),
    },
  },
  async ({ sql: query }) => {
    // Block any commands that are not SELECT (basic protection)
    const normalized = query.trim().toUpperCase();
    const forbidden = ["INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER", "TRUNCATE", "GRANT", "REVOKE"];
    const startsWithForbidden = forbidden.some((kw) => normalized.startsWith(kw));

    if (startsWithForbidden) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Only SELECT queries are allowed. Blocked command: ${query.trim().split(" ")[0]}`,
          },
        ],
        isError: true,
      };
    }

    try {
      // Execute inside a read-only transaction for extra safety
      const rows = await sql.begin("read only", async (tx) => {
        return tx.unsafe(query);
      });

      if (rows.length === 0) {
        return {
          content: [{ type: "text", text: "✅ Query executed. No rows returned." }],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: [
              `✅ ${rows.length} row(s) returned:`,
              "```json",
              JSON.stringify(rows, null, 2),
              "```",
            ].join("\n"),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `❌ Query error:\n${(err as Error).message}` }],
        isError: true,
      };
    }
  }
);

// ---------------------------------------------------------------------------
// TOOL: schema
// Returns the full schema: tables, columns, types, FK, indexes.
// ---------------------------------------------------------------------------
server.registerTool(
  "schema",
  {
    description:
      "Returns the full database schema: tables, columns (name, type, nullable, default), foreign keys, and indexes from the public schema.",
    inputSchema: {},
  },
  async () => {
    try {
      const [columns, foreignKeys, indexes] = await Promise.all([
        // Columns
        sql`
          SELECT
            c.table_name,
            c.column_name,
            c.data_type,
            c.udt_name,
            c.is_nullable,
            c.column_default,
            c.ordinal_position
          FROM information_schema.columns c
          WHERE c.table_schema = 'public'
          ORDER BY c.table_name, c.ordinal_position
        `,

        // Foreign Keys
        sql`
          SELECT
            tc.table_name AS from_table,
            kcu.column_name AS from_column,
            ccu.table_name AS to_table,
            ccu.column_name AS to_column,
            rc.delete_rule
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
          JOIN information_schema.referential_constraints rc
            ON tc.constraint_name = rc.constraint_name
          JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = rc.unique_constraint_name AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
          ORDER BY from_table, from_column
        `,

        // Indexes
        sql`
          SELECT
            tablename AS table_name,
            indexname AS index_name,
            indexdef AS definition
          FROM pg_indexes
          WHERE schemaname = 'public'
          ORDER BY tablename, indexname
        `,
      ]);

      // Group columns by table
      type ColRow = (typeof columns)[number];
      type FkRow = (typeof foreignKeys)[number];
      type IdxRow = (typeof indexes)[number];
      const tables: Record<string, { columns: ColRow[]; fks: FkRow[]; indexes: IdxRow[] }> = {};

      for (const col of columns) {
        if (!tables[col.table_name]) tables[col.table_name] = { columns: [], fks: [], indexes: [] };
        tables[col.table_name].columns.push(col);
      }
      for (const fk of foreignKeys) {
        if (tables[fk.from_table]) tables[fk.from_table].fks.push(fk);
      }
      for (const idx of indexes) {
        if (tables[idx.table_name]) tables[idx.table_name].indexes.push(idx);
      }

      const lines: string[] = [`📐 **Database schema — ${Object.keys(tables).length} table(s)**\n`];

      for (const [tableName, info] of Object.entries(tables)) {
        lines.push(`### ${tableName}`);
        lines.push("| Column | Type | Nullable | Default |");
        lines.push("|--------|------|----------|---------|");
        for (const col of info.columns) {
          lines.push(
            `| ${col.column_name} | ${col.udt_name} | ${col.is_nullable} | ${col.column_default ?? "—"} |`
          );
        }

        if (info.fks.length > 0) {
          lines.push("\n**Foreign Keys:**");
          for (const fk of info.fks) {
            lines.push(`- \`${fk.from_column}\` → \`${fk.to_table}.${fk.to_column}\` (ON DELETE ${fk.delete_rule})`);
          }
        }

        if (info.indexes.length > 0) {
          lines.push("\n**Indexes:**");
          for (const idx of info.indexes) {
            lines.push(`- \`${idx.index_name}\``);
          }
        }

        lines.push("");
      }

      return { content: [{ type: "text", text: lines.join("\n") }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: `❌ Error fetching schema:\n${(err as Error).message}` }],
        isError: true,
      };
    }
  }
);

// ---------------------------------------------------------------------------
// TOOL: describe-table
// Detailed info for a single table: schema, row count, and sample data.
// ---------------------------------------------------------------------------
server.registerTool(
  "describe-table",
  {
    description:
      "Returns detailed information about a specific table: columns, constraints, row count, and sample data (5 rows).",
    inputSchema: {
      table: z
        .string()
        .describe("Table name (without schema). E.g: users, companies, documents"),
    },
  },
  async ({ table }) => {
    // Sanitize the name to prevent SQL injection
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
      return {
        content: [{ type: "text", text: `❌ Invalid table name: "${table}"` }],
        isError: true,
      };
    }

    try {
      const [columns, constraints, rowCount, sample] = await Promise.all([
        sql`
          SELECT column_name, udt_name AS data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = ${table}
          ORDER BY ordinal_position
        `,

        sql`
          SELECT tc.constraint_name, tc.constraint_type, kcu.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
          WHERE tc.table_schema = 'public' AND tc.table_name = ${table}
          ORDER BY tc.constraint_type, kcu.column_name
        `,

        sql`SELECT COUNT(*)::int AS count FROM public.${sql(table)}`,

        sql`SELECT * FROM public.${sql(table)} LIMIT 5`,
      ]);

      if (columns.length === 0) {
        return {
          content: [{ type: "text", text: `❌ Table "${table}" not found in the public schema.` }],
          isError: true,
        };
      }

      const lines: string[] = [
        `## Table: \`public.${table}\``,
        `**Total rows:** ${rowCount[0].count}`,
        "",
        "### Columns",
        "| Column | Type | Nullable | Default |",
        "|--------|------|----------|---------|",
        ...columns.map(
          (c) => `| ${c.column_name} | ${c.data_type} | ${c.is_nullable} | ${c.column_default ?? "—"} |`
        ),
        "",
        "### Constraints",
        ...constraints.map((c) => `- \`${c.constraint_name}\` (${c.constraint_type}) → \`${c.column_name}\``),
        "",
        "### Sample data (up to 5 rows)",
        "```json",
        JSON.stringify(sample, null, 2),
        "```",
      ];

      return { content: [{ type: "text", text: lines.join("\n") }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: `❌ Error describing table:\n${(err as Error).message}` }],
        isError: true,
      };
    }
  }
);

// ---------------------------------------------------------------------------
// TOOL: list-users
// ---------------------------------------------------------------------------
server.registerTool(
  "list-users",
  {
    description: "Returns all registered users with their id, name, and registration date.",
    inputSchema: {},
  },
  async () => {
    try {
      const rows = await sql`
        SELECT id, nome, created_at
        FROM public.usuarios
        ORDER BY created_at DESC
      `;
      return {
        content: [
          {
            type: "text",
            text: [`✅ ${rows.length} user(s) found:`, "```json", JSON.stringify(rows, null, 2), "```"].join("\n"),
          },
        ],
      };
    } catch (err) {
      return { content: [{ type: "text", text: `❌ Error: ${(err as Error).message}` }], isError: true };
    }
  }
);

// ---------------------------------------------------------------------------
// TOOL: list-companies
// ---------------------------------------------------------------------------
server.registerTool(
  "list-companies",
  {
    description: "Returns all registered companies, including who created them and when.",
    inputSchema: {},
  },
  async () => {
    try {
      const rows = await sql`
        SELECT e.id, e.nome, u.nome AS owner, e.created_at
        FROM public.empresas e
        JOIN public.usuarios u ON u.id = e.usuario_id
        ORDER BY e.created_at DESC
      `;
      return {
        content: [
          {
            type: "text",
            text: [`✅ ${rows.length} company(ies) found:`, "```json", JSON.stringify(rows, null, 2), "```"].join("\n"),
          },
        ],
      };
    } catch (err) {
      return { content: [{ type: "text", text: `❌ Error: ${(err as Error).message}` }], isError: true };
    }
  }
);

// ---------------------------------------------------------------------------
// TOOL: get-company-overview
// ---------------------------------------------------------------------------
server.registerTool(
  "get-company-overview",
  {
    description: "Returns full overview of a company: info, members with roles, and documents.",
    inputSchema: {
      empresa_id: z.string().uuid().describe("Company UUID"),
    },
  },
  async ({ empresa_id }) => {
    try {
      const [company, members, documents] = await Promise.all([
        sql`
          SELECT e.id, e.nome, u.nome AS owner, e.created_at
          FROM public.empresas e
          JOIN public.usuarios u ON u.id = e.usuario_id
          WHERE e.id = ${empresa_id}
        `,
        sql`
          SELECT u.nome AS usuario, em.role, em.created_at AS joined_at
          FROM public.empresa_membros em
          JOIN public.usuarios u ON u.id = em.usuario_id
          WHERE em.empresa_id = ${empresa_id}
          ORDER BY em.created_at
        `,
        sql`
          SELECT id, nome, created_at
          FROM public.documentos
          WHERE empresa_id = ${empresa_id}
          ORDER BY created_at DESC
        `,
      ]);

      if (company.length === 0) {
        return { content: [{ type: "text", text: `❌ Company not found: ${empresa_id}` }], isError: true };
      }

      const result = { company: company[0], members, documents };
      return {
        content: [
          {
            type: "text",
            text: ["✅ Company overview:", "```json", JSON.stringify(result, null, 2), "```"].join("\n"),
          },
        ],
      };
    } catch (err) {
      return { content: [{ type: "text", text: `❌ Error: ${(err as Error).message}` }], isError: true };
    }
  }
);

// ---------------------------------------------------------------------------
// TOOL: get-user-companies
// ---------------------------------------------------------------------------
server.registerTool(
  "get-user-companies",
  {
    description: "Returns all companies a user owns or is a member of, with their role in each.",
    inputSchema: {
      usuario_id: z.string().uuid().describe("User UUID"),
    },
  },
  async ({ usuario_id }) => {
    try {
      const rows = await sql`
        SELECT
          e.id AS empresa_id,
          e.nome AS empresa,
          CASE WHEN e.usuario_id = ${usuario_id} THEN 'owner' ELSE em.role END AS role,
          e.created_at
        FROM public.empresas e
        LEFT JOIN public.empresa_membros em ON em.empresa_id = e.id AND em.usuario_id = ${usuario_id}
        WHERE e.usuario_id = ${usuario_id} OR em.usuario_id = ${usuario_id}
        ORDER BY e.created_at DESC
      `;
      return {
        content: [
          {
            type: "text",
            text: [`✅ ${rows.length} company(ies) for this user:`, "```json", JSON.stringify(rows, null, 2), "```"].join("\n"),
          },
        ],
      };
    } catch (err) {
      return { content: [{ type: "text", text: `❌ Error: ${(err as Error).message}` }], isError: true };
    }
  }
);

// ---------------------------------------------------------------------------
// RESOURCE: tables
// Lists all tables in the public schema as a navigable resource.
// ---------------------------------------------------------------------------
server.registerResource(
  "db://tables",
  "List of all tables in the public schema of the Supabase database",
  { mimeType: "application/json" },
  async () => {
    try {
      const tables = await sql`
        SELECT
          t.table_name,
          obj_description(('"public".' || quote_ident(t.table_name))::regclass, 'pg_class') AS description,
          (SELECT COUNT(*)::int FROM information_schema.columns c
           WHERE c.table_schema = 'public' AND c.table_name = t.table_name) AS column_count
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name
      `;

      return {
        contents: [
          {
            uri: "db://tables",
            mimeType: "application/json",
            text: JSON.stringify(tables, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        contents: [
          {
            uri: "db://tables",
            mimeType: "text/plain",
            text: `Error listing tables: ${(err as Error).message}`,
          },
        ],
      };
    }
  }
);

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[mcp-database] ✅ MCP Server connected to Supabase via stdio");
}

main().catch((err) => {
  console.error("[mcp-database] ❌ Fatal error:", err);
  process.exit(1);
});
