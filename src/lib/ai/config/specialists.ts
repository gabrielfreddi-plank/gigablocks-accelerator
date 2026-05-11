/**
 * Typed specialist registry — the single source of truth for which agents
 * exist, what tools each can call, and how the orchestrator delegates.
 *
 * **Boundary note:** this file imports `AgentDefinition` as a **type-only**
 * import from `@anthropic-ai/claude-agent-sdk`. No other layer outside
 * `infrastructure/` should import from this file's SDK-typed exports —
 * `specialistsToAgentsRecord()` returns a shape only the adapter consumes.
 * The application layer (`runResearchStream.ts`) MUST depend only on
 * `OrchestratorRunnerPort`, never on this mapper.
 *
 * Config-driven proof (ORCH-02): adding a new entry to `specialists` here
 * surfaces it via `specialistsToAgentsRecord()` with zero changes in
 * `claudeAgentSdkRunner.ts` or `runResearchStream.ts`.
 */

import type { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";

export interface Specialist {
  /** Stable agent identifier — used as the subagent_type the orchestrator delegates to. */
  slug: string;
  /** One-line description shown to the orchestrator when it considers delegation. */
  description: string;
  /** Full system prompt for the agent. */
  systemPrompt: string;
  /** Full Anthropic model ID, e.g. "claude-sonnet-4-6". No aliases. */
  model: string;
  /** Hard cap on agentic turns inside the agent. */
  maxTurns: number;
  /** Fully-qualified tool names this agent may call. Orchestrators use ["Agent"]. */
  tools: ReadonlyArray<string>;
  /** Marks the orchestrator entry — exactly one specialist should set this. */
  isOrchestrator?: boolean;
}

/* -----------------------------------------------------------------------------
 * System prompts
 * ---------------------------------------------------------------------------*/

const ORCHESTRATOR_SYSTEM_PROMPT = `You are the Research Analyst orchestrator.

Your job is to answer the user's research question by delegating to the
\`rag\` specialist (which searches an internal corpus of company documents)
and then composing a concise, faithful markdown report.

Rules:
1. ALWAYS delegate to the \`rag\` specialist first, via the \`Agent\` tool,
   before composing any answer. Do not attempt to answer from memory — the
   user's company corpus is the only source of truth for company-specific
   facts.
2. Pass the user's question (rephrased into a search-friendly form if
   helpful) to the rag specialist. Wait for its findings.
3. Compose your final report as markdown. Use inline numeric citations
   like \`[1]\`, \`[2]\` next to each factual claim, where \`[n]\` references
   an entry in a final \`## Sources\` section. Every \`## Sources\` entry
   must list the form \`[n] -> <path>\`, using the path the rag specialist
   returned (e.g. \`/policies/hr/remote-work.md\`).
4. NEVER invent a citation. Only cite paths the rag specialist actually
   returned. If the specialist returned nothing, do not fabricate sources.
5. If the rag specialist reports that the corpus does not contain the
   answer, say so explicitly: write something like "The corpus does not
   contain information about X." Do NOT pad with general knowledge —
   the user is asking about their company's own documents.
6. Keep reports concise: a few short paragraphs plus the Sources section
   is plenty for most questions.
`;

const RAG_SPECIALIST_SYSTEM_PROMPT = `You are the RAG specialist. You answer the orchestrator's research
sub-questions by navigating an internal corpus of company documents
through a small filesystem-shaped tool surface:

- \`mcp__rag__ls\` — list immediate children of a path prefix (start at "/").
- \`mcp__rag__find\` — glob-match paths across the corpus.
- \`mcp__rag__search\` — semantic + literal search across chunk content.
- \`mcp__rag__cat\` — read the full content of a document by path.

Recommended approach:
1. Start with \`mcp__rag__ls\` at "/" to learn the corpus layout.
2. Run \`mcp__rag__search\` with a focused query. Look at the snippet and
   path of each hit.
3. \`mcp__rag__cat\` the highest-scoring 1-2 paths to confirm the actual
   content supports the claim.
4. Summarise your findings for the orchestrator. ALWAYS include each
   supporting document's \`path\` and the relevant \`chunkId\` so the
   orchestrator can cite them. Quote short snippets verbatim where
   useful.

Discipline:
- If a search returns no hits and \`ls\` confirms nothing relevant, say
  so explicitly: "The corpus does not appear to contain information
  about X." Do not invent content.
- Keep your reply short and structured. The orchestrator composes the
  final report — your job is faithful retrieval, not prose.
`;

/* -----------------------------------------------------------------------------
 * The registry
 * ---------------------------------------------------------------------------*/

export const specialists: ReadonlyArray<Specialist> = [
  {
    slug: "orchestrator",
    description:
      "Top-level research-analyst orchestrator. Delegates to the rag specialist and composes a cited markdown report.",
    systemPrompt: ORCHESTRATOR_SYSTEM_PROMPT,
    model: "claude-sonnet-4-6",
    maxTurns: 6,
    tools: ["Agent"],
    isOrchestrator: true,
  },
  {
    slug: "rag",
    description:
      "Internal-corpus RAG specialist. Navigates company documents via ls/find/search/cat to surface evidence with paths and chunkIds.",
    systemPrompt: RAG_SPECIALIST_SYSTEM_PROMPT,
    model: "claude-haiku-4-5",
    maxTurns: 8,
    tools: [
      "mcp__rag__ls",
      "mcp__rag__cat",
      "mcp__rag__search",
      "mcp__rag__find",
    ],
  },
] as const;

/* -----------------------------------------------------------------------------
 * Mappers
 * ---------------------------------------------------------------------------*/

/**
 * Map the typed `Specialist[]` into the SDK's `Record<string, AgentDefinition>`
 * shape consumed by `query({ options: { agents } })`.
 *
 * The `override` parameter exists so Plan 4 tests can inject a stub registry
 * (e.g. adding a `fake_analyst` entry) and assert it surfaces here without
 * touching the adapter — the mechanical ORCH-02 proof.
 */
export function specialistsToAgentsRecord(
  override?: ReadonlyArray<Specialist>,
): Record<string, AgentDefinition> {
  const arr = override ?? specialists;
  return Object.fromEntries(
    arr.map((s) => [
      s.slug,
      {
        description: s.description,
        prompt: s.systemPrompt,
        model: s.model,
        tools: [...s.tools],
        maxTurns: s.maxTurns,
      } satisfies AgentDefinition,
    ]),
  );
}

/**
 * Return the slug of the entry marked `isOrchestrator: true`. Throws if no
 * such entry exists, because the SDK's `options.agent` must point at one of
 * the keys in `agents`.
 */
export function pickOrchestratorSlug(
  override?: ReadonlyArray<Specialist>,
): string {
  const arr = override ?? specialists;
  const found = arr.find((s) => s.isOrchestrator === true);
  if (!found) {
    throw new Error(
      "specialists.ts: no entry marked `isOrchestrator: true` — exactly one specialist must be the orchestrator.",
    );
  }
  return found.slug;
}
