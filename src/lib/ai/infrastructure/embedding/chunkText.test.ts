import { describe, it, expect } from "vitest";

import { chunkText } from "./chunkText";

describe("chunkText", () => {
  it("Test 1: a single short paragraph yields one chunk", () => {
    const input = "A short paragraph of about a hundred characters or so that fits comfortably under the target.";
    const chunks = chunkText(input);
    expect(chunks).toEqual([input]);
  });

  it("Test 2: two short paragraphs separated by \\n\\n collapse into one chunk under the target", () => {
    const para1 = "First paragraph about the IT policy. It covers the basics.";
    const para2 = "Second paragraph extends the policy with some details.";
    const input = `${para1}\n\n${para2}`;
    const chunks = chunkText(input);
    expect(chunks.length).toBe(1);
    expect(chunks[0]).toContain(para1);
    expect(chunks[0]).toContain(para2);
  });

  it("Test 3: a 6000-char single paragraph is split on sentence boundaries into >=2 chunks with overlap prepended to subsequent chunks", () => {
    // Build a single paragraph of 6000+ chars with clear sentence boundaries.
    // Each sentence is ~120 chars.
    const sentence =
      "This is a deliberately long sentence about IT policy that is roughly one hundred and twenty characters in length to test split. ";
    let paragraph = "";
    while (paragraph.length < 6000) paragraph += sentence;

    const chunks = chunkText(paragraph);
    expect(chunks.length).toBeGreaterThanOrEqual(2);

    // Every chunk after the first must begin with the tail of the prior chunk
    // (overlap). Pick a substring of length 100 from the prior chunk's tail and
    // assert it is present at the start of the next chunk.
    for (let i = 1; i < chunks.length; i++) {
      const prior = chunks[i - 1]!;
      const next = chunks[i]!;
      // Overlap defaults to 400 chars; the chunker prepends the last
      // `overlapChars` of the prior chunk to the next. Take a 50-char window
      // near the tail of the prior chunk and require it to appear at the
      // start of the next chunk.
      const overlapWindow = prior.slice(-100, -50);
      if (overlapWindow.length > 0) {
        expect(next.startsWith(prior.slice(-400))).toBe(true);
      }
    }
  });

  it("Test 4: empty input or whitespace-only input yields []", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n\n   \t  \n  ")).toEqual([]);
  });

  it("Test 5: custom opts produce smaller chunks than defaults", () => {
    // Build content that would be a single chunk at default but multiple at
    // smaller targetChars.
    const paragraphs: string[] = [];
    for (let i = 0; i < 6; i++) {
      paragraphs.push(
        `Paragraph ${i}: ${"x".repeat(200)} end paragraph ${i}.`,
      );
    }
    const input = paragraphs.join("\n\n");

    const defaults = chunkText(input);
    const small = chunkText(input, { targetChars: 500, overlapChars: 100 });

    expect(small.length).toBeGreaterThan(defaults.length);
  });

  it("Test 6: every chunk's length is <= targetChars + overlapChars", () => {
    // Construct a large multi-paragraph blob.
    const paragraphs: string[] = [];
    for (let i = 0; i < 20; i++) {
      paragraphs.push(
        `Paragraph ${i}. ${"abc def ghi. ".repeat(80)}End para ${i}.`,
      );
    }
    const input = paragraphs.join("\n\n");

    const targetChars = 2800;
    const overlapChars = 400;
    const chunks = chunkText(input, { targetChars, overlapChars });
    expect(chunks.length).toBeGreaterThan(0);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(targetChars + overlapChars);
    }
  });
});
