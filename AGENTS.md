# Gigablocks Accelerator — Codebase Guide

## Monorepo

Turborepo + pnpm workspaces.

```
apps/
  web/          # Next.js 16 frontend (App Router) — porta 3000
  docs/         # Next.js docs
  clark/        # Node stub — AI agent service
  data-plane/   # Node stub — data execution service
packages/
  ui/           # Shared component library (@repo/ui)
  typescript-config/
  eslint-config/
  vitest-config/
```

## apps/web — estrutura

```
app/
  layout.tsx          # Root layout — fontes Geist
  page.tsx            # Root page
  (marketing)/
    layout.tsx        # Layout isolado — fonte Inter, bg-black, sem sidebar
    page.tsx          # Marketing homepage (placeholder)
components/
  ui/
    button.tsx        # Botão com CVA + @base-ui/react (NÃO é o shadcn padrão)
  marketing/
    Section.tsx       # Wrapper de seção — px-6 py-24 max-w-7xl mx-auto
    SectionLabel.tsx  # Label azul uppercase tracking-widest
lib/
  utils.ts            # cn() via clsx + tailwind-merge
  data/
    features.ts       # Feature[] — 6 cards para o Features Grid
    how-it-works.ts   # Step[] — 4 steps para How It Works
```

## Stack

| Tech | Versão | Notas |
|---|---|---|
| Next.js | 16.2.0 | App Router, Server Components por padrão |
| React | 19.2.0 | |
| Tailwind CSS | 4.2.2 | Via `@tailwindcss/postcss` — sem `tailwind.config.js` |
| Shadcn/ui | 4.3.0 | Style: Default, Base: Zinc, dark mode via `.dark` |
| TypeScript | strict | `@/*` aponta para `apps/web/` |
| Fonte | Inter | Carregada via `next/font/google` no layout de marketing |
| Animações | tw-animate-css | |

## CSS / Design tokens

- Arquivo: `app/globals.css`
- Cores em OKLch, CSS custom properties
- Dark theme ativo por padrão na marketing page (bg-black text-white)
- Zinc como base: `zinc-400` body, `zinc-700` bordas, `zinc-800/900` cards
- Azul de ação: `blue-500` / `blue-600` hover

## Comandos

```bash
# Na raiz (Turborepo)
pnpm dev          # roda todos os apps
pnpm build
pnpm lint
pnpm typecheck

# Em apps/web
pnpm dev          # porta 3000
pnpm typecheck    # next typegen && tsc --noEmit
pnpm lint         # eslint --max-warnings 0
pnpm test         # vitest
pnpm test:e2e     # playwright
```

## Convenções

- Novos componentes de marketing em `components/marketing/`
- Dados estáticos em `lib/data/` como arrays tipados exportados
- Reutilizar `Section` e `SectionLabel` em todas as seções
- `cn()` de `@/lib/utils` para merge de classes Tailwind
- Commits: `feat:`, `chore:`, `fix:` + referência à issue (ex: `[GAB-13]`)
