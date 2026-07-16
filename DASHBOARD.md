# Dashboard — Agent Implementation Spec

> Read `CLAUDE.md` and `AGENTS.md` before starting. All code goes in `src/app/(dashboard)/`.

---

## Visual Language

Match the landing page exactly:
- Background: `#09090b` (`bg-zinc-950`)
- Sidebar surface: `bg-zinc-900` with `border-r border-zinc-800`
- Cards: `bg-zinc-900/60 border border-zinc-800 rounded-xl`
- Primary action: `bg-blue-600 hover:bg-blue-500 text-white rounded-[10px]`
- Secondary action: `bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-[10px]`
- Body text: `text-zinc-200`; muted: `text-zinc-400`; very muted: `text-zinc-500`
- Font: Geist (already loaded in root layout)
- All UI copy in English

---

## Layout Shell

Update `src/app/(dashboard)/layout.tsx` to include a persistent sidebar.

### Sidebar spec

```
Sidebar (w-60, fixed left, full height, bg-zinc-900, border-r border-zinc-800)
├── Top
│   ├── GigablocksLogo (reuse from src/components/marketing/GigablocksLogo.tsx)
│   └── WorkspaceSelector (dropdown — see §Workspace Selector)
├── Nav links (flex-col, gap-1)
│   ├── Home         → /dashboard
│   ├── Documents    → /dashboard/documents
│   ├── Clark AI     → /dashboard/chat
│   ├── Team         → /dashboard/team  [visible only if role = owner | admin]
│   └── Settings     → /dashboard/settings
└── Bottom
    ├── User avatar + name + email (small, truncated)
    └── Sign out button (calls signOut server action)
```

Active link: `bg-zinc-800 text-white`. Inactive: `text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50`.

The sidebar needs the current user's role in the active workspace to gate the `Team` link. Fetch it server-side in the layout by joining `empresa_membros` for the active workspace ID (see §Workspace Context).

### Main content area

```
Layout root: flex h-screen overflow-hidden
  Sidebar: flex-shrink-0 w-60
  Main: flex-1 overflow-y-auto bg-zinc-950
    Inner: max-w-5xl mx-auto px-8 py-8
```

---

## Workspace Context

A user belongs to multiple `empresas` via `empresa_membros`. The active workspace must persist across page navigations.

### Storage strategy

Store the active workspace ID in a **cookie** named `active_workspace_id`. The middleware (`src/proxy.ts`) should:
1. On first load after login: query `empresa_membros` for all workspaces the user belongs to, set cookie to the first one (ordered by `created_at` asc).
2. On workspace switch: update the cookie via a Server Action.

### Workspace Selector component

Location: `src/components/dashboard/WorkspaceSelector.tsx` (Client Component).

```
Trigger (full-width button in sidebar):
  ├── Empresa name (truncated)
  ├── Role badge (owner / admin / member, small, zinc-600)
  └── Chevron icon

Dropdown (absolute, below trigger, w-56, bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl):
  ├── [list of all user's workspaces — name + role]
  ├── Active: checkmark + blue name
  └── Footer: "+ Create workspace" → /onboarding (reuse existing createEmpresa action)
```

On workspace select: call `switchWorkspace(empresaId)` server action that updates the cookie, then `router.refresh()`.

### Data pattern for workspace-scoped queries

Every Supabase query inside the dashboard must filter by the active `empresa_id` read from the cookie. Create a helper:

```ts
// src/lib/workspace.ts
import { cookies } from "next/headers";

export async function getActiveWorkspaceId(): Promise<string | null> {
  const store = await cookies();
  return store.get("active_workspace_id")?.value ?? null;
}
```

All Server Components and Server Actions in the dashboard call `getActiveWorkspaceId()` before querying.

---

## Routes

### `/dashboard` — Home

**Data to fetch (server-side):**
- Empresa name + user role (from `empresa_membros JOIN empresas`)
- Document count (`SELECT count(*) FROM documentos WHERE empresa_id = $1`)
- Member count (`SELECT count(*) FROM empresa_membros WHERE empresa_id = $1`)
- 5 most recent documents (`ORDER BY created_at DESC LIMIT 5`)

**Page layout:**
```
Header row
  "Welcome back, {user.nome}" (h1, text-2xl font-semibold)
  Workspace badge: empresa.nome (text-xs bg-zinc-800 px-2 py-1 rounded-md)

Stats row (grid grid-cols-3 gap-4 mt-6)
  ├── Documents   → count from documentos
  ├── Members     → count from empresa_membros
  └── Storage used → (placeholder for now, "--")

Quick actions row (flex gap-3 mt-6)
  ├── "Upload document"  → /dashboard/documents (blue primary button)
  └── "Ask Clark"        → /dashboard/chat (secondary button)

Recent documents (mt-8)
  Heading: "Recent documents" (text-sm font-medium text-zinc-400 uppercase tracking-widest)
  List of 5 cards (see DocumentCard in §Documents)
  "View all →" link → /dashboard/documents
```

