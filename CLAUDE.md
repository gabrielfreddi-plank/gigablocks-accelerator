<!-- GSD:project-start source:PROJECT.md -->
## Project

**Multi-Agent AI Sandbox**

A learning sandbox for integrating production-quality AI features (chat, canvas, memories) and a multi-agent system into one Next.js application. The current focus is adding a generalized multi-agent orchestrator with config-driven specialists — demonstrated through an "AI Research Analyst" flow that combines agentic RAG over an internal document corpus with public-web browsing.

**Core Value:** Show the integration: a config-driven multi-agent orchestrator that composes RAG + browser specialists into a coherent research flow, with production-quality observability (structured logs + cost tracking + in-app trace viewer) — so the patterns learned across three prior projects come together in one app.

### Constraints

- **Tech stack**: Next.js 16 + React 19 + Supabase + Anthropic SDK — must extend the existing app, not fork or replace it
- **Architecture**: Multi-agent code must respect the existing Ports & Adapters layout (`src/lib/ai/{ports,application,infrastructure}/`) — orchestrator and specialists go behind ports
- **Extensibility**: Specialist registry must be config-driven (prompt + tools + model defined in config/data, not new code per specialist)
- **Browser specialist scope**: Public web only — no login flows, no cookie-protected pages
- **Error recovery**: Browser failure must not abort a run — fall back to search API and continue
- **Observability target**: In-app trace viewer is the primary surface (no external observability platform integration)
- **Planning artifacts**: `.planning/` is gitignored and stays local — never commit planning docs to git
- **Done bar**: Polished local demo — smooth UX, working trace viewer, recordable; not production-deployed
- **Test coverage**: At least 3 E2E tests covering orchestrator → specialists → final report (Playwright, alongside existing tests in `tests/`)
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.9.2 — all application code in `src/`
- SQL — Supabase migrations in `supabase/migrations/`
- CSS (Tailwind v4) — utility-first styles, global sheet at `src/app/globals.css`
## Runtime
- Node.js >=24 (enforced via `"engines"` in `package.json`)
- pnpm 10.33.0 (enforced via `"packageManager"` field)
- Lockfile: `pnpm-lock.yaml` present and committed
## Frameworks
- Next.js 16.2.0 — App Router, Server Components, Server Actions, Route Handlers
- React 19.2.0 — UI rendering, `useActionState`, `useOptimistic` patterns available
- `ai` ^6.0.169 (Vercel AI SDK) — `createUIMessageStream`, `createUIMessageStreamResponse`, `DefaultChatTransport`, `useChat`
- `@ai-sdk/react` ^3.0.171 — `useChat` hook for client-side chat streaming
- `@anthropic-ai/sdk` ^0.91.1 — direct Anthropic Messages API (streaming, structured output via `zodOutputFormat`)
- Tailwind CSS v4.2.2 — via `@tailwindcss/postcss`
- shadcn/ui pattern — `src/components/ui/` contains composable primitives (button, card, dialog, etc.)
- Radix UI primitives — `@radix-ui/react-*` packages underpin shadcn components
- `@base-ui/react` ^1.4.0 — additional headless UI primitives
- `lucide-react` ^1.8.0 — icon set
- `class-variance-authority` + `clsx` + `tailwind-merge` — variant/className utilities, `cn()` at `src/lib/utils.ts`
- `@json-render/core` ^0.18.0 — schema definition and catalog
- `@json-render/react` ^0.18.0 — `Renderer`, `StateProvider`, `ActionProvider`, `useUIStream`
- `@json-render/shadcn` ^0.18.0 — pre-built shadcn component definitions for the registry
- `streamdown` ^2.5.0 — markdown streaming renderer used in AI message display
- `@streamdown/code`, `@streamdown/math`, `@streamdown/mermaid`, `@streamdown/cjk` — plug-ins
- `shiki` ^4.0.2 — syntax highlighting for code blocks
- `recharts` ^3.8.1 — bar/line charts used in Canvas UI components
- `zod` ^4.3.6 — schema validation at API boundaries, tool inputs, canvas/chat request schemas
- `nanoid` ^5.1.9 — ID generation
- `mathjs` ^15.2.0 — safe math evaluation for `calculatorTool`
- `cmdk` ^1.1.1 — command palette primitive
- `use-stick-to-bottom` ^1.1.3 — chat scroll-to-bottom behavior
- Vitest ^4.1.4 — unit test runner, `jsdom` environment
- `@testing-library/react` ^16.3.0 + `@testing-library/user-event` ^14.6.1 — component testing
- `@testing-library/jest-dom` ^6.9.1 — custom matchers
- `@vitest/coverage-v8` ^4.1.4 — code coverage
- `@playwright/test` ^1.52.0 — E2E and integration tests (two separate projects)
- TypeScript ESM modules (`"type": "module"`)
- tsconfig target ES2022, `moduleResolution: Bundler`, path alias `@/*` → `./src/*`
- `eslint` ^9.39.1 with `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `@next/eslint-plugin-next`, `eslint-config-prettier`
- `prettier` ^3.7.4 — code formatting
- `postcss` with `@tailwindcss/postcss` for CSS processing
## Key Dependencies
- `@anthropic-ai/sdk` ^0.91.1 — sole AI model client; all chat and canvas AI calls go through `AnthropicChatModel`
- `@supabase/supabase-js` + `@supabase/ssr` ^0.10.2 — database client and SSR-aware auth sessions
- `ai` ^6.0.169 — UI message streaming infrastructure; `createUIMessageStream` drives the chat protocol
- `@json-render/react` ^0.18.0 — Canvas feature depends entirely on this for spec-to-UI rendering
- `posthog-js` ^1.371.2 — browser analytics
- `posthog-node` ^5.30.0 — server-side event capture
- `@tavily/core` ^0.7.3 — web search and URL extraction tool execution
## Configuration
- `.env.local` file present (secrets not read)
- Required public vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- Required server vars: `ANTHROPIC_API_KEY` (or `ANTHROPIC_AUTH_TOKEN`), `TAVILY_API_KEY`
- Optional: `ANTHROPIC_BASE_URL` (proxy override), `MODEL_NAME` (defaults to `claude-haiku-4-5`)
- `next.config.ts` — PostHog reverse proxy rewrites at `/ingest/*`, `skipTrailingSlashRedirect: true`
- `vercel.json` — `pnpm install --frozen-lockfile`, `pnpm build`, output `.next`
- `tsconfig.json` — strict mode, `noUncheckedIndexedAccess: true`, excludes `mcp/`, `tests/`, `apps/`, `packages/`
- `vitest.config.ts` — jsdom environment, excludes `.claude/`, `tests/` (Playwright-only dirs)
- `playwright.config.ts` — two projects: `e2e` (`tests/e2e/`) and `integration` (`tests/integration/`), baseURL `http://127.0.0.1:3000`
## Platform Requirements
- Node.js >=24
- pnpm 10.33.0
- Supabase project with migrations applied
- `.env.local` with all required vars
- Deployed to Vercel (Next.js framework preset)
- Supabase as hosted PostgreSQL + Auth backend
- PostHog (US region, `us.i.posthog.com`)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## System Overview
```text
```
## Component Responsibilities
| Component | Responsibility | File |
|-----------|----------------|------|
| Chat Route Handler | Auth guard, parse request, inject dependencies, return stream response | `src/app/api/chat/route.ts` |
| Canvas Route Handler | Parse request, resolve current spec, return NDJSON stream | `src/app/api/canvas/route.ts` |
| `runChatStream` | Orchestrate Anthropic tool-use loop (max 6 steps), write UI stream events | `src/lib/ai/application/runChatStream.ts` |
| `runCanvasStream` | Stream NDJSON patch operations from LLM, filter invalid lines | `src/lib/ai/application/runCanvasStream.ts` |
| `buildSystemPrompt` | Compose base system prompt + injected memory block | `src/lib/ai/application/buildSystemPrompt.ts` |
| `AnthropicChatModel` | Wraps Anthropic SDK `.messages.stream()`, delegates text delta callbacks | `src/lib/ai/infrastructure/anthropicChatModel.ts` |
| `ToolRegistry` | Registers and looks up `ToolDefinition` instances by name | `src/lib/ai/infrastructure/toolRegistry.ts` |
| `memoryRepository` | CRUD for `memories` table; typed errors for conflict/not-found | `src/lib/memory/memoryRepository.ts` |
| `ChatInterface` | Client component: multi-session chat, localStorage persistence, streaming UI | `src/components/chat/ChatInterface.tsx` |
| `CanvasInterface` | Client component: prompt-to-spec streaming, JSON-render rendering | `src/components/canvas/CanvasInterface.tsx` |
| `MemoriesManager` | Client component: CRUD UI for user memories via Server Actions | `src/components/memories/MemoriesManager.tsx` |
| `PostHogProvider` | Wraps app with analytics: identify, pageview, reset on sign-out | `src/components/providers/posthog-provider.tsx` |
| `proxy.ts` | Middleware route guard: redirects unauthenticated/authenticated users | `src/proxy.ts` |
## Pattern Overview
- AI application logic (`runChatStream`, `runCanvasStream`) depends only on `ChatModelPort` and `ToolRegistryPort` interfaces — not concrete classes
- Infrastructure classes (`AnthropicChatModel`, `ToolRegistry`) are instantiated at the API route boundary and injected into application functions
- Server Actions (`src/lib/actions/`) are the mutation boundary between Client Components and Supabase
- Chat session history is stored in `localStorage` client-side only — no server-side session persistence
- The Canvas feature uses an NDJSON patch protocol: the LLM outputs JSON patch lines, the server filters and forwards them, and the client applies them incrementally
## Layers
- Purpose: HTTP entry points, request parsing, auth enforcement, dependency injection
- Location: `src/app/api/`
- Contains: `POST /api/chat`, `POST /api/canvas`, `GET|PUT /api/companies/[id]`, `GET /api/companies/[id]/users-count`
- Depends on: application layer, infrastructure layer, Supabase server client
- Used by: browser clients (fetch/streaming)
- Purpose: AI orchestration — tool-use loop, system prompt assembly, streaming protocol
- Location: `src/lib/ai/application/`
- Contains: `runChatStream.ts`, `runCanvasStream.ts`, `buildSystemPrompt.ts`
- Depends on: `ChatModelPort`, `ToolRegistryPort` (ports only — no concrete imports)
- Used by: API route handlers
- Purpose: Interface contracts that decouple application logic from infrastructure
- Location: `src/lib/ai/ports/`
- Contains: `chatModel.ts` (`ChatModelPort`), `toolRegistry.ts` (`ToolRegistryPort`, `ToolDefinition`)
- Depends on: nothing (pure TypeScript interfaces)
- Used by: application layer (type imports), infrastructure layer (implements)
- Purpose: Concrete implementations of ports, external SDK wrappers, tool definitions
- Location: `src/lib/ai/infrastructure/`
- Contains: `AnthropicChatModel`, `ToolRegistry`, and 8 tool files in `tools/`
- Depends on: `@anthropic-ai/sdk`, `@tavily/core`, `mathjs`, memory repository
- Used by: instantiated at API route handlers
- Purpose: Typed database access with domain error classes
- Location: `src/lib/memory/memoryRepository.ts`, `src/lib/supabase/`
- Contains: CRUD functions + `MemoryTitleConflictError`, `MemoryNotFoundError`
- Depends on: Supabase client, generated `Database` types
- Used by: Server Actions (`src/lib/actions/memories.ts`), infrastructure tools, API routes
- Purpose: Server-side mutations callable directly from Client Components via React's `useActionState`
- Location: `src/lib/actions/`
- Contains: `auth.ts`, `company.ts`, `documents.ts`, `memories.ts`, `extractPolicies.ts`
- Depends on: repository layer, Supabase server client, PostHog server client
- Used by: Client Component forms (sign-in, sign-up, memories CRUD)
- Purpose: Rendering, interaction, layout
- Location: `src/components/`
- Sub-directories:
## Data Flow
### Chat Request (Streaming)
### Canvas Request (NDJSON Streaming)
### Memory Tool Call (within Chat)
### Server Action Mutation
- Chat sessions (multi-session, messages) — `localStorage` via `chatSessionsStorage.ts`, keyed at `gigablocks.chat.sessions`
- Canvas spec — in-memory React state inside `CanvasInterface`, no persistence
- Auth session — Supabase cookie-based session, refreshed by SSR client middleware
- Memories — Supabase DB, fetched on page load via Server Action, mutated via Server Actions with `revalidatePath`
## Key Abstractions
- Purpose: Unified interface for AI tools — name, description, Zod input schema, raw JSON schema, execute function
- Examples: `src/lib/ai/infrastructure/tools/webSearch.ts`, `src/lib/ai/infrastructure/tools/saveMemory.ts`
- Pattern: Stateless tools exported as `const toolName: ToolDefinition`; user-scoped tools exported as factory functions `createXxxTool(userId: string): ToolDefinition`
- Purpose: Decouples the tool-use loop from any specific AI provider
- Location: `src/lib/ai/ports/chatModel.ts`
- Pattern: Single `stream()` method returning `Promise<Message>` (Anthropic `Message` type)
- Purpose: JSON spec describing a rendered UI as a tree of typed elements
- Location: `src/lib/ai/contracts/canvasSchema.ts`
- Pattern: Zod schema `{ root: string, elements: Record<string, CanvasSpecElement>, state?: Record<string, unknown> }`
- Purpose: Defines available components for Canvas AI generation and runtime rendering
- Catalog (`src/components/canvas/component-catalog.ts`) — schema + prompt generation for the LLM system prompt
- Registry (`src/components/canvas/component-registry.ts`) — runtime component map for `@json-render/react` `Renderer`
## Entry Points
- Location: `src/app/layout.tsx`
- Triggers: All page requests
- Responsibilities: Geist font, dark mode, PostHog provider, auth user fetch for identification
- Location: `src/app/(dashboard)/layout.tsx`
- Triggers: All dashboard routes
- Responsibilities: Auth guard (redirect to `/sign-in` if no user), top navigation
- Location: `src/proxy.ts`
- Triggers: All non-static, non-API requests (via `config.matcher`)
- Responsibilities: Session refresh, route protection, redirect logic
- `src/app/api/chat/route.ts` — POST, streamed chat with tool use
- `src/app/api/canvas/route.ts` — POST, streamed NDJSON canvas spec
## Architectural Constraints
- **Threading:** Single-threaded Node.js event loop; no worker threads used
- **Global state:** PostHog server singleton at `src/lib/posthog/server.ts` (module-level `_client`); all other state is request-scoped or client-local
- **Circular imports:** None detected
- **Chat persistence:** Chat session history lives exclusively in `localStorage` — no server-side conversation history. Each `/api/chat` call receives the full message history from the client
- **Tool step cap:** `MAX_TOOL_STEPS = 6` in `runChatStream.ts` — after 6 iterations an error event is written to the stream
- **Canvas spec:** No persistence — refreshing the page clears the Canvas. Spec lives only in `CanvasInterface` React state
## Anti-Patterns
### Direct Anthropic SDK import in Server Action
### No request body validation in company PUT route
## Error Handling
- Repository functions throw `MemoryTitleConflictError` / `MemoryNotFoundError` for known failure modes; callers do `instanceof` checks
- Server Actions catch typed errors and return `{ error: string }` state to `useActionState`
- API route handlers wrap in `try/catch` and return `NextResponse.json({ error }, { status })` — 401 for unauthenticated, 400 for bad input, 500 for unexpected errors
- Tool execution errors in `runChatStream` are caught per-tool and written as `tool-output-error` stream events (non-fatal, loop continues)
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
