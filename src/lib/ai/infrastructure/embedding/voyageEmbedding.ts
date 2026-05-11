import { z } from "zod";

/**
 * Voyage AI embedding adapter — generates 512-dim embeddings via the
 * `voyage-3-lite` model.
 *
 * Required environment variable: `VOYAGE_API_KEY`. Throw at call time
 * (NOT at module load time) so missing keys surface a clear UI error
 * instead of a silent server boot failure.
 *
 * Pattern reference: `src/lib/ai/infrastructure/tools/webSearch.ts`
 * (env-var read + external API call + typed result).
 *
 * Reference shape (copy-and-adapt source):
 *   /Users/lucaspevidor/repos/node/accel/rag-fs/main/src/db/embeddings.ts
 *
 * Locked model details (per .planning/phases/01-rag-slice/01-RESEARCH.md):
 *   - Endpoint: POST https://api.voyageai.com/v1/embeddings
 *   - Model: voyage-3-lite (defaults to 512 dims; we pin via output_dimension
 *     as a defensive lock against a future provider-default drift)
 *   - Auth: Authorization: Bearer <VOYAGE_API_KEY>
 *
 * Domain-error policy: external adapters throw plain `Error` with a
 * machine-readable prefix; the typed-error classes live on repositories.
 */

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-3-lite";
const VOYAGE_OUTPUT_DIMENSION = 512;

const embedResponseSchema = z.object({
  data: z
    .array(
      z.object({
        embedding: z.array(z.number()).length(VOYAGE_OUTPUT_DIMENSION),
      }),
    )
    .min(1),
});

function readApiKey(): string {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error("VOYAGE_API_KEY is not configured");
  }
  return apiKey;
}

/**
 * Generate a single 512-dim embedding for one input string.
 *
 * Delegates to `embedBatch([text])` to keep the single-call surface
 * symmetric with the batch path and ensure both paths share validation
 * + error handling.
 */
export async function embed(text: string): Promise<number[]> {
  const [result] = await embedBatch([text]);
  if (!result) {
    throw new Error("Voyage embedding failed: empty response");
  }
  return result;
}

/**
 * Generate 512-dim embeddings for N input strings in a single Voyage call.
 * Returned array preserves input order.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const apiKey = readApiKey();

  const response = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: texts,
      model: VOYAGE_MODEL,
      output_dimension: VOYAGE_OUTPUT_DIMENSION,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Voyage embedding failed: ${response.status} ${response.statusText}`,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error("Voyage embedding failed: response body is not valid JSON");
  }

  const parsed = embedResponseSchema.parse(body);
  return parsed.data.map((d) => d.embedding);
}
