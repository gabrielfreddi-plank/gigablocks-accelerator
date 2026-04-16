# Gigablocks — Implementation Plan

> **Stack:** TypeScript everywhere · pnpm workspaces · Turborepo · Next.js App Router · Node.js · Postgres · Redis · gRPC · GitHub Actions · Vercel
>
> **Conventions for agents:**
> - Every task has an **Acceptance** block — done only when all criteria pass.
> - Every task ships with tests (unit or integration as noted).
> - Task IDs are stable: `{PHASE}-{MODULE}-{N}` (e.g. `A0-CI-1`).
> - Tasks within a module are parallel unless marked `[sequential]`.
> - All new packages use `pnpm` — no `npm` or `yarn` invocations.

---

## Phase A0 — Foundation (Pre-Alpha)

> Goal: repo skeleton, CI/CD pipeline, design system, and static mockups. No backend, no auth, no database. A non-technical stakeholder can click through all five product screens.

---

### Module A0-CI · CI/CD + Repo Setup

All tasks sequential — later phases depend on this scaffold.

#### A0-CI-1 · Monorepo Initialization

**What:** Bootstrap Turborepo monorepo with pnpm workspaces.

```
gigablocks/
├── apps/web/          # Next.js
├── apps/data-plane/   # Node.js (stub)
├── apps/clark/        # Node.js (stub)
├── packages/sdk/      # stub
├── packages/embed/    # stub
├── packages/embed-react/ # stub
├── packages/tsconfig/ # shared tsconfig
├── packages/eslint-config/
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

**Steps:**
1. `pnpm dlx create-turbo@latest gigablocks-accelerator --package-manager pnpm`
2. Configure `turbo.json` pipelines: `build`, `test`, `lint`, `typecheck`, `dev`
3. Add shared `packages/tsconfig` with `base.json`, `nextjs.json`, `node.json`
4. Add shared `packages/eslint-config` with Next.js + Node rules
5. Stub all `apps/` and `packages/` directories with `package.json` + `index.ts`

**Acceptance:**
- `pnpm install` succeeds from root
- `pnpm turbo run build` exits 0 (all stubs compile)
- `pnpm turbo run lint` exits 0
- `pnpm turbo run typecheck` exits 0

---

#### A0-CI-2 · GitHub Actions Pipeline `[sequential after A0-CI-1]`

**What:** CI pipeline that runs on every PR and push to `main`.

**Steps:**
1. Create `.github/workflows/ci.yml`:
   - Trigger: `push` to `main`, `pull_request` to `main`
   - Jobs (parallel): `lint`, `typecheck`, `test`, `build`
   - Node 20, pnpm cache via `actions/setup-node` + `cache: pnpm`
2. Create `.github/workflows/preview.yml`:
   - Trigger: `pull_request`
   - Deploys `apps/web` to Vercel preview via `vercel` CLI + `VERCEL_TOKEN` secret
3. Create `.github/workflows/production.yml`:
   - Trigger: push to `main`
   - Deploys `apps/web` to Vercel production

**Secrets required:** `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

**Acceptance:**
- Open a trivial PR → CI passes green
- PR gets a Vercel preview URL comment
- Merge to `main` → production URL updates

---

#### A0-CI-3 · Branch Protection + PR Template `[sequential after A0-CI-2]`

**What:** Enforce quality gates on `main`.

**Steps:**
1. Add `.github/pull_request_template.md` with: Summary, Test plan, Checklist (tests added, types pass, lint clean)
2. Document branch protection rules to configure in GitHub UI: require CI, require 1 review, no force-push to `main`
3. Add `.github/CODEOWNERS`

**Acceptance:**
- PR template appears on every new PR
- `CODEOWNERS` file exists and is valid

---

### Module A0-DS · Design System

Parallel with A0-CI.

#### A0-DS-1 · Next.js App + Design System Bootstrap

**What:** Scaffold `apps/web` with Shadcn/ui + Tailwind CSS.

**Steps:**
1. `pnpm create next-app apps/web --typescript --app --tailwind --eslint --no-src-dir`
2. Install Shadcn/ui: `pnpm dlx shadcn-ui@latest init` (style: Default, base color: Zinc)
3. Add components: `button`, `input`, `select`, `table`, `dialog`, `tabs`, `badge`, `scroll-area`, `separator`, `tooltip`, `dropdown-menu`, `sidebar`, `resizable`
4. Configure `next.config.ts` with Turbopack dev mode
5. Set up `apps/web/lib/fonts.ts` (Geist Sans + Geist Mono via `next/font`)
6. Create `apps/web/components/ui/` directory — all Shadcn components land here
7. Create `apps/web/components/layout/` — shell, sidebar, topbar

**Acceptance:**
- `pnpm dev` starts at `localhost:3000`
- Shadcn components render without errors
- Tailwind classes resolve correctly
- `pnpm typecheck` passes

---

#### A0-DS-2 · Color Tokens + Typography

**What:** Define brand tokens so mockups look coherent.

**Steps:**
1. Extend `tailwind.config.ts` with Gigablocks brand colors (dark editor theme)
2. Create `apps/web/styles/globals.css` with CSS custom properties for tokens
3. Create a `apps/web/app/design-system/page.tsx` storybook-style page showing all components

**Acceptance:**
- Design system page renders all components at `localhost:3000/design-system`
- No TypeScript errors

---

### Module A0-MOCK · Static Mockups

Parallel with A0-DS (depends on A0-DS-1 complete).

#### A0-MOCK-1 · App Editor Mockup

**What:** Static browser-based IDE screen.

**Layout:** Three-pane split — file tree sidebar (left) · Monaco-like code pane (center) · live preview iframe (right). Top bar: environment selector + deploy button.

**Steps:**
1. Create `apps/web/app/editor/page.tsx`
2. Left panel: hardcoded file tree (3 files) using `packages/mocks/editor-fixture.ts`
3. Center panel: `<textarea>` with monospace font showing hardcoded React code
4. Right panel: bordered iframe placeholder ("Preview")
5. Top bar: `<Select>` for env (`edit` / `staging` / `production`) + `<Button>Deploy</Button>`
6. Use `ResizablePanelGroup` from Shadcn for the three-pane layout
7. Write mock data in `apps/web/lib/mocks/editor.ts`

**Tests:** Render test with `@testing-library/react` — all three panels mount, top bar renders.

**Acceptance:**
- Screen renders without errors
- Three-pane layout is responsive
- Environment selector shows three options
- Test passes in CI

---

#### A0-MOCK-2 · Backend API Builder Mockup

**What:** Step pipeline builder screen.

**Layout:** Left: steps list with add-step button. Center: selected step config panel (integration dropdown, query textarea). Right: step output viewer.

