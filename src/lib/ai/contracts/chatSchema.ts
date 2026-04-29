import { z } from "zod";

const uiMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().optional(),
  parts: z.array(z.unknown()).optional(),
});

export const chatRequestSchema = z.object({
  messages: z.array(uiMessageSchema).min(1),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatMessage = z.infer<typeof uiMessageSchema>;
