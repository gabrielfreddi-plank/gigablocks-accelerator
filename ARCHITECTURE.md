# Gigablocks — Architecture

Gigablocks is an enterprise internal-tooling platform. Developers build React applications against a governed integration layer; those apps run against customer data sources with production credentials that never leave the customer's network. The product has three user personas: **Builders** (developers building apps), **End Users** (employees using those apps), and **Admins** (managing access, environments, integrations).

---

## Product Surfaces

| Surface | What it is |
|---|---|
| **App Editor** | Browser-based IDE where builders write React apps and Backend APIs |
| **App Runtime** | The rendered app that end users interact with |
| **Admin Console** | Org management: integrations, environments, RBAC, audit |
| **Clark** | AI coding agent embedded in the editor |

---

## Deployment Topologies

Gigablocks ships in three modes. All architectural decisions flow from this topology choice.

### Cloud (default)
Everything — including data plane execution — runs in Gigablocks-managed infrastructure. Simplest to adopt, no customer-managed infrastructure.

### Hybrid (primary enterprise target)
Control plane (auth, metadata, editor, RBAC) lives in Gigablocks Cloud. Data plane (query execution, integration adapters) runs in the customer's VPC. **Production credentials and query results never leave the customer network.** The data plane initiates an outbound-only gRPC reverse tunnel to the control plane — no inbound ports required in the VPC.

### Cloud-Prem
The entire product, including AI inference, runs inside the customer VPC. For air-gapped or maximally regulated environments.

The Hybrid topology is the load-bearing design. All architecture decisions assume Hybrid unless stated.

---

## System Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    GIGABLOCKS CLOUD                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Editor SPA  │  │  Control API │  │   Clark Service   │  │
│  │  (Next.js)   │  │  (Node/TS)   │  │   (AI agent)      │  │
│  └──────────────┘  └──────┬───────┘  └───────────────────┘  │
│                           │                                  │
│  ┌──────────────┐  ┌──────▼───────┐  ┌───────────────────┐  │
│  │  Metadata DB │  │  RBAC/Auth   │  │   Audit Store     │  │
│  │  (Postgres)  │  │  SSO/SCIM    │  │                   │  │
│  └──────────────┘  └──────┬───────┘  └───────────────────┘  │
│                           │ gRPC reverse tunnel              │
└───────────────────────────┼──────────────────────────────────┘
                            │ (outbound from VPC, TLS 443)
════════════════════════════╪═══════════ CUSTOMER NETWORK ══════
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                     DATA PLANE (customer VPC)                │
│                                                              │
│  ┌──────────────────────────────────────────────┐            │
│  │  Orchestrator (Node.js)                      │            │
│  │  - Owns gRPC reverse tunnel                  │            │
│  │  - Enforces quotas + timeouts                │            │
│  │  - Routes steps to Worker                    │            │
│  └───────────────────┬──────────────────────────┘            │
│                      │                                       │
│  ┌───────────────────▼──────────────────────────┐            │
│  │  Worker (Node.js)                            │            │
│  │  - Runs integration adapters                 │            │
│  │  - Executes user JS/Python code steps        │            │
│  │  - Fetches credentials from env/Vault        │            │
│  └───────────────────┬──────────────────────────┘            │
│                      │                                       │
│          Redis (step-output cache only)                      │
│          Prometheus metrics :9090                            │
│                                                              │
└─────────────────────┬────────────────────────────────────────┘
                      │
        Postgres / Snowflake / REST APIs / S3 / ...
        (customer private data sources)
