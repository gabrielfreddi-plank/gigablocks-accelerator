/**
 * Registry-behavior tests for the typed Specialist registry.
 *
 * This is the load-bearing ORCH-02 mechanical proof (Test G): adding a
 * synthetic specialist through the override surfaces it in the SDK-shaped
 * record without any other code change. The remaining tests lock in the
 * orchestrator / RAG allowlists per AI-SPEC pitfalls #1 / #3 / #4 and
 * D-17.
 */

import { describe, it, expect } from "vitest";

import {
  specialists,
  specialistsToAgentsRecord,
  pickOrchestratorSlug,
  type Specialist,
} from "./specialists";

describe("specialist registry", () => {
  it("A: contains at least one orchestrator entry", () => {
    const orchestrators = specialists.filter((s) => s.isOrchestrator === true);
    expect(orchestrators.length).toBeGreaterThanOrEqual(1);
  });

  it("B: contains at least one non-orchestrator specialist", () => {
    const nonOrch = specialists.filter((s) => !s.isOrchestrator);
    expect(nonOrch.length).toBeGreaterThanOrEqual(1);
  });

  it("C: orchestrator's tools array includes 'Agent' (pitfall #1 lock)", () => {
    const orch = specialists.find((s) => s.isOrchestrator === true);
    expect(orch).toBeDefined();
    expect(orch!.tools).toContain("Agent");
  });

  it("D: orchestrator's tools array contains NO mcp__rag__* entries (pitfall #4 — orchestrators delegate)", () => {
    const orch = specialists.find((s) => s.isOrchestrator === true);
    expect(orch).toBeDefined();
    for (const t of orch!.tools) {
      expect(t.startsWith("mcp__rag__")).toBe(false);
    }
  });

  it("E: rag specialist's tools is exactly the four fs tools (D-17 mechanical lock)", () => {
    const rag = specialists.find((s) => s.slug === "rag");
    expect(rag).toBeDefined();
    expect([...rag!.tools].sort()).toEqual(
      [
        "mcp__rag__cat",
        "mcp__rag__find",
        "mcp__rag__ls",
        "mcp__rag__search",
      ].sort(),
    );
  });

  it("F: rag specialist's tools does NOT include 'Agent' (pitfall #4 — subagents cannot spawn)", () => {
    const rag = specialists.find((s) => s.slug === "rag");
    expect(rag).toBeDefined();
    expect(rag!.tools).not.toContain("Agent");
  });

  it("G (ORCH-02 mechanical proof): override flows through specialistsToAgentsRecord", () => {
    const fake: Specialist = {
      slug: "fake",
      description: "test",
      systemPrompt: "p",
      model: "claude-haiku-4-5",
      maxTurns: 1,
      tools: [],
    };
    const result = specialistsToAgentsRecord([...specialists, fake]);

    expect(result.fake).toBeDefined();
    expect(result.fake!.description).toBe("test");
    expect(result.fake!.model).toBe("claude-haiku-4-5");

    const keys = Object.keys(result);
    for (const original of specialists) {
      expect(keys).toContain(original.slug);
    }
    expect(keys).toContain("fake");
  });

  it("H: pickOrchestratorSlug returns the orchestrator slug; throws on override with no orchestrator", () => {
    const slug = pickOrchestratorSlug();
    const orch = specialists.find((s) => s.isOrchestrator === true);
    expect(slug).toBe(orch!.slug);

    const noOrch: Specialist[] = [
      {
        slug: "only-specialist",
        description: "no orch here",
        systemPrompt: "p",
        model: "claude-haiku-4-5",
        maxTurns: 1,
        tools: [],
      },
    ];
    expect(() => pickOrchestratorSlug(noOrch)).toThrow();
  });
});
