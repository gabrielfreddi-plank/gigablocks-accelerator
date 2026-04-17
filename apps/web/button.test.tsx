import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "@repo/ui/button";

describe("Button", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders and triggers click behavior", async () => {
    const alertMock = vi.fn();
    vi.stubGlobal("alert", alertMock);

    const user = userEvent.setup();

    render(<Button appName="web">Open alert</Button>);
    const button = screen.getByRole("button", { name: "Open alert" });

    await user.click(button);

    expect(alertMock).toHaveBeenCalledWith("Hello from your web app!");
  });
});
