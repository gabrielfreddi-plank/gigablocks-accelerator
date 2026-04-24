"use server";

import { FilePart, generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
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

  if (!content?.trim()) {
    return { policies: null, error: "Document content is required" };
  }

  try {
    const response = await generateText({
      model: anthropic("claude-haiku-4-5"),
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