---

### `/dashboard/documents` — Documents

**Data:** all `documentos` for active workspace, ordered by `updated_at DESC`.

**Page layout:**
```
Header row
  "Documents" (h1)
  "Upload" button (blue, top-right, triggers upload modal)

Upload modal (shadcn Dialog):
  ├── File input (accept: .pdf,.txt,.md,.docx — for now store raw content)
  ├── Document name field (auto-filled from filename, editable)
  └── "Upload" → server action (see §Upload flow)

Document list (mt-6)
  ├── If empty: empty state — icon + "No documents yet" + Upload button
  └── Table or card grid:
      DocumentCard:
        ├── File icon (based on type) + document name (font-medium)
        ├── Date (relative, e.g. "2 days ago")
        ├── Size / word count (from conteudo_original.length)
        └── Actions: "Ask Clark about this" (→ /dashboard/chat?doc={id}) | "Delete" (destructive)
```

**Upload flow (Server Action `uploadDocument`):**
1. Accept `File` from form
2. Upload binary to Supabase Storage bucket `documents` at path `{empresa_id}/{uuid}-{filename}`
3. Read text content (for AI context): extract text from file
4. Insert row into `documentos`: `{ nome, empresa_id, conteudo_original: extractedText }`
5. `revalidatePath("/dashboard/documents")`

Supabase Storage bucket name: `documents`. Must be created in the Supabase dashboard with private access (not public). Use the service role key server-side for uploads.

**Delete flow:** Server Action `deleteDocument(id)`:
1. Delete Storage object
2. `DELETE FROM documentos WHERE id = $1 AND empresa_id = $2`
3. `revalidatePath("/dashboard/documents")`

---

### `/dashboard/chat` — Clark AI

The core product feature. A chat interface where the user selects documents as context and asks questions.

**URL param:** `?doc={id}` pre-selects a document (set when navigating from Documents page).

**Page layout (two-column):**
```
Left column (w-64, flex-shrink-0)
  "Context" heading (text-sm text-zinc-400 uppercase)
  Document checklist:
    List of all docs in workspace (checkbox per doc)
    Pre-check doc from URL param
  "Clear context" link (when ≥1 checked)

Right column (flex-1, flex flex-col)
  Chat history (flex-1 overflow-y-auto, flex-col gap-4)
    ├── User messages: right-aligned, bg-blue-600, rounded-xl px-4 py-2
    └── Clark messages: left-aligned, bg-zinc-800, rounded-xl px-4 py-2, supports markdown
  Input row (flex-shrink-0, mt-4)
    ├── Textarea (auto-grow, bg-zinc-900 border border-zinc-700, rounded-xl, placeholder "Ask Clark...")
    └── Send button (blue, icon only or "Send")
```

**AI integration (Anthropic SDK):**

Route Handler at `src/app/api/chat/route.ts` — streaming POST endpoint.

```ts
// Request body: { messages: {role, content}[], documentIds: string[], workspaceId: string }
// Response: text/event-stream (Vercel AI SDK format or raw SSE)
```

Steps inside the handler:
1. Validate session (call `supabase.auth.getUser()`)
2. Fetch selected documents' `conteudo_original` from DB, filtered by `empresa_id`
3. Build system prompt:
   ```
   You are Clark, an AI assistant for Gigablocks. You help users understand, query,
   and reason about their documents. Answer questions based only on the provided documents.
   If the answer is not in the documents, say so clearly.

   Documents:
   {documents.map(d => `--- ${d.nome} ---\n${d.conteudo_original}`).join("\n\n")}
   ```
4. Call Anthropic SDK with `claude-sonnet-4-6`, `stream: true`
5. Return streamed response as SSE

Use `@anthropic-ai/sdk`. Install it: `pnpm add @anthropic-ai/sdk`.

The chat page is a **Client Component** (`"use client"`). State: `messages[]`, `selectedDocIds[]`, `input`, `isStreaming`. Use `fetch` with `ReadableStream` to consume SSE and append chunks to the last message in state.

---

### `/dashboard/team` — Team Management

**Access gate:** server-side — if user's role in active workspace is not `owner` or `admin`, redirect to `/dashboard`.

**Data:** all `empresa_membros JOIN usuarios` for active workspace.