**Steps:**
1. Create `apps/web/app/editor/api-builder/page.tsx`
2. Hardcoded steps array: `[{ id, type: "postgres", name: "Fetch users" }, { id, type: "js", name: "Transform" }]`
3. Step config panel: `<Select>` for integration, `<Textarea>` for query, run button
4. Output viewer: JSON code block with mock rows
5. Mock data in `apps/web/lib/mocks/api-builder.ts`

**Tests:** Render test — steps list, config panel, and output viewer all mount.

**Acceptance:**
- Clicking a step in the list updates the config panel (local React state, no fetch)
- Test passes in CI

---

#### A0-MOCK-3 · Admin Console Mockup

**What:** Organization management screen.

**Layout:** Tab navigation — Integrations · Environments · RBAC · Audit.

**Steps:**
1. Create `apps/web/app/admin/page.tsx`
2. Integrations tab: `<Table>` of integrations with name, type, status badge + "Add Integration" button → `<Dialog>` with name/type/auth fields (no submit logic)
3. Environments tab: `<Table>` with `production`, `staging`, `edit` rows
4. RBAC tab: roles table — org roles + resource roles columns
5. Audit tab: event table (placeholder — full mockup in A0-MOCK-5)
6. Mock data in `apps/web/lib/mocks/admin.ts`

**Tests:** Render test — all four tabs mount; dialog opens on button click.

**Acceptance:**
- Tab navigation works (local state)
- Add Integration dialog opens and closes
- Test passes in CI

---

#### A0-MOCK-4 · App Runtime Mockup

**What:** The screen end users see when running a deployed app.

**Layout:** Full-width app shell. Hardcoded React component: a table with a "Refresh" button.

**Steps:**
1. Create `apps/web/app/runtime/[appId]/page.tsx`
2. Render a hardcoded "Users" table with 5 mock rows
3. "Refresh" button → sets local loading state for 500ms, then re-renders with same mock data
4. Top bar: app name, user avatar (placeholder)
5. Mock data in `apps/web/lib/mocks/runtime.ts`

**Tests:** Render test — table renders; button click triggers loading state.

**Acceptance:**
- Runtime screen renders with mock data
- Refresh button works with mock delay
- Test passes in CI

---

#### A0-MOCK-5 · Audit Log Mockup

**What:** Queryable event log screen.

**Layout:** Filters row (event type, date range, user) · events table · event detail drawer.

**Steps:**
1. Create `apps/web/app/admin/audit/page.tsx`
2. Table columns: timestamp, event type, actor, resource, IP
3. Filter row: `<Select>` for event type, date inputs, user search input
4. Row click → `<Sheet>` drawer with full event JSON
5. Mock 20 events in `apps/web/lib/mocks/audit.ts` across all six event categories

**Tests:** Render test — table renders 20 rows; drawer opens on row click.

**Acceptance:**
- All 20 mock events visible
- Drawer opens with event detail
- Filter controls render (not wired — local state only)
- Test passes in CI

---

#### A0-MOCK-6 · Navigation Shell + Routing

**What:** Connect all screens with a real navigation shell.

**Steps:**
1. Create `apps/web/components/layout/AppShell.tsx` — sidebar with links to all screens
2. Update `apps/web/app/layout.tsx` to wrap all pages in `AppShell`
3. Sidebar links: Editor, API Builder, Admin, Runtime, Audit
4. Active link highlighting via `usePathname`
5. Mobile: sidebar collapses to hamburger

**Tests:** Render test — all nav links present; active link highlighted on each route.

**Acceptance:**
- Navigation between all 5 screens works
- No broken routes
- Test passes in CI

---

## Phase A1 — Alpha (Data Layer)

> Goal: replace mock fixtures with real Postgres. CRUD for all core entities. Editor persists code. No auth — single hardcoded org and user.

---

### Module A1-INFRA · Local Infrastructure

#### A1-INFRA-1 · Docker Compose Dev Environment

**What:** Postgres + Redis available locally via `docker compose up`.

**Steps:**
1. Create `infra/docker/docker-compose.dev.yml`:
   - `postgres:16` on port 5432, volume `postgres_data`
   - `redis:7` on port 6379
