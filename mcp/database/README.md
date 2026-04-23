# @repo/mcp-database

An MCP (Model Context Protocol) server that provides **read-only** access to the gigablocks-accelerator Supabase database. It connects directly via Postgres and exposes three tools and one resource for AI agents to inspect the database schema and query data safely.

## Requirements

- Node.js 18+
- A Supabase project with a valid connection string

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Postgres connection string — `postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres` |

Set this in `.claude/settings.json` under `mcpServers.database.env.DATABASE_URL`, or in a `.env.local` file at the workspace root.

## Setup

```bash
# Install dependencies
npm install

# Run in development mode (uses tsx)
npm run dev

# Build for production
npm run build

# Run the compiled output
npm start
```

## MCP Primitives

### Tools

#### `query`
Executes a **read-only SQL query** and returns the results as JSON. Only `SELECT` statements are accepted — write commands (`INSERT`, `UPDATE`, `DELETE`, `DROP`, etc.) are blocked at the application level and the query also runs inside a `READ ONLY` transaction for extra safety.

**Input:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `sql` | `string` | A SELECT SQL statement |

**Example:**
```sql
SELECT * FROM public.users LIMIT 10
```

---

#### `schema`
Returns the **full public schema** of the database: all tables, columns (name, type, nullable, default), foreign keys, and indexes.

**Input:** none

**Output:** Formatted markdown with one section per table.

---

#### `describe-table`
Returns **detailed information** about a specific table: column definitions, constraints, total row count, and a sample of up to 5 rows.

**Input:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `table` | `string` | Table name without schema prefix (e.g. `users`, `companies`) |

---

### Resources

#### `db://tables`
A navigable resource that lists all **base tables** in the `public` schema, including each table's name, description (from `pg_class`), and column count. Returns `application/json`.

## Security

- Only `SELECT` statements are permitted — a keyword blocklist rejects any query starting with a write or DDL command.
- All queries execute inside a `READ ONLY` Postgres transaction.
- Table names passed to `describe-table` are validated against a strict alphanumeric regex to prevent SQL injection.
- SSL is automatically enforced when connecting to `supabase.co` hosts.

## Architecture

```
src/
└── index.ts   # MCP server — connection, tool and resource registration, startup
```

The server communicates over **stdio** using the `StdioServerTransport` from the MCP SDK, making it compatible with any MCP-aware host (Claude Desktop, Cursor, etc.).
