import { z } from "zod";

const specElementSchema = z.object({
  type: z.string(),
  props: z.record(z.string(), z.unknown()).optional().default({}),
  children: z.array(z.string()).optional(),
});

export const specSchema = z.object({
  root: z.string(),
  elements: z.record(z.string(), specElementSchema),
  state: z.record(z.string(), z.unknown()).optional(),
});

export const canvasRequestSchema = z.object({
  prompt: z.string().min(1),
  context: z.unknown().optional(),
  currentSpec: specSchema.optional().nullable(),
});

export type CanvasRequest = z.infer<typeof canvasRequestSchema>;
export type CanvasSpec = z.infer<typeof specSchema>;
export type CanvasSpecElement = z.infer<typeof specElementSchema>;