2. Create `infra/docker/.env.example` with `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
3. Add `pnpm db:up` and `pnpm db:down` scripts to root `package.json`
4. Document in `CONTRIBUTING.md`: "Run `pnpm db:up` before `pnpm dev`"

**Acceptance:**
- `pnpm db:up` starts Postgres + Redis
- `psql` connects to `localhost:5432`
- `redis-cli ping` returns PONG

---

#### A1-INFRA-2 · Database Schema + Migrations

**What:** Postgres schema for all core entities.

**Steps:**
1. Add `packages/db` package: `drizzle-orm` + `drizzle-kit` + `postgres` driver
2. Define schema in `packages/db/schema/`:
   - `organizations` — `id`, `name`, `slug`, `created_at`
   - `users` — `id`, `org_id`, `email`, `name`, `role` (enum: `owner|admin|developer|viewer`), `created_at`
   - `apps` — `id`, `org_id`, `name`, `slug`, `source` (text — React source), `manifest` (jsonb), `created_at`, `updated_at`
   - `backend_apis` — `id`, `app_id`, `org_id`, `name`, `steps` (jsonb array), `created_at`, `updated_at`
   - `integrations` — `id`, `org_id`, `name`, `type` (enum), `auth_type`, `config` (jsonb — credentials plaintext Phase 1, encrypted Phase 3), `created_at`
   - `environments` — `id`, `org_id`, `name`, `created_at`
   - `data_tags` — `id`, `org_id`, `integration_id`, `environment_id`
3. Generate and run initial migration: `pnpm db:migrate`
4. Seed script: `packages/db/seed.ts` — one org, one user, one app, two integrations, three environments
5. Add `pnpm db:seed` script

**Tests:** Integration test (against real local Postgres) — seed runs, all tables populated, foreign keys valid.

**Acceptance:**
- `pnpm db:migrate` runs without error
- `pnpm db:seed` populates all tables
- Integration test passes

---

### Module A1-API · Control API

Parallel with A1-INFRA (depends on A1-INFRA-2 complete).

#### A1-API-1 · API Foundation (Next.js Route Handlers)

**What:** Base API setup with Drizzle client, error handling, request validation.

**Steps:**
1. Install `zod` in `apps/web`
2. Create `apps/web/lib/db.ts` — Drizzle client singleton using `DATABASE_URL` env var
3. Create `apps/web/lib/api/` utilities:
   - `handler.ts` — wrapper: try/catch → structured JSON errors `{ error: string, code: string }`
   - `validate.ts` — Zod schema validation helper for request bodies
   - `context.ts` — hardcoded `{ orgId: "seed-org-id", userId: "seed-user-id" }` (replaced with JWT in Phase A3)
4. All route handlers use `handler()` wrapper

**Tests:** Unit test `handler.ts` — verify error shape on thrown errors; verify 400 on Zod validation failure.

**Acceptance:**
- `GET /api/health` returns `{ ok: true }`
- Invalid body returns `{ error: "...", code: "VALIDATION_ERROR" }` with 400
- Tests pass

---

#### A1-API-2 · Apps CRUD

**What:** REST endpoints for app management.

**Endpoints:**
- `GET /api/apps` — list apps for org
- `POST /api/apps` — create app (name, slug)
- `GET /api/apps/[id]` — get app with source + manifest
- `PUT /api/apps/[id]` — update source/manifest
- `DELETE /api/apps/[id]` — delete app

**Steps:**
1. Create route handlers in `apps/web/app/api/apps/`
2. Zod schemas for request bodies in `apps/web/lib/schemas/apps.ts`
3. Drizzle queries — always filter by `orgId` from context

**Tests:** Integration tests using `supertest` against a test database (seeded per test file). Test each endpoint: happy path + 404 + validation error.

**Acceptance:**
- All 5 endpoints work against local Postgres
- Create → fetch → update → fetch → delete cycle passes
- All integration tests pass

---

#### A1-API-3 · Backend APIs CRUD

**What:** REST endpoints for backend API (pipeline) management.

**Endpoints:**
- `GET /api/apps/[appId]/apis` — list backend APIs
- `POST /api/apps/[appId]/apis` — create
- `GET /api/apps/[appId]/apis/[apiId]` — get with steps
- `PUT /api/apps/[appId]/apis/[apiId]` — update steps
- `DELETE /api/apps/[appId]/apis/[apiId]` — delete

**Tests:** Integration tests — same pattern as A1-API-2.

**Acceptance:** Same as A1-API-2 for backend APIs.

---

#### A1-API-4 · Integrations + Environments CRUD

**What:** REST endpoints for integrations and environments.

**Endpoints:**
- `GET/POST /api/integrations`
- `GET/PUT/DELETE /api/integrations/[id]`
- `GET/POST /api/environments`
- `GET/PUT/DELETE /api/environments/[id]`
- `GET/POST /api/data-tags`
- `DELETE /api/data-tags/[id]`

**Tests:** Integration tests for each resource.

**Acceptance:** All endpoints functional; tests pass.

---

### Module A1-FE · Frontend Wiring

Parallel with A1-API.

#### A1-FE-1 · API Client

**What:** Type-safe fetch client for all API endpoints.

**Steps:**
1. Create `apps/web/lib/api-client.ts` — typed fetch wrappers for every endpoint
2. Use `SWR` for data fetching in components: `pnpm add swr`
3. Create custom hooks: `useApps()`, `useApp(id)`, `useBackendApis(appId)`, `useIntegrations()`, `useEnvironments()`
4. Error and loading states in all hooks

**Tests:** Unit tests with `msw` (Mock Service Worker) — mock API responses, verify hook returns correct data shape.

**Acceptance:**
- All hooks return typed data
- Error state propagates from API to hook
- Tests pass

---

#### A1-FE-2 · Editor Wired to API

**What:** Editor screen saves and loads real app source.

**Steps:**
1. Replace mock fixture in `apps/web/app/editor/page.tsx` with `useApp(id)` + `useBackendApis(appId)`
2. Autosave: `PUT /api/apps/[id]` on code change, debounced 1000ms
3. Loading skeleton while fetching
4. Error boundary for fetch failures

**Tests:** Render test with MSW — mock API returns fixture app, verify code pane shows source.

**Acceptance:**
- Editor loads app source from API on mount
- Code change triggers autosave (debounced)
- Reload restores last saved source
- Test passes

---

#### A1-FE-3 · Admin Console Wired to API

**What:** Admin screens CRUD wired to real API.

**Steps:**
1. Integrations tab: fetch from `useIntegrations()`, Add Integration dialog calls `POST /api/integrations`, delete calls `DELETE`
2. Environments tab: fetch from `useEnvironments()`, add/delete wired
3. Optimistic updates on delete

**Tests:** Render tests with MSW — add integration form submits; table updates after add.

**Acceptance:**
- Add Integration dialog creates real record (verifiable in DB)
- Delete removes row immediately (optimistic) + confirmed by refetch
- Tests pass

---

## Phase A2 — Alpha (Execution Engine)

> Goal: execute Backend API steps against a real database. In-process execution, no data plane split. Builder sees real query results.

---

### Module A2-EXEC · In-Process Execution Engine

#### A2-EXEC-1 · Execution Engine Core

**What:** Step sequencing engine — runs steps in order, passes outputs to next step.

**Location:** `apps/web/lib/execution/engine.ts`

**Steps:**
1. Define types in `apps/web/lib/execution/types.ts`:
   ```ts
   type StepType = "postgres" | "http" | "js" | "python"
   type Step = { id: string; type: StepType; config: Record<string, unknown> }
   type StepResult = { stepId: string; output: unknown; durationMs: number; error?: string }
   type ExecutionContext = { orgId: string; envTag: string; steps: Step[] }
   ```
2. `runPipeline(ctx: ExecutionContext): AsyncGenerator<StepResult>` — streams step results
3. Timeout: `Promise.race` with 30s limit per step
4. Step output references: `{{steps.step_id.output.field}}` template syntax resolved before each step runs

**Tests:** Unit tests — pipeline with 3 mock steps executes in order; timeout triggers at 30s; output reference resolves correctly.

**Acceptance:**
- `runPipeline` yields results in step order
- Timeout test passes (mock step that hangs)
- Output reference template test passes

---

#### A2-EXEC-2 · Postgres Adapter

**What:** Executes parameterized SQL against a Postgres integration.

**Location:** `apps/web/lib/execution/adapters/postgres.ts`

**Steps:**
1. Accept `{ connectionString: string, query: string, params: unknown[] }`
2. Use `pg` (node-postgres) with a simple per-request connection (pooling in Phase A5)
3. Return rows as `unknown[]`
4. Sanitize: never return `connectionString` in output

**Tests:** Integration test against test Postgres (Docker) — run `SELECT 1` returns `[{ "?column?": 1 }]`; parameterized query returns correct rows.

**Acceptance:**
- Adapter executes real SQL
- Integration test passes
- `connectionString` never appears in output

---

#### A2-EXEC-3 · HTTP Adapter

**What:** Executes REST HTTP requests.

**Location:** `apps/web/lib/execution/adapters/http.ts`

**Steps:**
1. Accept `{ url: string, method: string, headers: Record<string,string>, body: unknown }`
2. Use native `fetch` (Node 20)
3. Return `{ status, headers, body }` — body parsed as JSON if `Content-Type: application/json`
4. Timeout: 30s per request (AbortController)

**Tests:** Unit tests with `nock` or `msw` — GET, POST with body, timeout throws.

**Acceptance:**
- All three test cases pass
- Response body correctly parsed

---

#### A2-EXEC-4 · JavaScript Code Step Adapter

**What:** Executes a user-supplied JS function in a restricted context.

**Location:** `apps/web/lib/execution/adapters/js.ts`

**Steps:**
1. Accept `{ code: string, inputs: Record<string, unknown> }`
2. Use Node.js `vm.Script` with a 2-minute timeout and a context that only has `inputs` — no `require`, no `process`, no `fs`
3. `code` must be a function body that receives `inputs` and returns a value
4. Catch and surface runtime errors cleanly

**Tests:** Unit tests — arithmetic transform works; `require()` throws; timeout triggers.

**Acceptance:**
- Transform test passes
- Security restriction tests pass (no `require`, no `process`)
- 2-minute timeout test passes

---

#### A2-EXEC-5 · Execute API Endpoint

**What:** `POST /api/execute/[apiId]` — runs a backend API and streams results.

**Steps:**
1. Create `apps/web/app/api/execute/[apiId]/route.ts`
2. Load backend API + steps from DB
3. Resolve integration config (credential lookup from DB — plaintext Phase 2, encrypted Phase 3)
4. Call `runPipeline()`, stream `StepResult` objects as NDJSON using `ReadableStream`
5. Return 200 with `Content-Type: application/x-ndjson`

**Tests:** Integration test — create an app + backend API with a Postgres step + JS transform step; call execute endpoint; verify streamed output contains both step results.

**Acceptance:**
- Endpoint streams two `StepResult` objects
- Integration test passes (real Postgres + real execution)

---

#### A2-EXEC-6 · Runtime Screen Execution Wiring

**What:** App Runtime screen calls the execute endpoint and shows results.

**Steps:**
1. Update `apps/web/app/runtime/[appId]/page.tsx` — replace mock data with real `POST /api/execute/[apiId]`
2. Parse NDJSON stream and update step output panel progressively
3. Loading + error states
4. "Run" button triggers execution; "Cancel" aborts the fetch

**Tests:** Render test with MSW — mock NDJSON stream; verify output panel updates with each chunk.

**Acceptance:**
- Runtime screen shows real query results
- Progressive streaming works (each step result appears as it arrives)
- Cancel works

---

## Phase B1 — Beta (Auth + RBAC)

> Goal: real users, real sessions, permission enforcement. Two users in the same org have different roles and different access.

---

### Module B1-AUTH · Authentication

#### B1-AUTH-1 · Auth Foundation (NextAuth)

**What:** Email/password auth as OIDC proxy; JWT session.

**Steps:**
1. Install `next-auth@5` (Auth.js v5)
2. Configure `apps/web/auth.ts`:
   - Credentials provider (email + bcrypt password)
   - JWT strategy — access token signed with `AUTH_SECRET`
   - Session: `{ user: { id, email, name, orgId, role } }`
3. Add `users.password_hash` column to schema + migration
4. Update seed: hash a test password with `bcrypt`
5. Login page: `apps/web/app/auth/login/page.tsx` — email + password form
6. Logout button in nav shell

**Tests:**
- Unit: JWT encode/decode round-trip
- Integration: `POST /api/auth/callback/credentials` with correct credentials returns session cookie; wrong password returns 401

**Acceptance:**
- Login works with seeded user
- JWT contains `orgId` + `role`
- Session persists across page refresh
- Tests pass

---

#### B1-AUTH-2 · Google OIDC Provider

**What:** "Sign in with Google" as a real OIDC provider.

**Steps:**
1. Add Google provider to `auth.ts`
2. On first Google sign-in: create user record linked to org (by email domain, configurable)
3. Callback URL: `/auth/callback/google`
4. Google credentials via `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` env vars

**Tests:** Integration test with mocked Google OIDC response — new user created; existing user fetched.

**Acceptance:**
- Google sign-in flow completes (manual test)
- New user creation on first sign-in
- Test passes

---

#### B1-AUTH-3 · API Route Middleware

**What:** Protect all API routes with JWT validation.

**Steps:**
1. Replace `apps/web/lib/api/context.ts` hardcoded stub with real session from NextAuth `getServerSession()`
2. `handler.ts` wrapper: extract session, return 401 if missing, attach `{ orgId, userId, role }` to context
3. All Drizzle queries already filter by `orgId` — no changes needed

**Tests:** Integration test — call `GET /api/apps` without session cookie → 401; with valid session → 200.

**Acceptance:**
- All API routes return 401 without auth
- Existing integration tests pass with auth injected via test helpers

---

### Module B1-RBAC · Role-Based Access Control

Parallel with B1-AUTH.

#### B1-RBAC-1 · Organization Roles

**What:** Enforce org-level feature access.

**Roles:** `owner > admin > developer > viewer`

**Steps:**
1. Create `apps/web/lib/rbac/org-roles.ts`:
   ```ts
   const orgPermissions = {
     "manage:integrations": ["owner", "admin"],
     "manage:environments": ["owner", "admin"],
     "manage:users": ["owner", "admin"],
     "create:apps": ["owner", "admin", "developer"],
     "view:apps": ["owner", "admin", "developer", "viewer"],
     "view:audit": ["owner", "admin"],
   } as const
   ```
2. `canOrg(role, permission): boolean` helper
3. Apply in API routes: `POST /api/integrations` requires `manage:integrations`; `GET /api/apps` requires `view:apps`

**Tests:** Unit tests — all permission combinations; verify `viewer` cannot call `POST /api/integrations`.

**Acceptance:**
- All permission unit tests pass
- `viewer` role receives 403 on restricted endpoints

---

#### B1-RBAC-2 · Resource Roles (Per-App)

**What:** App-level `editor` / `viewer` roles.

**Steps:**
1. Add `app_members` table: `{ app_id, user_id, role: "editor" | "viewer" }`
2. Migration + seed
3. `canApp(userId, appId, permission): Promise<boolean>` helper
4. `PUT /api/apps/[id]` (edit source) requires `editor` role on that app
5. Admin Console: app members tab in app settings (add/remove members, change role)

**Tests:** Integration test — user with `viewer` role on app cannot call `PUT /api/apps/[id]`; `editor` can.

**Acceptance:**
- Role enforcement on app edit works
- Tests pass

---

#### B1-RBAC-3 · Frontend Permission Gating

**What:** UI shows/hides controls based on role.

**Steps:**
1. Create `apps/web/lib/rbac/use-permissions.ts` hook — reads session, exposes `can(permission)` 
2. Deploy button hidden for `viewer` org role
3. Edit code pane read-only for `viewer` app role
4. Admin Console nav item hidden for non-admins

**Tests:** Render tests — mock session with `viewer` role; verify deploy button absent; edit pane has `readOnly` attribute.

**Acceptance:**
- Role-gated UI elements behave correctly for both roles
- Tests pass

---

## Phase B2 — Beta (Environments + Data Tags)

> Goal: builders reference environment labels, not credentials. Same app runs against staging in editor and production at runtime.

---

### Module B2-ENV · Environment Resolution

#### B2-ENV-1 · Data Tag Resolution in Execution Engine

**What:** Execution engine resolves credentials via data tag, not direct integration config.

**Steps:**
1. Update `runPipeline()` to accept `envTag: string` parameter
2. Add `resolveCredentials(integrationId, envTag, orgId): Promise<IntegrationConfig>` in `packages/db`
3. Query: `data_tags JOIN integrations WHERE data_tags.environment_id = (SELECT id FROM environments WHERE name = envTag AND org_id = orgId)`
4. If no data tag for requested env → throw `"No credential bound to environment '${envTag}' for integration '${integrationId}'"`

**Tests:** Integration test — seed two environments (`staging`, `production`) bound to two different Postgres connection strings; resolve each; verify correct config returned.

**Acceptance:**
- Correct integration config resolved per env tag
- Missing tag throws correct error
- Tests pass

---

#### B2-ENV-2 · Environment Selector in Editor

**What:** Editor top bar environment selector updates execution context.

**Steps:**
1. Store selected env tag in `apps/web/lib/stores/editor-store.ts` (Zustand)
2. Environment selector fetches `GET /api/environments` and populates dropdown
3. Run API passes `envTag` from store to `POST /api/execute/[apiId]`
4. Visual indicator: `production` env shows red badge warning

**Tests:** Render test — selecting `production` env shows warning badge.

**Acceptance:**
- Running same API with different env tags hits different DBs (manual integration test)
- Warning badge on production
- Test passes

---

#### B2-ENV-3 · Credential Encryption at Rest

**What:** AES-256 encrypt integration credentials before storing in Postgres.

**Steps:**
1. Add `MASTER_KEY` env var (32-byte hex)
2. Create `packages/db/lib/crypto.ts`:
   - `encrypt(plaintext: string, key: Buffer): string` → `iv:ciphertext` (hex)
   - `decrypt(ciphertext: string, key: Buffer): string`
   - Uses Node.js `crypto.createCipheriv('aes-256-gcm', ...)`
3. Update `POST /api/integrations` and `PUT /api/integrations/[id]`: encrypt credential fields before insert
4. Update `resolveCredentials()`: decrypt on read
5. Migration: re-encrypt existing plaintext seeds with `MASTER_KEY`

**Tests:**
- Unit: encrypt → decrypt round-trip
- Unit: decrypt with wrong key throws
- Integration: create integration via API, read raw DB row — verify stored value is not plaintext

**Acceptance:**
- Credentials stored as ciphertext
- Plaintext never returned in API responses
- All tests pass

---

## Phase B3 — Beta (Data Plane Split)

> Goal: extract execution into a standalone Docker container. Control plane calls it over HTTP. Enables hybrid deployment.

---

### Module B3-DP · Data Plane Service

#### B3-DP-1 · Data Plane Service Scaffold

**What:** Standalone Node.js service in `apps/data-plane/`.

**Steps:**
1. Scaffold `apps/data-plane/` with `package.json`, `tsconfig.json`, `src/index.ts`
2. HTTP server on `:8080` using Fastify
3. Move execution engine (`engine.ts`, adapters) from `apps/web/lib/execution/` to `packages/execution/`
4. Both `apps/web` and `apps/data-plane` import from `packages/execution`
5. Routes:
   - `POST /execute` — accepts `{ apiId, envTag, orgId, userId }`, runs pipeline, streams NDJSON
   - `GET /health` — returns `{ ok: true }`
6. `apps/web` `POST /api/execute/[apiId]` now proxies to data plane HTTP instead of running in-process

**Tests:**
- Integration test: POST to data plane `/execute` with a Postgres step; verify result stream
- End-to-end test: control plane → data plane → real Postgres → result back to client

**Acceptance:**
- Data plane runs as separate process (`node apps/data-plane/dist/index.js`)
- Control plane proxies correctly
- Integration tests pass

---

#### B3-DP-2 · Data Plane Dockerfile + Compose

**What:** Data plane containerized and included in dev Docker Compose.

**Steps:**
1. Create `apps/data-plane/Dockerfile` — multi-stage: `build` (tsc) + `runtime` (node:20-alpine)
2. Update `infra/docker/docker-compose.dev.yml`: add `data-plane` service
3. Environment vars: `DATABASE_URL`, `MASTER_KEY`, `CONTROL_PLANE_URL`, `DATA_PLANE_AGENT_TOKEN`
4. Health check in compose: `curl -f http://localhost:8080/health`