```

End users' browsers call the data plane directly over HTTP (`:8080`). The control plane never sees query results.

---

## Core Components

### Control Plane

**Editor SPA (Next.js)**
Browser-based IDE. Builders write React component trees and TypeScript Backend APIs. Real-time sync with local IDE (VSCode/Cursor) via a dev-mode bridge. Apps are stored as React source in Git.

**Control API (Node.js/TypeScript)**
- Serves editor traffic and admin console
- Issues JWTs after SSO authentication
- Resolves routing: which data plane handles which request
- Writes app definitions, integration configs, RBAC state to Postgres
- Encrypts credentials with AES-256 before storage

**RBAC + Auth**
- SSO via SAML/OIDC (Okta, Entra ID, Google Workspace)
- SCIM provisioning for user/group sync
- Two-axis RBAC: **Organization Roles** (feature access) × **Resource Roles** (per-app permissions)
- **Data Tags**: an indirection layer that maps an environment label (`production`, `staging`) to a credential bundle. Apps reference tags, not credentials directly.
- OAuth On-Behalf-Of (OBO): for integrations like Snowflake and Salesforce, the end user's identity (not a service account) is propagated downstream, preserving row-level security.

**Metadata DB (Postgres)**
Stores: app definitions (React source + manifest), integration configs (credential references, auth type), environments, RBAC graph, org settings, audit events.

**Clark Service**
AI coding agent. Takes builder prompts, reads app state, generates React/TS diffs. Runs in an ephemeral sandbox with access to the Edit-tagged environment. In Hybrid mode, Edit-environment query results *do* travel to this service — this is the intentional tradeoff (Edit ≠ Production).

**Audit Store**
Event store for six categories: auth events, entity management, API activity, permission changes, data access, admin actions. Queryable via MCP and exportable to SIEM.

**MCP Server**
Model Context Protocol endpoint at `/mcp`. Bearer-token auth. Exposes tools for: listing/deploying apps, managing integrations, reading audit logs. Enables AI coding agents (Claude Code, Cursor) to manage Gigablocks programmatically.

---

### Data Plane

Deployed by the customer into their VPC. Kubernetes (Helm), ECS Fargate, Azure Container Apps, Cloud Run, or Docker Compose.

**Orchestrator (Node.js)**
- Dials outbound gRPC to control plane on startup; maintains persistent bidi stream
- Receives execution requests dispatched by the control plane
- Enforces time limits (5 min for app APIs, 10 min for workflows, 30 min for scheduled jobs)
- Drives multi-step API execution: fan-out, sequential chaining, parallel branches
- JWT validation (public keys fetched once from control plane; cached locally)

**Worker (Node.js)**
- Runs integration adapters (one per integration type)
- Executes JS and Python code steps in a sandbox
- Fetches credentials at query time from: env vars, AWS Secrets Manager, HashiCorp Vault, Azure Key Vault, GCP Secret Manager, Kubernetes Secrets
- Connection pool: per-integration cap 5, global cap 1000, 60s idle TTL; overflow = ephemeral connection (not queued)

**Redis (sidecar)**
Step-output cache only. Not a job queue. Not clustered. Stateless replicas do not share Redis.

**Metrics**
Prometheus-compatible on `:9090`. HPA targets: 40% CPU, 80% memory. Minimum 3 replicas for HA.

---

### Integration Layer

~70 adapters. Categories:

| Category | Examples |
|---|---|
| Relational DB | Postgres, MySQL, MSSQL, Redshift, BigQuery, Snowflake, Databricks |
| NoSQL | MongoDB, DynamoDB, Redis, Elasticsearch |
| Object Storage | S3, GCS, Azure Blob |
| REST/GraphQL | Generic HTTP, GraphQL |
| SaaS | Salesforce, Stripe, Slack, Zendesk, HubSpot |
| AI | Anthropic, OpenAI, Gemini, Cohere |

Auth modes per adapter: Basic, API Key, OAuth 2.0, OAuth OBO, AWS IAM Role, Azure Managed Identity, SSH tunnel, TLS client cert.

Credentials are **never hardcoded**. Template syntax: `{{Env.MY_SECRET}}` expands at execution time. "Fetch dynamically" mode pulls from secret store on every invocation.

---

### App Model

Apps are **real React source code** stored in Git. This is the central architectural bet: LLMs edit code, not JSON DSL.

**Source of truth: Git**
- Working branch: `gigablocks/live`
- Deploy: merge to `main` via PR
- Auto-provisioned CI action syncs the merged commit SHA back to Gigablocks; control plane marks it deployed
- Manifest: `.gigablocks/gigablocks.json`

**Backend APIs**
TypeScript files using the Gigablocks API SDK. Builders define multi-step pipelines: SQL queries, REST calls, JS transforms, parallel branches. Each step can reference prior step outputs. The orchestrator drives execution; the worker runs each step.

**Frontend**
React components. Builders import `useGigablocksQuery(apiName)` to bind UI to Backend APIs. Standard React event handling, state, and routing.

**Embedded Apps**
SDK: `@gigablocks/embed` (vanilla JS) and `@gigablocks/embed-react`. JWT auth, bidirectional custom-event messaging. Not iframes — React portal or Shadow DOM integration.

---

### Execution Model

| Trigger type | Max duration | Notes |
|---|---|---|
| App API (user action) | 5 min | Synchronous, request-response |
| Workflow (webhook/HTTP) | 10 min | Same engine, longer budget |
| Scheduled Job (cron) | 30 min | Dispatched by control-plane scheduler; runs on data plane |
| Code step (JS/Python) | 2 min | Within any of the above |

Scheduled Jobs: the control plane owns the cron schedule and dispatches over the reverse tunnel. The data plane executes but never needs to be clock-aware.

---

## Data Flow — End User Request (Hybrid)

1. Browser loads app shell from CDN (served by Gigablocks Cloud).
2. User authenticates via SSO. Control plane issues a signed JWT.
3. User action triggers a Backend API call. Browser posts directly to `data-plane-host:8080`.
4. Orchestrator validates JWT (local cache of public keys from control plane).
5. RBAC check: resource role + data tag resolved from control plane state (cached on startup + invalidated via gRPC control channel).
6. Orchestrator dispatches steps to Worker with resolved integration config.
7. Worker fetches credential from secret store, executes query against the customer's database.
8. Results flow back through Orchestrator → browser. Large payloads streamed in chunks.
9. Audit event emitted over the gRPC control channel to the Audit Store. Metadata only — no query results.

**Production data path: Browser → Data Plane → DB. Control plane not in the hot path.**

---

## Data Flow — Clark (AI Build)

1. Builder prompts Clark in the editor.
2. Clark agent loop runs in its ephemeral sandbox (Gigablocks Cloud in Hybrid; customer VPC in Cloud-Prem).
3. Clark reads data tagged `edit` (non-production) to ground responses. **This is the one case where data crosses the VPC in Hybrid.** Admins must not tag production credentials as `edit`.
4. Clark emits React/TS diffs, commits to `gigablocks/live`.
5. Builder reviews, deploys → PR merge → CI action → control plane marks commit deployed.

---

## Security Model

| Concern | Mechanism |
|---|---|
| Credential storage | AES-256 in Postgres (Cloud) or customer secret store (Hybrid) |
| Credential access | Template expansion at query time; never logged |
| Network | TLS 1.2/1.3; data plane outbound-only; no inbound VPC ports |
| Identity | SSO + SCIM; JWT for API auth |
| Authorization | Org role × resource role × data tag — enforced at orchestrator |
| Audit | All six event categories written to immutable store |
| AI data boundary | Clark only reads Edit-tagged data; Production-tagged never sent to LLM |

**Key risk:** In Hybrid, the control plane is on the auth critical path. If control plane is unreachable, new sessions cannot be established (existing JWT sessions continue until expiry).

---

## Technology Stack

| Layer | Technology | Why |
|---|---|---|
| Editor + Control API | Next.js + Node.js/TypeScript | Full-stack TS; SSR for editor, API routes for backend |
| Data Plane | Node.js/TypeScript | Same language across full stack; async I/O fits adapter workloads |
| Control↔Data RPC | gRPC bidi streaming | Reverse-tunnel pattern; multiplexed streams; binary efficiency |
| Metadata | Postgres | Relational RBAC graph; transactional app config; well-understood ops |
| Step cache | Redis | Single-process TTL cache; no clustering needed |
| Frontend apps | React | LLMs know React; escape-hatch to raw code; massive ecosystem |
| Auth | SAML/OIDC + JWT | Standard enterprise SSO; stateless API auth |
| CI/CD integration | GitHub Actions | Git-native app model; webhook + sync action |
| Metrics | Prometheus + Grafana | Standard Kubernetes observability |
| Deployment | Helm / Docker Compose | Operator-familiar; Helm for prod, Compose for dev/eval |

---

## Bottom-Up Build Order

The following sequence is designed for a Planner agent to generate a phased implementation plan. Each phase is independently shippable and testable. Start with visual mockups to validate UX before building execution infrastructure.

### Phase 0 — Mockups (no backend)
**Goal:** validate the UX model before writing a line of backend code.

- Static Next.js project, no database, no auth
- Mock data hardcoded in JSON fixtures
- Screens to mock:
  1. **App Editor** — left sidebar (file tree), center pane (React code editor), right pane (live preview iframe), top bar (deploy button, environment selector)
  2. **Backend API Builder** — list of steps, step config panel (query textarea, integration dropdown), step output viewer
  3. **Admin Console** — integrations list, add-integration modal (name, type, auth fields), environments list, RBAC roles table
  4. **App Runtime** — rendered app with a button that triggers a "query" (mocked response shown)
  5. **Audit Log** — table of events with filters
- No routing complexity; each screen is a standalone page
- Design system: pick one (Shadcn/ui + Tailwind recommended for React alignment)

**Done when:** a non-technical stakeholder can click through all five screens and understand what the product does.

---

### Phase 1 — Local Data Layer (no auth, no data plane)
**Goal:** replace mocked fixtures with a real Postgres database and a minimal API.

- Postgres schema: `organizations`, `apps`, `backend_apis`, `integrations`, `environments`, `data_tags`, `users`
- REST API (Next.js API routes or a separate Express/Fastify service):
  - CRUD for apps, backend APIs, integrations, environments
  - No auth yet — single hardcoded org, single hardcoded user
- Editor saves app source to Postgres; live preview loads it back
- Integration config saved to DB (credentials stored plaintext for now — hardened in Phase 3)
- Admin Console CRUD is wired to real API calls

**Done when:** builder can create an app, write React code, save it, close the browser, reopen, and see their code.

---

### Phase 2 — Backend API Execution (in-process, no data plane split)
**Goal:** actually execute Backend API steps against a real database.

- Single execution engine (Node.js, in-process with the API server — no orchestrator/worker split yet)
- Implement 3 adapters first: Postgres, REST HTTP, and a JavaScript code step
- API endpoint: `POST /api/execute/:apiId` — runs all steps sequentially, returns output
- Frontend: App Runtime calls this endpoint; step outputs displayed in the editor's output panel
- Query results streamed back in JSON (no chunking yet)
- Connection pool: naive, per-request connections (pool added in Phase 5)
- Execution timeout: `Promise.race` with a 30s limit

**Done when:** builder writes a SQL query step, runs it from the editor, sees real rows from their local Postgres.

---

### Phase 3 — Auth + RBAC
**Goal:** real users, real sessions, permission enforcement.

- SSO: start with email/password (Lucia Auth or NextAuth) as a proxy for OIDC; add OIDC (Google) next
- JWT issuance on login; sent as `Authorization: Bearer` header
- Org-scoped everything: all DB queries filter by `organization_id`
- Organization roles: `owner`, `admin`, `developer`, `viewer`
- Resource roles: `editor`, `viewer` per app
- Middleware: validate JWT on all API routes; attach `user` + `org` to request context
- Frontend: login page, org switcher, per-app permission gating (edit vs view)
- Credential encryption: AES-256 encrypt integration credentials at rest using a `MASTER_KEY` env var

**Done when:** two users in the same org have different permissions; one cannot edit an app the other owns.

---

### Phase 4 — Data Tags + Environments
**Goal:** builders reference environment labels, not hardcoded credentials.

- `environments` table: `{ id, org_id, name }` — e.g., `production`, `staging`, `edit`
- `data_tags` table: maps `(integration_id, environment_id)` → credential bundle
- Execution engine resolves which credential bundle to use based on the active environment at runtime
- Environment selector in the editor top bar switches execution context
- Clark's Edit data boundary: Clark agent can only trigger execution against `edit`-tagged integrations

**Done when:** same app runs against staging DB in the editor and production DB at runtime, with zero code changes.

---

### Phase 5 — Orchestrator / Worker Split + Data Plane
**Goal:** split execution into the two-process architecture that enables Hybrid deployment.

- Extract the execution engine into a standalone `data-plane` service (Docker container)
- **Orchestrator process**: HTTP server (`:8080`), step sequencing, timeout enforcement
- **Worker process**: integration adapter execution, secret resolution
- Inter-process: in-process function call first; split to gRPC in Phase 6
- Control plane → data plane communication: HTTP POST for now (gRPC reverse tunnel in Phase 6)
- Redis sidecar: cache step outputs keyed by `(api_id, step_id, input_hash)`; TTL 60s
- Connection pool: `pg-pool` with per-integration max 5, global max across all integrations 1000
- Helm chart skeleton: `deployment.yaml`, `service.yaml`, `configmap.yaml` for the data plane

**Done when:** data plane runs as a separate Docker container; control plane calls it over HTTP; integration tests pass.

---

### Phase 6 — gRPC Reverse Tunnel
**Goal:** data plane initiates the connection; no inbound ports required.

- Add `grpc` to the data plane; data plane dials `control-plane:443` on startup
- Bidi stream: control plane sends dispatch requests; data plane streams results back
- Orchestrator receives dispatch request over the stream, runs the step, streams result chunks back
- Reconnect with exponential backoff + jitter on disconnect
- Control plane: add a tunnel registry (`Map<orgId, grpcStream>`) to route requests to the right data plane
- Replace the Phase 5 HTTP call with gRPC dispatch
- Auth: data plane authenticates to control plane with a long-lived agent token (stored as env var, issued in Admin Console)

**Done when:** data plane container has no open inbound ports; all execution traffic flows through the reverse tunnel.

---

### Phase 7 — Git Integration
**Goal:** apps are stored in and deployed from Git.

- GitHub OAuth app: request `repo` scope on first connect
- On app create: initialize a Git repo, commit `.gigablocks/gigablocks.json` + initial React source
- Editor saves: commit to `gigablocks/live` branch
- Deploy: open a PR `gigablocks/live → main`, merge it
- GitHub Action provisioned in the repo: on merge to `main`, POST to Gigablocks control plane with the new commit SHA → control plane marks the app deployed
- App runtime serves the last deployed commit (fetched from Git or cached in Postgres)

**Done when:** builder deploys an app; GitHub shows the merged PR; end user gets the new version.

---

### Phase 8 — Clark (AI Build)
**Goal:** AI agent that writes React + TS Backend APIs from a prompt.

- Clark is a backend service: accepts `{ appId, prompt, editEnvTag }`, returns a stream of file diffs
- Use Anthropic Claude API with tool use: tools are `read_file`, `write_file`, `run_backend_api` (runs against Edit-tagged integration)
- File diffs applied to `gigablocks/live` branch
- Frontend: Clark chat panel in the editor sidebar; streaming diff preview
- Enforce Edit-only data access in Clark's `run_backend_api` tool
- Rate limit: 1 concurrent Clark session per builder

**Done when:** builder types "add a table that shows all users from the database" and Clark writes the query step and React component.

---

### Phase 9 — Workflows + Scheduled Jobs
**Goal:** execution surfaces beyond synchronous app APIs.

- **Workflows**: same execution engine, triggered by HTTP/webhook, 10 min timeout, return a response or fire-and-forget
- **Scheduled Jobs**: cron expression stored in Postgres, control-plane scheduler dispatches via the gRPC tunnel, 30 min timeout
- Admin Console: workflow trigger URL, scheduled job cron editor + run history
- Observability: execution logs per run stored in Postgres (truncated after 30 days)

**Done when:** a scheduled job runs nightly, queries a DB, and the run history shows success/failure.

---

### Phase 10 — Enterprise Hardening
**Goal:** production-ready for enterprise procurement.

- SAML/OIDC SSO (Okta, Entra, Google) with SCIM provisioning
- Audit log export (CSV, SIEM webhook)
- MCP Server (`/mcp` endpoint, Bearer token, expose app/integration/audit tools)
- Embedded app SDK (`@gigablocks/embed`, `@gigablocks/embed-react`)
- Secret store integrations: AWS Secrets Manager, HashiCorp Vault, GCP Secret Manager
- Prometheus metrics + Grafana dashboard
- Full Helm chart with HPA, PodDisruptionBudget, resource limits
- SOC 2 evidence collection automation

**Done when:** a Fortune 500 procurement checklist passes.

---

## File Structure (Target)

```
gigablocks/
├── apps/
│   ├── web/                  # Next.js — editor SPA + control API
│   │   ├── app/              # App Router pages
│   │   │   ├── editor/       # App editor
│   │   │   ├── runtime/      # App runtime (end user)
│   │   │   └── admin/        # Admin console
│   │   └── api/              # Next.js API routes (control plane)
│   ├── data-plane/           # Standalone Node.js service
│   │   ├── orchestrator/     # Step orchestration, gRPC tunnel
│   │   ├── worker/           # Adapter execution
│   │   └── adapters/         # One file per integration type
│   └── clark/                # AI agent service
├── packages/
│   ├── sdk/                  # @gigablocks/sdk — Backend API TypeScript SDK
│   ├── embed/                # @gigablocks/embed — vanilla JS embed
│   └── embed-react/          # @gigablocks/embed-react
├── infra/
│   ├── helm/                 # Helm chart for data plane
│   └── docker/               # Docker Compose for local dev
└── ARCHITECTURE.md
```

---

## Non-Negotiable Constraints

1. **Production data never traverses the control plane in Hybrid mode.** Every execution path must be audited against this invariant before shipping.
2. **Credentials are never logged or returned in API responses.** Template expansion happens in the Worker; expanded values are never serialized.
3. **The data plane has no inbound ports** (Phase 6+). All communication is initiated by the data plane over the gRPC reverse tunnel.
4. **Apps are React code.** No proprietary JSON DSL. Builders own the code; Clark edits real source.
5. **Clark reads Edit-tagged data only.** The `run_backend_api` tool in Clark must hard-refuse `production`-tagged integrations.

---

## Open Questions (for the Planner)

- **Monorepo toolchain**: Turborepo or Nx? (Recommendation: Turborepo — simpler for a TS-only monorepo)
- **Data plane inter-process**: in-process function call (Phase 5) vs. separate processes from day one?
- **Code editor**: Monaco (same as VSCode) vs. CodeMirror 6? (Recommendation: Monaco — richer TS intellisense, familiar to builders)
- **Python step runtime**: Pyodide (WASM, in-process) vs. a sidecar Python process? (Recommendation: Pyodide for Phase 2; reassess at Phase 5)
- **LLM for Clark**: Anthropic Claude Sonnet for generation, Haiku for quick tool calls