**Page layout:**
```
Header row
  "Team" (h1)
  "Invite member" button (blue) → opens invite modal

Members table (mt-6)
  Columns: Name · Email · Role · Joined · Actions
  Row actions:
    ├── Role selector (Select: owner/admin/member) — disabled for self, disabled if actor is not owner
    └── "Remove" button (destructive) — disabled for self

Invite modal (shadcn Dialog):
  ├── Email input
  ├── Role selector (admin / member — cannot invite as owner)
  └── "Send invite" → server action
```

**Invite flow:** Use `supabase.auth.admin.inviteUserByEmail()` (requires service role key). On accept, the `on_auth_user_created` trigger creates the `usuarios` row. Then a second step inserts into `empresa_membros`.

**Note:** Invites require the user to sign up if they don't have an account. The callback after invite should add them to `empresa_membros` for the right empresa. Pass `empresa_id` as redirect metadata or handle in the callback route (`src/app/auth/callback/route.ts`).

**Role update:** Server Action `updateMemberRole(empresaId, userId, newRole)` — only `owner` can promote to `owner`. Only `owner | admin` can change others.

**Remove member:** Server Action `removeMember(empresaId, userId)` — cannot remove self.

---

### `/dashboard/settings` — Settings

**Tabs (shadcn Tabs):**

**Profile tab:**
- Display name (`usuarios.nome`) — editable, server action `updateProfile`
- Email (read-only, from `supabase.auth.getUser()`)
- "Change password" → `supabase.auth.updateUser({ password })`

**Workspace tab (visible to owner only):**
- Workspace name (`empresas.nome`) — editable, server action `updateEmpresa`
- Danger zone: "Delete workspace" (destructive, confirmation dialog)
  - Deletes empresa + cascades to all documentos + empresa_membros via FK

---

## Component structure

```
src/components/dashboard/
  Sidebar.tsx               # Server Component — fetches role, renders nav
  WorkspaceSelector.tsx     # Client Component — dropdown for workspace switching
  DocumentCard.tsx          # Server or Client — doc preview card
  ChatMessage.tsx           # Client — renders user/clark message with markdown
  MemberRow.tsx             # Client — table row with role selector
```

---

## Server Actions

All in `src/lib/actions/` — each file groups by domain:

| File | Actions |
|---|---|
| `workspace.ts` | `switchWorkspace(id)`, `createWorkspace(name)` |
| `documents.ts` | `uploadDocument(formData)`, `deleteDocument(id)` |
| `team.ts` | `inviteMember(email, role)`, `updateMemberRole(userId, role)`, `removeMember(userId)` |
| `settings.ts` | `updateProfile(name)`, `updateEmpresa(name)`, `deleteEmpresa()` |

---

## Implementation order

Do these in sequence — each unblocks the next:

1. **Workspace context** — `getActiveWorkspaceId()` helper + cookie logic in `proxy.ts`
2. **Dashboard layout** — sidebar + workspace selector (with real data)
3. **Home page** — stats + recent docs (real Supabase queries)
4. **Documents page** — list + upload + delete (Supabase Storage)
5. **Clark chat** — API route + streaming UI
6. **Team page** — members table + invite + role management
7. **Settings page** — profile + workspace tabs

---

## Environment variables needed

```env
# Already present
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# Add these
SUPABASE_SERVICE_ROLE_KEY=   # for invite + storage operations server-side
ANTHROPIC_API_KEY=            # for Clark AI
```

Both must be validated at startup — throw if missing in any server action that requires them.

---

## DB schema reminder

| Table | Key columns | Notes |
|---|---|---|
| `usuarios` | `id`, `nome` | Auto-created on auth signup |
| `empresas` | `id`, `nome`, `usuario_id` | Created during onboarding |
| `empresa_membros` | `empresa_id`, `usuario_id`, `role` | roles: owner / admin / member |
| `documentos` | `id`, `empresa_id`, `nome`, `conteudo_original` | Text content for AI context |

RLS helper: `is_empresa_member(target_empresa_id)` — use in RLS policies, not in app code.

---

## Supabase Storage setup

Bucket: `documents`
- Access: **private** (no public URL)
- Path convention: `{empresa_id}/{uuid}-{original_filename}`
- Download via signed URLs (expire in 1 hour): `supabase.storage.from("documents").createSignedUrl(path, 3600)`
- Upload with service role client to bypass RLS on storage

---

## Clark AI — system prompt contract

Clark must:
- Answer only from provided document context
- Cite which document an answer comes from (`[From: {nome}]`)
- Refuse to answer if context is empty ("Please select at least one document to give me context.")
- Never invent information not present in the documents

Model: `claude-sonnet-4-6`. Max tokens: 2048. Temperature: default.
