import { createUIMessageStreamResponse } from "ai";
import { NextRequest, NextResponse } from "next/server";

import { runChatStream } from "@/lib/ai/application/runChatStream";
import { chatRequestSchema } from "@/lib/ai/contracts/chatSchema";
import { AnthropicChatModel } from "@/lib/ai/infrastructure/anthropicChatModel";
import { ToolRegistry } from "@/lib/ai/infrastructure/toolRegistry";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedBody = chatRequestSchema.safeParse(body);

    if (!parsedBody.success) {
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

    const stream = runChatStream({
      messages: parsedBody.data.messages,
      chatModel: new AnthropicChatModel(apiKey),
      toolRegistry: new ToolRegistry(),
      system: "You're a helpful assistant, that answers directly and shortly.",
    });

    return createUIMessageStreamResponse({ stream });
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error while creating chat stream" },
      { status: 500 },
    );
  }
}