**Tests:** Smoke test via `docker compose up` — health check passes within 10s.

**Acceptance:**
- `pnpm db:up` brings up Postgres + Redis + data plane
- Control plane can reach data plane at `http://data-plane:8080`
- Health check passes

---

#### B3-DP-3 · Connection Pool

**What:** Per-integration connection pool in Worker (data plane).

**Steps:**
1. Add `pg-pool` to `packages/execution`
2. Pool: per-integration max 5, global pool manager with max 1000 total connections
3. Idle TTL: 60s
4. Overflow (global max hit): ephemeral connection, not queued
5. Pool keyed by `(orgId, integrationId, envTag)`

**Tests:**
- Unit: pool respects per-integration max (mock pg-pool)
- Integration: 10 concurrent executions against same integration → max 5 pool connections used

**Acceptance:**
- Pool tests pass
- No connection leak on idle TTL expiry

---

#### B3-DP-4 · Redis Step Cache

**What:** Cache step outputs in Redis sidecar.

**Steps:**
1. Add `ioredis` to `packages/execution`
2. Cache key: `execution:${apiId}:${stepId}:${sha256(JSON.stringify(stepInputs))}`
3. TTL: 60s
4. Before running a step: check cache; on hit, return cached output
5. Cache only successful step outputs (no error results cached)

