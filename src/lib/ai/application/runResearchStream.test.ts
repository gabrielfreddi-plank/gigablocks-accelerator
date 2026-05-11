/**
 * Translation tests: FakeRunner emits a deterministic RunEvent sequence;
 * we assert that `runResearchStream` writes the correct UI message chunks.
 */

import { describe, it, expect } from "vitest";

import { runResearchStream } from "./runResearchStream";
import type {
  OrchestratorRunnerPort,
  RunEvent,
} from "@/lib/ai/ports/orchestratorRunner";

class FakeRunner implements OrchestratorRunnerPort {
  constructor(private readonly events: RunEvent[]) {}
  async *run(): AsyncIterable<RunEvent> {
    for (const e of this.events) yield e;
  }
}

async function drain(stream: ReadableStream<unknown>): Promise<unknown[]> {
  const out: unknown[] = [];
  const reader = stream.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      out.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return out;
}

function typesOf(chunks: unknown[]): string[] {
  return chunks.map((c) => (c as { type: string }).type);
}

describe("runResearchStream", () => {
  it("1: translates activity + 2 deltas + report-end into one text-start, two text-delta, one text-end, one data-activity", async () => {
    const events: RunEvent[] = [
      { kind: "activity", id: "a1", agent: "rag", label: "ls(/)", ts: 1 },
      { kind: "report-delta", delta: "Hello " },
      { kind: "report-delta", delta: "world." },
      { kind: "report-end" },
    ];
    const stream = runResearchStream({
      query: "q",
      companyId: "c",
      userId: "u",
      runner: new FakeRunner(events),
    });
    const chunks = await drain(stream);
    const types = typesOf(chunks);
    expect(types.filter((t) => t === "text-start")).toHaveLength(1);
    expect(types.filter((t) => t === "text-delta")).toHaveLength(2);
    expect(types.filter((t) => t === "text-end")).toHaveLength(1);
    expect(types.filter((t) => t === "data-activity")).toHaveLength(1);

    // text-delta order preserved
    const deltas = chunks.filter(
      (c) => (c as { type: string }).type === "text-delta",
    ) as Array<{ delta: string }>;
    expect(deltas.map((d) => d.delta)).toEqual(["Hello ", "world."]);
  });

  it("2: activity event forwards key payload fields", async () => {
    const events: RunEvent[] = [
      {
        kind: "activity",
        id: "id-1",
        agent: "rag",
        label: "search(...)",
        ts: 42,
        status: "ok",
        durationMs: 123,
      },
      { kind: "report-end" },
    ];
    const stream = runResearchStream({
      query: "q",
      companyId: "c",
      userId: "u",
      runner: new FakeRunner(events),
    });
    const chunks = await drain(stream);
    const act = chunks.find(
      (c) => (c as { type: string }).type === "data-activity",
    ) as { id: string; data: { agent: string; label: string; ts: number; status?: string; durationMs?: number } };
    expect(act.id).toBe("id-1");
    expect(act.data.agent).toBe("rag");
    expect(act.data.label).toBe("search(...)");
    expect(act.data.ts).toBe(42);
    expect(act.data.status).toBe("ok");
    expect(act.data.durationMs).toBe(123);
  });

  it("3: run-error emits a data-error chunk and terminates the text part", async () => {
    const events: RunEvent[] = [
      { kind: "report-delta", delta: "partial " },
      { kind: "run-error", message: "boom" },
      { kind: "report-delta", delta: "ignored?" }, // adapter forwards but stream is effectively done
    ];
    const stream = runResearchStream({
      query: "q",
      companyId: "c",
      userId: "u",
      runner: new FakeRunner(events),
    });
    const chunks = await drain(stream);
    const errs = chunks.filter(
      (c) => (c as { type: string }).type === "data-error",
    ) as Array<{ data: { message: string } }>;
    expect(errs).toHaveLength(1);
    expect(errs[0]!.data.message).toBe("boom");
    // At least one text-end emitted (defensive close from runResearchStream)
    expect(
      chunks.filter((c) => (c as { type: string }).type === "text-end").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("4: multiple report-deltas between activities emit a SINGLE text-start", async () => {
    const events: RunEvent[] = [
      { kind: "activity", id: "a1", agent: "rag", label: "x", ts: 1 },
      { kind: "report-delta", delta: "a" },
      { kind: "activity", id: "a2", agent: "rag", label: "y", ts: 2 },
      { kind: "report-delta", delta: "b" },
      { kind: "report-delta", delta: "c" },
      { kind: "report-end" },
    ];
    const stream = runResearchStream({
      query: "q",
      companyId: "c",
      userId: "u",
      runner: new FakeRunner(events),
    });
    const chunks = await drain(stream);
    const types = typesOf(chunks);
    expect(types.filter((t) => t === "text-start")).toHaveLength(1);
    expect(types.filter((t) => t === "text-end")).toHaveLength(1);
    expect(types.filter((t) => t === "text-delta")).toHaveLength(3);
  });

  it("5: activity-only run with no report-delta emits zero text-start/text-end (lazy open)", async () => {
    const events: RunEvent[] = [
      { kind: "activity", id: "a1", agent: "rag", label: "ls", ts: 1 },
      { kind: "report-end" },
    ];
    const stream = runResearchStream({
      query: "q",
      companyId: "c",
      userId: "u",
      runner: new FakeRunner(events),
    });
    const chunks = await drain(stream);
    const types = typesOf(chunks);
    expect(types).not.toContain("text-start");
    expect(types).not.toContain("text-end");
    expect(types.filter((t) => t === "data-activity")).toHaveLength(1);
  });
});
