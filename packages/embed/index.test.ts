import { describe, expect, it } from "vitest";

describe("@gigablocks/embed", () => {
  it("runs tests in node environment", () => {
    expect(typeof process.versions.node).toBe("string");
  });
});
