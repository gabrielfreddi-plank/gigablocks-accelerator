import { createUIMessageStreamResponse } from "ai";
import { NextRequest, NextResponse } from "next/server";

import { buildSystemPrompt } from "@/lib/ai/application/buildSystemPrompt";
import { runChatStream } from "@/lib/ai/application/runChatStream";
import { chatRequestSchema } from "@/lib/ai/contracts/chatSchema";
import { AnthropicChatModel } from "@/lib/ai/infrastructure/anthropicChatModel";
import { ToolRegistry } from "@/lib/ai/infrastructure/toolRegistry";
import { fetchMemoriesByUser } from "@/lib/memory/memoryRepository";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const memories = await fetchMemoriesByUser(user.id).catch((error) => {
      console.error("Failed to fetch memories:", error);
      return [];
    });

    const stream = runChatStream({
      messages: parsedBody.data.messages,
      chatModel: new AnthropicChatModel(apiKey),
      toolRegistry: new ToolRegistry(user.id),
      system: buildSystemPrompt(memories),
    });

    return createUIMessageStreamResponse({ stream });
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error while creating chat stream" },
      { status: 500 },
    );
  }
}
