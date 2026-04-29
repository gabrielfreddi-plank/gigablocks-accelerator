"use server";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages.js";
import { z } from "zod";

const policySchema = z.object({
  title: z.string().describe("The title of the policy"),
  summary: z.string().describe("A one sentence summary of the policy"),
  requirements: z
    .array(z.string())
    .describe("Each of the requirements of the policy, as a list"),
});

export type Policy = z.infer<typeof policySchema>;

export interface ExtractPoliciesState {
  policies: Policy[] | null;
  error: string | null;
}

export async function extractPolicies(
  _: unknown,
  formData: FormData,
): Promise<ExtractPoliciesState> {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const apiKey = formData.get("apiKey") as string | null;

  if (!content?.trim()) {
    return { policies: null, error: "Document content is required" };
  }

  const resolvedKey = apiKey?.trim() || process.env.ANTHROPIC_API_KEY;
  if (!resolvedKey) {
    return {
      policies: null,
      error:
        "Anthropic API key is required. Provide it in the input or set the ANTHROPIC_API_KEY environment variable.",
    };
  }

  const client = new Anthropic({ apiKey: resolvedKey });
  const model = "claude-haiku-4-5";

  const systemPrompt =
    "You are an IT policy extraction assistant. Extract all IT-related policies from the provided document. " +
    "IT-related policies include: information security rules, access control and authorization, password and credential policies, " +
    "data classification and handling, network security, device management, software licensing, incident response, " +
    "acceptable use policies, backup and recovery, and compliance requirements. " +
    "If no IT-related policies are found, return an empty array.";

  try {
    const message = await client.messages.create({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "text",
                media_type: "text/plain",
                data: content,
              },
              title: title || "Document",
              citations: { enabled: false },
            },
            {
              type: "text",
              text: "Extract all IT-related policies from the document above.",
            },
          ],
        },
      ] satisfies MessageParam[],
      temperature: 0.2,
      output_config: {
        format: zodOutputFormat(z.array(policySchema)),
      },
    });

    if (message.stop_reason === "max_tokens") {
      throw new Error(
        "Document too large: response was cut off before all policies could be extracted. Try a shorter document.",
      );
    }

    const firstBlock = message.content[0];
    if (!firstBlock || firstBlock.type !== "text") {
      throw new Error(
        "Error extracting policies: Unexpected response format from LLM",
      );
    }

    const policies = z
      .array(policySchema)
      .parse(JSON.parse(firstBlock.text ?? "[]"));

    return { policies, error: null };
  } catch (error) {
    return {
      policies: null,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
