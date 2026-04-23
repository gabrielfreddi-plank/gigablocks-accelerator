import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("renders footer element", () => {
    const { container } = render(<Footer />);
    expect(container.querySelector("footer")).not.toBeNull();
  });
});
