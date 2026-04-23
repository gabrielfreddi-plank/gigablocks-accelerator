# Gigablocks Accelerator — Codebase Guide

## 🌍 Language Policy: English Only (EN)

**All code identifiers, variable names, database schema, function names, comments, documentation, UI copy, error messages, commit messages, and PR descriptions MUST be in English only.**

This includes:
- ✅ Function names: `getUserCompanies()` not `obterEmpresasDoUsuario()`
- ✅ Variable names: `userName` not `nomeDoUsuario`
- ✅ Table names: `users` not `usuarios`
- ✅ Column names: `company_id` not `id_empresa`
- ✅ Comments: English only, no Portuguese/Spanish
- ✅ Commit messages: Conventional Commits in English
- ✅ PR descriptions: English only
- ✅ Documentation: All files (including this AGENTS.md) in English

**No exceptions.** This applies to all new and existing code.

## Monorepo

Turborepo + pnpm workspaces.

```
apps/
  home/         # Next.js 16 — main app (Vercel) — port 3000
  docs/         # Next.js docs
  clark/        # Node — AI agent service (not deployed to Vercel)
  data-plane/   # Node — data execution service (not deployed to Vercel)
packages/
  ui/           # Shared component library (@repo/ui)
  db/           # Shared Supabase client + types (@repo/db)
  typescript-config/
  eslint-config/
  vitest-config/
```

## Deployment Architecture

**A single Next.js app on Vercel (`apps/home`).** New modules = new route groups inside `apps/home/src/app/`. Do not create new Vercel apps for application features.

```
apps/home/src/app/
  (marketing)/      # public landing page
  (auth)/           # sign-in, sign-up, onboarding
  (dashboard)/      # main app (coming soon)
  (settings)/       # settings (future)
  (billing)/        # plans/payments (future)
```

`vercel.json` at the repo root is already configured — no changes needed when adding new route groups.

## apps/home — Structure

```
src/
  app/
    layout.tsx              # Root layout — Geist font
    globals.css
    (marketing)/
      layout.tsx            # Isolated layout — Inter, bg-black, no sidebar
      page.tsx              # Marketing homepage
    (auth)/
      layout.tsx            # Centered layout — bg-[#0c0c0e]
      sign-in/page.tsx
      sign-up/page.tsx
      onboarding/page.tsx
    auth/callback/route.ts  # OAuth/magic-link handler
  components/
    ui/
      button.tsx            # Button with CVA + @base-ui/react (NOT standard shadcn)
      input.tsx             # shadcn Input
      label.tsx             # shadcn Label
      card.tsx              # shadcn Card
      auth-input.tsx        # Composed Label + Input for auth forms
    marketing/
      Section.tsx           # Section wrapper — px-6 py-24 max-w-7xl mx-auto
      SectionLabel.tsx      # Blue uppercase label with tracking-widest
  lib/
    utils.ts                # cn() via clsx + tailwind-merge
    actions/
      auth.ts               # Server Actions: signIn, signUp, createEmpresa, signOut
    supabase/
      client.ts             # Browser client (@supabase/ssr)
      server.ts             # Server client (@supabase/ssr)
      types.ts              # Generated types from Supabase schema
    data/
      features.ts           # Feature[] — 6 cards for the Features Grid
      how-it-works.ts       # Step[] — 4 steps for How It Works
  proxy.ts                  # Next.js 16 proxy — session refresh + route protection
```

## Stack

| Tech | Version | Notes |
|---|---|---|
| Next.js | 16.2.0 | App Router, Server Components by default |
| React | 19.2.0 | |
| Tailwind CSS | 4.2.2 | Via `@tailwindcss/postcss` — no `tailwind.config.js` |
| shadcn/ui | 4.3.0 | Style: Default, Base: Zinc, dark mode via `.dark` |
| Supabase | @supabase/ssr ^0.10.2 | Auth + DB |
| TypeScript | strict | `@/*` points to `apps/home/src/` |
| Font | Inter | Loaded via `next/font/google` in the marketing layout |
| Animations | tw-animate-css | |

## Supabase — Public Schema

| Table | Description |
|--------|-----------|
| `usuarios` | User profile (auto-created via trigger on `auth.users` insert) |
| `empresas` | Organization created during onboarding |
| `empresa_membros` | Company members with `role` (owner auto-inserted via trigger) |
| `documentos` | Documents per company |

**Note:** Existing tables use Portuguese names for backwards compatibility. All new tables and columns MUST use English names only (per EN-Only Language Policy above).

## CSS / Design Tokens

- File: `src/app/globals.css`
- Colors in OKLch, CSS custom properties
- Dark theme active by default (bg-black text-white)
- Zinc as base: `zinc-400` body, `zinc-700` borders, `zinc-800/900` cards
- Action blue: `blue-500` / `blue-600` hover

## Commands

```bash
# At the repo root (Turborepo)
pnpm dev          # runs all apps
pnpm build
pnpm lint
pnpm typecheck

# Inside apps/home
pnpm dev          # port 3000
pnpm typecheck    # next typegen && tsc --noEmit
pnpm lint         # eslint --max-warnings 0
pnpm test         # vitest
pnpm test:e2e     # playwright
```

## Language (EN-Only)

**See Language Policy above.** All code, identifiers, schema, and content must be in English. Zero tolerance for non-English code identifiers or variable names. This is enforced in code review.

## Conventions

- New product modules → new route group at `apps/home/src/app/(module)/`
- New marketing components → `src/components/marketing/`
- Static data → `src/lib/data/` as typed exported arrays
- Reuse `Section` and `SectionLabel` across all marketing sections
- `cn()` from `@/lib/utils` for Tailwind class merging
- Commits: `feat:`, `chore:`, `fix:` + issue reference (e.g. `[THA-13]`)
- Issue prefixes: `THA-` for Thales, `LUC-` for Lucas
