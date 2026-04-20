# Gigablocks Accelerator

Monorepo for the Gigablocks platform — built with Turborepo, pnpm, and Next.js.

## Requirements

- **Node.js** >= 24
- **pnpm** 10.33.0 (enforced via `packageManager` field)

Install pnpm if needed:

```sh
corepack enable
```

## Getting started

```sh
pnpm install
pnpm dev
```

## Apps

| App | Description |
|-----|-------------|
| `web` | Main Next.js web application |
| `clark` | Clark app |
| `data-plane` | Data plane service |
| `docs` | Documentation app |

## Packages

| Package | Description |
|---------|-------------|
| `@repo/ui` | Shared React component library |
| `@repo/sdk` | SDK |
| `@repo/embed` | Embed package |
| `@repo/embed-react` | React embed bindings |
| `@repo/eslint-config` | Shared ESLint configuration |
| `@repo/typescript-config` | Shared `tsconfig.json` bases |
| `@repo/vitest-config` | Shared Vitest configuration |

## Common commands

```sh
pnpm dev                  # start all apps in dev mode
pnpm build                # build all apps and packages
pnpm lint                 # lint all packages
pnpm typecheck            # typecheck all packages
pnpm test                 # run unit tests
pnpm test:e2e             # run Playwright E2E tests (web)
pnpm test:integration     # run Playwright integration tests (web)
```

Filter to a specific app:

```sh
pnpm turbo run dev --filter=web
pnpm turbo run build --filter=web
```

Install Playwright browsers (required before running E2E/integration tests locally):

```sh
pnpm test:pw:install
```

## CI/CD

GitHub Actions runs on every push to `main` and on pull requests targeting `main`.

| Job | Trigger |
|-----|---------|
| Lint, Typecheck, Test, Build, E2E, Integration | push + PR |
| Deploy to Vercel Preview | PR (after all checks pass) |
| Deploy to Vercel Production | push to `main` (after all checks pass) |

Required repository secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

## Remote Caching

Turborepo supports [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching) via Vercel:

```sh
pnpm exec turbo login
pnpm exec turbo link
```