**Tests:**
- Unit: cache hit returns cached value without running adapter
- Unit: cache miss runs adapter and stores result
- Unit: error result not cached

**Acceptance:**
- All cache unit tests pass

---

#### B3-DP-5 · Helm Chart Skeleton

**What:** Kubernetes Helm chart for data plane.

**Steps:**
1. Create `infra/helm/data-plane/` chart:
   - `Chart.yaml`, `values.yaml`
   - `templates/deployment.yaml` — image, env vars from Secret, readiness probe on `/health`
   - `templates/service.yaml` — ClusterIP on 8080
   - `templates/configmap.yaml` — non-secret config
   - `templates/hpa.yaml` — CPU 40%, memory 80%, min 3 replicas
   - `templates/pdb.yaml` — maxUnavailable 1
2. `values.yaml` defaults: `replicaCount: 3`, resource limits, image tag

**Tests:** `helm lint infra/helm/data-plane` — no errors.

**Acceptance:**
- `helm lint` passes
- `helm template` renders valid Kubernetes manifests

---

## Phase B4 — Beta (gRPC Reverse Tunnel)

> Goal: data plane initiates connection to control plane. No inbound VPC ports.

---

### Module B4-GRPC · Reverse Tunnel

#### B4-GRPC-1 · Protobuf Definitions

