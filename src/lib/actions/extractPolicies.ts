"use server";

import { FilePart, generateText, Output } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import z from "zod";

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
  const model = createAnthropic({ apiKey: resolvedKey })("claude-haiku-4-5");

  try {
    const response = await generateText({
      model,
      system:
        "You are an IT policy extraction assistant. Extract all IT-related policies from the provided document. " +
        "IT-related policies include: information security rules, access control and authorization, password and credential policies, " +
        "data classification and handling, network security, device management, software licensing, incident response, " +
        "acceptable use policies, backup and recovery, and compliance requirements. " +
        "If no IT-related policies are found, return an empty array.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "file",
              data: Buffer.from(content, "utf-8"),
              mediaType: "text/plain",
              providerOptions: {
                anthropic: {
                  title: title || "Document",
                },
              },
            } as FilePart,
            {
              type: "text",
              text: "Extract all IT-related policies from the document above.",
            },
          ],
        },
      ],
      output: Output.object({
        schema: z.array(policySchema),
      }),
    });

    return { policies: response.output, error: null };
  } catch (err) {
    return {
      policies: null,
      error:
        err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}
