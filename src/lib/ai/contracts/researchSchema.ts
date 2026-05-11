import { z } from "zod";

// researchRequestSchema validates POST /api/research bodies.
// `query` is the user's research question; `companyId` scopes the corpus.
export const researchRequestSchema = z.object({
  query: z.string().min(3).max(2000),
  companyId: z.string().uuid(),
});

// Inferred TypeScript shape for downstream consumers (route handler, runner).
export type ResearchRequest = z.infer<typeof researchRequestSchema>;