**What:** Define the gRPC contract between control plane and data plane.

**Steps:**
1. Create `packages/proto/gigablocks.proto`:
   ```proto
   service DataPlane {
     rpc Tunnel(stream ControlMessage) returns (stream DataMessage);
   }
   message ControlMessage {
     oneof payload {
       DispatchRequest dispatch = 1;
       PingRequest ping = 2;
     }
   }
   message DataMessage {
     oneof payload {
       StepResult step_result = 1;
       ExecutionComplete complete = 2;
       ExecutionError error = 3;
       PongResponse pong = 4;
     }
   }
   ```
2. Generate TS types: `protoc` via `ts-proto` or `@grpc/proto-loader`
3. Add `packages/proto` to workspace

**Tests:** Proto compiles to valid TS types without error.

**Acceptance:**
- Generated types pass `tsc`

---

#### B4-GRPC-2 · Data Plane gRPC Client

**What:** Data plane dials control plane on startup, maintains bidi stream.

**Steps:**
1. Add `@grpc/grpc-js` to `apps/data-plane`
2. On startup: dial `CONTROL_PLANE_GRPC_HOST:443` with agent token in metadata
3. Send `PingRequest` every 30s to keep stream alive
4. On `DispatchRequest`: run pipeline, stream `StepResult` messages back
5. Reconnect: exponential backoff (1s → 2s → 4s … 60s max) + jitter on disconnect

**Tests:**
- Unit: reconnect backoff increases correctly (mock gRPC server)
- Integration: data plane dials local gRPC test server; receives dispatch; streams results back

**Acceptance:**
- Data plane connects to local test gRPC server
- Reconnect test passes
- All tests pass

---

#### B4-GRPC-3 · Control Plane gRPC Server + Tunnel Registry

**What:** Control plane accepts reverse tunnel connections and routes dispatch requests.

**Steps:**
1. Add gRPC server to `apps/web` (separate process or embedded): `GRPC_PORT=50051`
2. Authenticate incoming connections: validate agent token from metadata against `agent_tokens` DB table
3. `tunnelRegistry: Map<orgId, BidirectionalStream>` — one entry per connected data plane
4. `dispatchToDataPlane(orgId, request): AsyncGenerator<StepResult>` — send over tunnel stream, collect results
5. Replace `POST /api/execute/[apiId]` HTTP proxy (Phase B3) with `dispatchToDataPlane()`

**Tests:**
- Integration: control plane gRPC server + data plane client connected locally; end-to-end dispatch test
- Unit: tunnel registry routes to correct org stream

**Acceptance:**
- End-to-end: browser → control plane gRPC dispatch → data plane → Postgres → result streamed back
- Data plane container has **no** inbound ports configured (removed `:8080` binding)
- Tests pass

---

## Phase RC1 — Release Candidate (Git Integration)

> Goal: apps live in Git. Deploy = PR merge. CI action syncs commit SHA.

---

### Module RC1-GIT · Git-Native App Model

#### RC1-GIT-1 · GitHub OAuth App

**What:** Connect Gigablocks org to a GitHub org.

**Steps:**
1. Add GitHub OAuth provider to `auth.ts` with `repo` scope
2. Store GitHub access token per user in `user_github_tokens` table (encrypted)
3. Admin Console: "Connect GitHub" button → GitHub OAuth flow
4. Store `github_org` in `organizations` table

**Tests:** Integration test with mocked GitHub OAuth — token stored encrypted in DB.

**Acceptance:**
- GitHub OAuth flow completes (manual)
- Token stored encrypted

---

#### RC1-GIT-2 · App Git Repository Provisioning

**What:** On app create, initialize a GitHub repo.

**Steps:**
1. On `POST /api/apps`: call GitHub API to create repo `{githubOrg}/{appSlug}`
2. Commit initial files: `.gigablocks/gigablocks.json`, `src/App.tsx` (stub React component), `src/api/` (empty dir)
3. Create `gigablocks/live` branch
4. Store `github_repo_url` in `apps` table

**Tests:** Integration test with mocked GitHub API — verify `createRepo` + `createFile` calls made with correct content.

**Acceptance:**
- App create creates GitHub repo (manual verification)
- Integration test with mocked GitHub passes

---

#### RC1-GIT-3 · Editor Save → Git Commit

**What:** Autosave commits to `gigablocks/live` branch.

**Steps:**
1. Update `PUT /api/apps/[id]`: after DB save, commit changed files to `gigablocks/live` via GitHub API
2. Commit message: `chore: autosave [timestamp]`
3. Also update `backend_apis` steps on save → commit `src/api/[name].ts` generated source

**Tests:** Integration test with mocked GitHub API — save app source → verify commit API called with correct content.

**Acceptance:**
- Each save creates a GitHub commit on `gigablocks/live`
- Integration test passes

---

#### RC1-GIT-4 · Deploy → PR Merge

**What:** Deploy button creates PR `gigablocks/live → main` and merges it.

**Steps:**
1. `POST /api/apps/[id]/deploy`: create PR via GitHub API, then merge it
2. Store `deployed_commit_sha` in `apps` table after merge
3. App runtime serves source from `deployed_commit_sha` (fetched from GitHub or cached in DB)

**Tests:** Integration test with mocked GitHub API — deploy creates PR + merge; `deployed_commit_sha` updated in DB.

**Acceptance:**
- Deploy creates merged PR on GitHub (manual)
- Runtime shows deployed version (not live-edit version)
- Test passes

---

#### RC1-GIT-5 · GitHub Actions Sync Webhook

**What:** Auto-provisioned CI action syncs commit SHA back to Gigablocks after external merges.

**Steps:**
1. On GitHub repo creation (RC1-GIT-2): also create `.github/workflows/gigablocks-sync.yml`:
   ```yaml
   on:
     push:
       branches: [main]
   jobs:
     sync:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - run: |
             curl -X POST ${{ secrets.GIGABLOCKS_WEBHOOK_URL }} \
               -H "Authorization: Bearer ${{ secrets.GIGABLOCKS_DEPLOY_TOKEN }}" \
               -d '{"commitSha": "${{ github.sha }}", "appId": "${{ vars.GIGABLOCKS_APP_ID }}"}'
   ```
2. Webhook endpoint `POST /api/webhooks/github/deploy` — validate token, update `deployed_commit_sha`

