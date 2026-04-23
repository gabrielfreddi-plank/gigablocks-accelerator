# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Read `AGENTS.md` first — it is the canonical architecture and conventions guide. This file adds what is not in AGENTS.md.

## Commands

```bash
pnpm dev               # Next.js dev server on port 3000
pnpm build             # Production build
pnpm lint              # ESLint --max-warnings 0
pnpm typecheck         # next typegen && tsc --noEmit
pnpm test              # Vitest (unit/component — src/ only)
pnpm test:watch        # Vitest watch mode
pnpm test:e2e          # Playwright E2E (tests/e2e/)
pnpm test:integration  # Playwright integration (tests/integration/)
pnpm pw:install        # Install Playwright browsers
```

## Current vs. intended structure

`AGENTS.md` describes the full Turborepo monorepo target. **Today the repo is a single Next.js app at root** — no `apps/` or `packages/` directories yet. All product code is in `src/`. New route groups go in `src/app/(module)/` until the monorepo split happens.

## Auth flow

Supabase Auth via `@supabase/ssr`. `src/proxy.ts` is the middleware (session refresh + route protection):
- No session + `/dashboard` or `/onboarding` → redirect `/sign-in`
- Session + `/sign-in`, `/sign-up`, or `/` → redirect `/dashboard`

Server Components / Actions use `createClient()` from `@/lib/supabase/server`. Client Components use `@/lib/supabase/client`. Types are committed at `src/lib/supabase/types.ts` — regenerate with `supabase gen types` after schema changes.

The Supabase publishable key env var is `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (not `ANON_KEY`).

## Database schema

| Table | Key columns | Notes |
|---|---|---|
| `usuarios` | `id` (FK auth.users), `nome` | Auto-created on signup via trigger |
| `empresas` | `id`, `nome`, `usuario_id` | Created during onboarding |
| `empresa_membros` | `empresa_id`, `usuario_id`, `role` | Owner auto-inserted via trigger |
| `documentos` | `id`, `empresa_id`, `nome`, `conteudo_original` | Per-org documents |

`supabase/migrations/` holds all migrations. `is_empresa_member(target_empresa_id)` is an RPC helper for RLS.

## MCP server

`mcp/database/` is a read-only Postgres MCP server for AI agents (not part of the Next.js app). It exposes `query`, `schema`, and `describe-table` tools over stdio. Configured in `.claude/settings.json` under `mcpServers.database`.

## Component notes

`Button` in `src/components/ui/button.tsx` uses `@base-ui/react` — not the standard shadcn Button. All other shadcn components follow the default pattern.
