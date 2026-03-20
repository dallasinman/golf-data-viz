// @vitest-environment jsdom

import { describe, it, expect, afterEach, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoundInputForm } from "@/app/(tools)/strokes-gained/_components/round-input-form";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("RoundInputForm plus handicap toggle", () => {
  const onSubmit = vi.fn();

  it("toggle defaults to HCP", () => {
    render(<RoundInputForm onSubmit={onSubmit} />);
    const toggle = screen.getByTestId("plus-handicap-toggle");
    expect(toggle.textContent).toBe("HCP");
  });

  it("clicking toggle changes label to +", async () => {
    const user = userEvent.setup();
    render(<RoundInputForm onSubmit={onSubmit} />);
    const toggle = screen.getByTestId("plus-handicap-toggle");
    await user.click(toggle);
    expect(toggle.textContent).toBe("+");
  });

  it("plus toggle on shows Plus HCP badge", async () => {
    const user = userEvent.setup();
    render(<RoundInputForm onSubmit={onSubmit} />);
    const toggle = screen.getByTestId("plus-handicap-toggle");
    await user.click(toggle);

    // Type a handicap value
    const hcpInput = document.querySelector<HTMLInputElement>('input[name="handicapIndex"]')!;
    await user.clear(hcpInput);
    await user.type(hcpInput, "2.3");
    // Trigger blur to update watch
    await user.tab();

    expect(screen.getByText("Plus HCP")).toBeVisible();
  });

  it("rehydrates from -2.3 with + toggle and 2.3 value", () => {
    render(
      <RoundInputForm
        onSubmit={onSubmit}
        initialValues={{ handicapIndex: -2.3 } as never}
      />
    );
    const toggle = screen.getByTestId("plus-handicap-toggle");
    expect(toggle.textContent).toBe("+");

    const hcpInput = document.querySelector<HTMLInputElement>('input[name="handicapIndex"]')!;
    expect(hcpInput).toHaveValue(2.3);
  });
});

describe("RoundInputForm submit button", () => {
  const onSubmit = vi.fn();

  it("shows default text when not calculating", () => {
    render(<RoundInputForm onSubmit={onSubmit} />);
    expect(screen.getByRole("button", { name: "See My Strokes Gained" })).not.toBeDisabled();
  });

  it("shows Calculating... and is disabled when isCalculating", () => {
    render(<RoundInputForm onSubmit={onSubmit} isCalculating />);
    expect(screen.getByRole("button", { name: "Calculating..." })).toBeDisabled();
  });
});

describe("RoundInputForm save checkbox removed", () => {
  const onSubmit = vi.fn();

  it("does not render save checkbox", () => {
    render(<RoundInputForm onSubmit={onSubmit} />);
    expect(
      screen.queryByLabelText("Save this round to track over time")
    ).toBeNull();
  });
});

describe("RoundInputForm one-putts field flag", () => {
  const onSubmit = vi.fn();

  it("shows One-putts under More Stats when enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_ONE_PUTTS_ENABLED", "on");
    const user = userEvent.setup();

    render(<RoundInputForm onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: /show more stats/i }));

    expect(screen.getByRole("spinbutton", { name: /one-putts/i })).toBeVisible();
    expect(
      screen.getByText("Optional. Helps build a more complete picture of your short game.")
    ).toBeVisible();
  });

});