**Tests:** Integration test — POST to webhook endpoint with valid token; verify `deployed_commit_sha` updated.

**Acceptance:**
- Webhook endpoint validates token and updates SHA
- Test passes

---

## Phase RC2 — Release Candidate (Clark AI Agent)

> Goal: AI agent writes React + TS Backend APIs from a builder prompt. Edit-only data access enforced.

---

### Module RC2-CLARK · Clark Service

#### RC2-CLARK-1 · Clark Service Scaffold

**What:** Standalone `apps/clark/` service.

**Steps:**
1. Scaffold `apps/clark/` — Fastify HTTP server on `:3001`
2. `POST /clark/sessions` — create session `{ appId, prompt, editEnvTag }`, return `sessionId`
3. `GET /clark/sessions/[id]/stream` — SSE stream of diff events
4. Auth: Bearer token validated against control plane

**Tests:** Smoke test — health endpoint responds; session create returns ID.

**Acceptance:**
- Service starts and health check passes

---

#### RC2-CLARK-2 · Anthropic Claude Integration

**What:** Core AI loop using Claude Sonnet + tool use.

**Steps:**
1. Install `@anthropic-ai/sdk`
2. System prompt: Gigablocks React/TS coding assistant, constrained to edit-tagged integrations
3. Tools:
   - `read_file(path)` → reads from `gigablocks/live` branch via GitHub API
   - `write_file(path, content)` → commits to `gigablocks/live`
   - `run_backend_api(apiId, envTag)` → calls execution engine with `envTag === "edit"` enforced (hard-refuse other tags)
4. Streaming: use `claude-sonnet-4-6` for generation, stream token deltas
5. Rate limit: 1 concurrent Clark session per builder (Redis lock: `clark:session:{userId}`)

**Tests:**
- Unit: `run_backend_api` tool hard-refuses `production` env tag — throws before calling execution engine
- Unit: Redis lock prevents second concurrent session

**Acceptance:**
- Clark refuses production env in `run_backend_api` (unit test)
- Concurrent session lock test passes

---

#### RC2-CLARK-3 · Clark Frontend Chat Panel

**What:** Chat UI in editor sidebar.

**Steps:**
1. Add "Clark" tab to editor sidebar
2. Chat input + send button
3. Streaming SSE response shown as Clark "types" the response
4. Diff preview: when `write_file` tool fires, show a side-by-side diff panel
5. "Apply" button: trigger `PUT /api/apps/[id]` with the new source

**Tests:** Render test — chat input submits; streaming response updates UI; diff panel mounts with mock diff.

**Acceptance:**
- Chat panel renders and submits (manual test with real Clark)
- Diff preview shows before apply
- Test passes

---

## Phase MVP — Minimum Viable Product

> Goal: workflows + scheduled jobs. Full async execution surfaces.

---

### Module MVP-WF · Workflows + Scheduled Jobs

#### MVP-WF-1 · Workflow Trigger

**What:** HTTP/webhook-triggered execution with 10-minute timeout.

**Steps:**
1. Add `workflows` table: `{ id, org_id, app_id, trigger_type: "http" | "webhook", config }`
2. `POST /api/apps/[appId]/workflows` — CRUD
3. Webhook URL: `POST /webhooks/[orgSlug]/[workflowId]` — validates HMAC signature, dispatches execution
4. 10-minute timeout (vs 5-minute for app APIs)
5. Fire-and-forget mode: return `202 Accepted` + poll URL

**Tests:** Integration test — POST to webhook URL; execution dispatched; poll URL returns result after completion.

**Acceptance:**
- Webhook dispatch works end-to-end
- 10-minute timeout enforced (unit test with mock timer)
- Test passes

---

#### MVP-WF-2 · Scheduled Jobs

**What:** Cron-triggered execution with 30-minute timeout.

**Steps:**
1. Add `scheduled_jobs` table: `{ id, org_id, api_id, cron_expression, last_run_at, next_run_at }`
2. Scheduler process (in `apps/web` or separate): query jobs where `next_run_at <= now()`; dispatch via gRPC tunnel; update `last_run_at`, compute `next_run_at`
3. Scheduler loop: runs every minute
4. 30-minute timeout per job
5. Run history: `job_runs` table — `{ job_id, started_at, completed_at, status, output_summary }`
6. Admin Console: cron editor + run history table

**Tests:**
- Unit: `next_run_at` computation correct for various cron expressions
- Integration: job scheduled for "1 minute from now"; scheduler fires; `job_runs` row created

**Acceptance:**
- Cron job fires and run history records created
- Admin Console shows run history
- Tests pass

---

#### MVP-WF-3 · Execution Observability

**What:** Per-execution logs stored in Postgres.

**Steps:**
1. Add `execution_logs` table: `{ id, execution_id, step_id, level, message, timestamp }`
2. Data plane emits log events over gRPC tunnel for each step
3. Control plane writes to `execution_logs`
4. Log retention: `DELETE FROM execution_logs WHERE timestamp < now() - interval '30 days'` (daily cron)
5. Admin Console: execution log viewer with filter by API / job / time range

**Tests:** Integration test — run pipeline; verify log rows created for each step; 30-day retention cron deletes old rows.

**Acceptance:**
- Logs written per step
- Retention cron deletes old records
- Admin Console log viewer renders
- Tests pass

---

## Phase V1 — Version 1.0 (Enterprise Hardening)

> Goal: production-ready for Fortune 500 procurement.

---

### Module V1-SSO · Enterprise SSO

#### V1-SSO-1 · SAML + OIDC (Okta, Entra, Google Workspace)

**Steps:**
1. Add SAML 2.0 support via `node-saml`
2. Add OIDC providers: Okta, Entra ID, Google Workspace in addition to generic OIDC
3. Per-org SSO config stored in `sso_configs` table
4. Admin Console: SSO configuration page (upload SAML metadata XML or enter OIDC issuer URL)
5. JIT provisioning: create user on first SSO login

**Tests:** Integration tests with mocked SAML/OIDC responses — user created on first login; existing user updated.

**Acceptance:** SSO login works with Okta (manual test with test account).

---

#### V1-SSO-2 · SCIM Provisioning

**Steps:**
1. Implement SCIM 2.0 endpoints: `GET/POST /scim/Users`, `GET/PUT/PATCH/DELETE /scim/Users/{id}`, `GET/POST /scim/Groups`
2. SCIM auth: Bearer token per org (generated in Admin Console)
3. Group → RBAC role mapping config in Admin Console
4. Deprovision: deactivate user on SCIM DELETE (soft delete, preserve audit trail)

**Tests:** Integration tests against SCIM spec test suite.

**Acceptance:** SCIM endpoints pass spec compliance tests.

---

### Module V1-AUDIT · Audit + Compliance

Parallel with V1-SSO.

