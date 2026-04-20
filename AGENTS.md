# Gigablocks Accelerator — Codebase Guide

## Monorepo

Turborepo + pnpm workspaces.

```
apps/
  home/         # Next.js 16 — app principal (Vercel) — porta 3000
  docs/         # Next.js docs
  clark/        # Node — AI agent service (não vai para o Vercel)
  data-plane/   # Node — data execution service (não vai para o Vercel)
packages/
  ui/           # Shared component library (@repo/ui)
  db/           # Shared Supabase client + types (@repo/db)
  typescript-config/
  eslint-config/
  vitest-config/
```

## Arquitetura de deploy

**Um único app Next.js no Vercel (`apps/home`).** Novos módulos = novos route groups dentro de `apps/home/src/app/`. Não criar novos apps no Vercel para funcionalidades da aplicação.

```
apps/home/src/app/
  (marketing)/      # landing page pública
  (auth)/           # sign-in, sign-up, onboarding
  (dashboard)/      # app principal (em breve)
  (settings)/       # configurações (futuro)
  (billing)/        # planos/pagamento (futuro)
```

`vercel.json` na raiz já está configurado — não precisa alterar para adicionar novos route groups.

## apps/home — estrutura

```
src/
  app/
    layout.tsx              # Root layout — fonte Geist
    globals.css
    (marketing)/
      layout.tsx            # Layout isolado — Inter, bg-black, sem sidebar
      page.tsx              # Marketing homepage
    (auth)/
      layout.tsx            # Layout centralizado — bg-[#0c0c0e]
      sign-in/page.tsx
      sign-up/page.tsx
      onboarding/page.tsx
    auth/callback/route.ts  # OAuth/magic-link handler
  components/
    ui/
      button.tsx            # Botão com CVA + @base-ui/react (NÃO é o shadcn padrão)
      input.tsx             # shadcn Input
      label.tsx             # shadcn Label
      card.tsx              # shadcn Card
      auth-input.tsx        # Label + Input composto para formulários auth
    marketing/
      Section.tsx           # Wrapper de seção — px-6 py-24 max-w-7xl mx-auto
      SectionLabel.tsx      # Label azul uppercase tracking-widest
  lib/
    utils.ts                # cn() via clsx + tailwind-merge
    actions/
      auth.ts               # Server Actions: signIn, signUp, createEmpresa, signOut
    supabase/
      client.ts             # Browser client (@supabase/ssr)
      server.ts             # Server client (@supabase/ssr)
      types.ts              # Tipos gerados do schema Supabase
    data/
      features.ts           # Feature[] — 6 cards para o Features Grid
      how-it-works.ts       # Step[] — 4 steps para How It Works
  proxy.ts                  # Next.js 16 proxy — session refresh + proteção de rotas
```

## Stack

| Tech | Versão | Notas |
|---|---|---|
| Next.js | 16.2.0 | App Router, Server Components por padrão |
| React | 19.2.0 | |
| Tailwind CSS | 4.2.2 | Via `@tailwindcss/postcss` — sem `tailwind.config.js` |
| shadcn/ui | 4.3.0 | Style: Default, Base: Zinc, dark mode via `.dark` |
| Supabase | @supabase/ssr ^0.10.2 | Auth + DB |
| TypeScript | strict | `@/*` aponta para `apps/home/src/` |
| Fonte | Inter | Carregada via `next/font/google` no layout de marketing |
| Animações | tw-animate-css | |

## Supabase — schema público

| Tabela | Descrição |
|--------|-----------|
| `usuarios` | Perfil do usuário (auto-criado via trigger em `auth.users`) |
| `empresas` | Organização criada no onboarding |
| `empresa_membros` | Membros por empresa com `role` (owner auto-inserido via trigger) |
| `documentos` | Documentos por empresa |

## CSS / Design tokens

- Arquivo: `src/app/globals.css`
- Cores em OKLch, CSS custom properties
- Dark theme ativo por padrão (bg-black text-white)
- Zinc como base: `zinc-400` body, `zinc-700` bordas, `zinc-800/900` cards
- Azul de ação: `blue-500` / `blue-600` hover

## Comandos

```bash
# Na raiz (Turborepo)
pnpm dev          # roda todos os apps
pnpm build
pnpm lint
pnpm typecheck

# Em apps/home
pnpm dev          # porta 3000
pnpm typecheck    # next typegen && tsc --noEmit
pnpm lint         # eslint --max-warnings 0
pnpm test         # vitest
pnpm test:e2e     # playwright
```

## Convenções

- Novos módulos do produto → novo route group em `apps/home/src/app/(modulo)/`
- Novos componentes de marketing → `src/components/marketing/`
- Dados estáticos → `src/lib/data/` como arrays tipados exportados
- Reutilizar `Section` e `SectionLabel` em todas as seções de marketing
- `cn()` de `@/lib/utils` para merge de classes Tailwind
- Commits: `feat:`, `chore:`, `fix:` + referência à issue (ex: `[THA-13]`)
- Prefixo de issues: `THA-` para Thales, `LUC-` para Lucas
