/**
 * Pure-function text chunker for the RAG pipeline.
 *
 * Algorithm (per .planning/phases/01-rag-slice/01-RESEARCH.md §"Chunking
 * recommendation"):
 *
 *   1. Trim input; empty → return [].
 *   2. Split on `\n{2,}` (paragraph boundaries).
 *   3. Greedily accumulate paragraphs into a buffer until adding the next
 *      paragraph would exceed `targetChars` — emit, then continue.
 *   4. If a single paragraph alone exceeds `targetChars`, split it on the
 *      sentence boundary `\.\s+(?=[A-Z])` and apply the same greedy rule.
 *      A "sentence" longer than `targetChars` is hard-sliced.
 *   5. For each chunk N>0, prepend the last `overlapChars` chars of chunk
 *      N-1 (overlap) so semantic context survives boundary crossings.
 *
 * Defaults: targetChars=2800 (~700 tokens), overlapChars=400 (~100 tokens).
 *
 * Pure / IO-free. Unit-tested in chunkText.test.ts.
 */
export interface ChunkTextOptions {
  targetChars?: number;
  overlapChars?: number;
}

const DEFAULT_TARGET_CHARS = 2800;
const DEFAULT_OVERLAP_CHARS = 400;

/**
 * Split `content` into chunks suitable for embedding.
 */
export function chunkText(
  content: string,
  opts: ChunkTextOptions = {},
): string[] {
  const targetChars = opts.targetChars ?? DEFAULT_TARGET_CHARS;
  const overlapChars = opts.overlapChars ?? DEFAULT_OVERLAP_CHARS;

  const normalized = content.trim();
  if (normalized.length === 0) return [];

  // Tokenize first into paragraph-or-sentence units that each fit under
  // `targetChars`. Then we'll greedily pack those units into final chunks.
  const units = splitIntoUnits(normalized, targetChars);

  // Greedy packing.
  const packed: string[] = [];
  let buffer = "";
  for (const unit of units) {
    if (buffer.length === 0) {
      buffer = unit;
      continue;
    }
    // +2 accounts for the "\n\n" join we add between units.
    if (buffer.length + 2 + unit.length <= targetChars) {
      buffer = `${buffer}\n\n${unit}`;
    } else {
      packed.push(buffer);
      buffer = unit;
    }
  }
  if (buffer.length > 0) packed.push(buffer);

  // Prepend overlap on every chunk after the first.
  if (overlapChars <= 0 || packed.length <= 1) return packed;

  const withOverlap: string[] = [packed[0]!];
  for (let i = 1; i < packed.length; i++) {
    const prior = packed[i - 1]!;
    const tail = prior.slice(Math.max(0, prior.length - overlapChars));
    withOverlap.push(`${tail}${packed[i]!}`);
  }
  return withOverlap;
}

/**
 * Split `normalized` into a list of paragraph/sentence units, each unit
 * guaranteed to be <= `targetChars` (a too-long sentence is hard-sliced).
 */
function splitIntoUnits(normalized: string, targetChars: number): string[] {
  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const units: string[] = [];
  for (const paragraph of paragraphs) {
    if (paragraph.length <= targetChars) {
      units.push(paragraph);
      continue;
    }
    // Long paragraph — split on sentence boundary `.<whitespace><Capital>`.
    const sentences = splitOnSentenceBoundary(paragraph);
    let buffer = "";
    for (const sentence of sentences) {
      const piece = sentence.length > targetChars
        ? hardSlice(sentence, targetChars)
        : [sentence];
      for (const part of piece) {
        if (buffer.length === 0) {
          buffer = part;
          continue;
        }
        if (buffer.length + 1 + part.length <= targetChars) {
          buffer = `${buffer} ${part}`;
        } else {
          units.push(buffer);
          buffer = part;
        }
      }
    }
    if (buffer.length > 0) units.push(buffer);
  }
  return units;
}

/**
 * Split a paragraph on `.<whitespace><Capital>` sentence boundaries.
 * Preserves the trailing period on each emitted sentence.
 */
function splitOnSentenceBoundary(paragraph: string): string[] {
  // Use a regex with a capturing lookahead so the boundary doesn't consume the
  // capital letter that begins the next sentence.
  const parts = paragraph.split(/(?<=\.)\s+(?=[A-Z])/);
  return parts.map((s) => s.trim()).filter((s) => s.length > 0);
}

/**
 * Last-resort: hard-slice a single sentence/paragraph that is too long for
 * `targetChars` — produces back-to-back substrings of length <= targetChars.
 */
function hardSlice(text: string, targetChars: number): string[] {
  const pieces: string[] = [];
  for (let i = 0; i < text.length; i += targetChars) {
    pieces.push(text.slice(i, i + targetChars));
  }
  return pieces;
}