#### V1-AUDIT-1 · Audit Log Export

**Steps:**
1. `GET /api/audit/export?format=csv&from=...&to=...` — streams CSV
2. SIEM webhook: configurable URL + secret; events POSTed as JSON on write
3. Webhook retry: exponential backoff, 3 attempts, dead-letter queue in Postgres

**Tests:** Integration test — audit event written → SIEM webhook called (mock HTTP server).

**Acceptance:** CSV export + SIEM webhook work end-to-end.

---

#### V1-AUDIT-2 · MCP Server

**Steps:**
1. Implement MCP endpoint at `/mcp` (HTTP SSE, MCP 2025 spec)
2. Bearer token auth (token issued in Admin Console)
3. Tools:
   - `list_apps` / `deploy_app` / `get_app_source`
   - `list_integrations` / `create_integration`
   - `list_audit_events` with filter params
4. `@gigablocks/mcp-client` package (optional, for SDK consumers)

**Tests:** Unit tests for each MCP tool — correct response shape, auth enforced.

**Acceptance:** Claude Code can connect to MCP server and call all tools.

---

### Module V1-EMBED · Embedded App SDK

Parallel with V1-AUDIT.

#### V1-EMBED-1 · `@gigablocks/embed` (Vanilla JS)

**Steps:**
1. `packages/embed/src/index.ts` — `GigablocksEmbed` class
2. Methods: `mount(element, { appId, token })`, `unmount()`, `on(event, handler)`, `emit(event, data)`
3. Uses Shadow DOM for style isolation
4. JWT auth: `token` passed to data plane for execution

**Tests:** jsdom unit tests — mount renders app shell; event bus works bidirectionally.

**Acceptance:** Embed SDK works in a plain HTML file (manual test).

---

#### V1-EMBED-2 · `@gigablocks/embed-react`

**Steps:**
1. `packages/embed-react/src/GigablocksApp.tsx` — React wrapper around `@gigablocks/embed`
2. Props: `appId`, `token`, `onEvent`, custom event emitter
3. TypeScript types exported

**Tests:** Render test — component mounts without error; `onEvent` fires on custom event.

**Acceptance:** Works in a test React app (manual test).

---

### Module V1-OPS · Production Ops

Parallel with others.

#### V1-OPS-1 · Secret Store Integrations

**Steps:**
1. Update `resolveCredentials()` to support:
   - `env_var` — current mode
   - `aws_secrets_manager` — `@aws-sdk/client-secrets-manager`
   - `hashicorp_vault` — `node-vault`
   - `gcp_secret_manager` — `@google-cloud/secret-manager`
   - `azure_key_vault` — `@azure/keyvault-secrets`
   - `k8s_secret` — reads from mounted volume path
2. Per-integration `secret_backend` config field

**Tests:** Unit tests with mocked SDK clients for each backend — verify correct SDK method called with correct key.

**Acceptance:** Each secret backend unit test passes.

---

#### V1-OPS-2 · Prometheus Metrics + Grafana

**Steps:**
1. Add `prom-client` to `apps/data-plane`
2. Metrics on `:9090/metrics`:
   - `gigablocks_execution_duration_seconds` histogram (by api_id, step_type)
   - `gigablocks_execution_errors_total` counter (by error_code)
   - `gigablocks_active_connections` gauge (by integration_type)
   - `gigablocks_grpc_tunnel_connected` gauge
3. Grafana dashboard JSON in `infra/grafana/dashboards/data-plane.json`
4. Update Helm chart HPA: CPU 40%, memory 80%

**Tests:** Unit test — metrics registry contains expected metric names after execution.

**Acceptance:** Prometheus scrapes metrics; Grafana dashboard loads (manual).

---

#### V1-OPS-3 · Full Helm Chart

**Steps:**
1. Complete `infra/helm/data-plane/` with:
   - `hpa.yaml` — CPU 40%, memory 80%, min 3, max 20
   - `pdb.yaml` — `maxUnavailable: 1`
   - `networkpolicy.yaml` — egress only (no inbound except health check port from cluster)
   - `serviceaccount.yaml`
   - Resource requests/limits in `values.yaml`
2. Add `infra/helm/control-plane/` chart for `apps/web`
3. `README.md` in `infra/helm/` with installation instructions

**Tests:** `helm lint` + `helm template` for both charts → valid manifests.

**Acceptance:**
- Both charts lint clean
- Manifests deployable to local `kind` cluster (manual)

---

## Cross-Cutting Concerns (all phases)

### Testing Standards

Every task ships tests. Levels:
- **Unit** (`*.test.ts`) — pure functions, no I/O, fast
- **Integration** (`*.integration.test.ts`) — real Postgres/Redis via Docker, run in CI
- **E2E** (`*.e2e.test.ts`) — Playwright, run on staging, not required to merge

Test runner: `vitest` for unit/integration; `playwright` for E2E.
Coverage threshold: 80% lines for `packages/*`, 70% for `apps/*`.

### Agent-Friendly Development Checklist

Every task must:
- Have a single entry-point file (`index.ts` or the main route file)
- Export all public types
- Include a `README.md` update if it adds a new package
- Have an `Acceptance` block that can be verified by running commands (not by "check manually")
- Not have circular imports between packages

### Environment Variables

Central registry at `apps/web/.env.example` and `apps/data-plane/.env.example`. Every new env var must be:
1. Added to the relevant `.env.example` with a comment
2. Validated at startup (throw on missing required vars)

### Security Invariants (enforced in CI)

A custom lint rule (`packages/eslint-config/rules/gigablocks-security.js`) must flag:
1. Any `console.log` that includes the word `credential`, `password`, `secret`, or `token`
2. Any `JSON.stringify` of an object typed as `IntegrationConfig`
3. Any `envTag === "production"` check inside Clark service — must always throw

---

## Milestone Summary

| Phase | Key Deliverable | Done When |
|---|---|---|
| **A0** | Static mockups + CI/CD | Non-technical stakeholder can click all 5 screens; CI green |
| **A1** | Persistent data layer | Builder saves code, closes browser, reopens, sees code |
| **A2** | Real execution | Builder runs SQL step, sees real Postgres rows |
| **B1** | Auth + RBAC | Two users, different roles, different access |
| **B2** | Environments | Same app, different env tags, different DBs |
| **B3** | Data plane split | Data plane in Docker container, control plane proxies to it |
| **B4** | gRPC reverse tunnel | Data plane has no inbound ports |
| **RC1** | Git integration | Deploy = GitHub PR merge; CI syncs commit SHA |
| **RC2** | Clark AI agent | "Add a users table" → Clark writes query + component |
| **MVP** | Workflows + scheduled jobs | Nightly cron job runs; run history shows success |
| **V1.0** | Enterprise hardening | Okta SSO, SCIM, audit export, MCP, secret stores, Helm |
