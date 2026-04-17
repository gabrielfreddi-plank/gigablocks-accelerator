import { describe, expect, it } from "vitest";

describe("@gigablocks/embed-react", () => {
  it("runs tests in jsdom", () => {
    expect(typeof document).toBe("object");
    expect(typeof window).toBe("object");
  });
});
