import { describe, expect, it } from "vitest";

describe("data-plane", () => {
  it("runs tests in node environment", () => {
    expect("data-plane".startsWith("data")).toBe(true);
  });
});
