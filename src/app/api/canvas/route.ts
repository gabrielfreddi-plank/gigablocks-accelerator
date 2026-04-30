import { NextRequest, NextResponse } from "next/server";

import { runCanvasStream } from "@/lib/ai/application/runCanvasStream";
import { canvasRequestSchema, specSchema } from "@/lib/ai/contracts/canvasSchema";
import { AnthropicChatModel } from "@/lib/ai/infrastructure/anthropicChatModel";

import { componentCatalog } from "@/components/canvas/component-catalog";

const CANVAS_SYSTEM_PROMPT = `
You are a UI builder. Generate UI specifications using ONLY the components listed in the catalog below.

${componentCatalog.prompt()}

OUTPUT RULES — follow exactly, no exceptions:
- Output ONLY newline-delimited JSON patch operations (NDJSON). One patch object per line.
- No prose, no markdown, no code fences, no explanations. Raw NDJSON only.
- Each line must be a valid JSON object in one of these shapes:
  {"op":"replace","path":"/root","value":"<element_key>"}
  {"op":"add","path":"/elements/<key>","value":{"type":"<ComponentName>","props":{...},"children":["<child_key>"]}}

REQUIRED STRUCTURE:
1. First line: set the root element key using op "replace" on path "/root".
2. Subsequent lines: add each element using op "add" on path "/elements/<key>".
   - Output parents before their children.
   - Omit "children" from props if the element has no children.
   - Use only component names listed in the catalog above.
   - Every key in "children" must be added as its own element in a later line.
   - IMPORTANT LAYOUT RULE (GLOBAL): Do NOT place form controls or dense content directly under any container parent.
   - For ANY parent component that groups other elements (e.g. Card, Section, Grid, Tabs content, Collapsible content), add a Stack or Section wrapper first.
   - Then place inputs/buttons/text/charts/tables inside that wrapper instead of directly under the parent.
   - Prefer Stack (direction="vertical", gap="md") as the default wrapper for grouped form fields/content.
   - To bind events to actions, add an "on" field (sibling of type/props/children):
     {"op":"add","path":"/elements/submit-btn","value":{"type":"Button","props":{"label":"Sign In","variant":"primary"},"on":{"press":{"action":"submit","params":{}}}}}
   - For navigation buttons: use action "navigate" with params {"target":"<pageName>"}.
   - IMPORTANT: "on" is a top-level field on the element — never inside "props".
`.trim();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = canvasRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 },
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY is not configured.");
      return NextResponse.json(
        { error: "AI Model is currently unavailable" },
        { status: 500 },
      );
    }

    const contextRecord =
      parsed.data.context && typeof parsed.data.context === "object"
        ? (parsed.data.context as Record<string, unknown>)
        : null;

    const currentSpecFromContext =
      contextRecord?.currentSpec ?? contextRecord?.previousSpec;

    const currentSpecParse = specSchema.safeParse(currentSpecFromContext);
    const currentSpec = parsed.data.currentSpec ?? (currentSpecParse.success ? currentSpecParse.data : null);

    const stream = runCanvasStream({
      prompt: parsed.data.prompt,
      currentSpec,
      system: CANVAS_SYSTEM_PROMPT,
      chatModel: new AnthropicChatModel(apiKey),
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error generating canvas spec: ", error);
    return NextResponse.json(
      { error: "Unexpected server error while generating canvas spec" },
      { status: 500 },
    );
  }
}
