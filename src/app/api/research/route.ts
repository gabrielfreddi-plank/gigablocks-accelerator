import { createUIMessageStreamResponse } from "ai";
import { NextRequest, NextResponse } from "next/server";

import { runResearchStream } from "@/lib/ai/application/runResearchStream";
import { researchRequestSchema } from "@/lib/ai/contracts/researchSchema";
import { ClaudeAgentSdkRunner } from "@/lib/ai/infrastructure/claudeAgentSdkRunner";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/research — Research Analyst streaming endpoint.
 *
 * Plan 1 (Walking Skeleton) gates:
 *   1. Auth (Supabase) → 401 if no session.
 *   2. Zod safeParse on body → 400 on invalid payload.
 *   3. company_members membership check on body.companyId → 403 if not a member.
 *   4. ANTHROPIC_API_KEY presence → 500 (parity with /api/chat — Plan 3
 *      replaces the stub with an SDK-backed runner that requires it).
 *
 * Returns a Vercel-AI-SDK `createUIMessageStreamResponse` wrapping
 * `runResearchStream`. The runner currently emits a hardcoded markdown
 * report; Plan 3 swaps it for the orchestrator.
 *
 * Boundary discipline: this file MUST NOT import
 * `@anthropic-ai/claude-agent-sdk` — the runner instantiation moves here
 * in Plan 3 via the OrchestratorRunnerPort adapter.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsedBody = researchRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 },
      );
    }

    // Company membership guard (T-01-02). RLS would also filter downstream
    // reads, but returning 403 here yields a friendlier error than a silent
    // empty-result run.
    const { data: membership } = await supabase
      .from("company_members")
      .select("user_id")
      .eq("company_id", parsedBody.data.companyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const useClaudeLogin = process.env.RESEARCH_USE_CLAUDE_LOGIN === "true";
    const apiKey =
      process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN;
    if (!useClaudeLogin && !apiKey) {
      console.error(
        "ANTHROPIC_API_KEY is not configured (and RESEARCH_USE_CLAUDE_LOGIN is not set).",
      );
      return NextResponse.json(
        { error: "AI Model is currently unavailable" },
        { status: 500 },
      );
    }

    const runner = new ClaudeAgentSdkRunner({
      apiKey: useClaudeLogin ? undefined : apiKey,
    });
    const stream = runResearchStream({
      query: parsedBody.data.query,
      companyId: parsedBody.data.companyId,
      userId: user.id,
      runner,
    });

    return createUIMessageStreamResponse({ stream });
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error while creating research stream" },
      { status: 500 },
    );
  }
}
