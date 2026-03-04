// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

// Mock next/navigation
const { mockUsePathname } = vi.hoisted(() => ({
  mockUsePathname: vi.fn(() => "/strokes-gained"),
}));

vi.mock("next/navigation", () => ({
  usePathname: mockUsePathname,
}));

import { GA4PageView } from "@/lib/analytics/ga4-pageview";

describe("GA4PageView component", () => {
  let mockGtag: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGtag = vi.fn();
    (window as unknown as Record<string, unknown>).gtag = mockGtag;
    mockUsePathname.mockReturnValue("/strokes-gained");
  });

  afterEach(() => {
    cleanup();
    delete (window as unknown as Record<string, unknown>).gtag;
  });

  it("fires page_view on mount with page_location = origin + pathname (no query string)", () => {
    render(<GA4PageView />);

    expect(mockGtag).toHaveBeenCalledWith("event", "page_view", {
      page_location: expect.stringContaining("/strokes-gained"),
      page_path: "/strokes-gained",
    });

    // Verify no query string in page_location
    const call = mockGtag.mock.calls[0];
    expect(call[2].page_location).not.toContain("?");
  });

  it("re-fires when pathname changes", () => {
    const { rerender } = render(<GA4PageView />);
    expect(mockGtag).toHaveBeenCalledTimes(1);

    mockUsePathname.mockReturnValue("/about");
    rerender(<GA4PageView />);

    expect(mockGtag).toHaveBeenCalledTimes(2);
    expect(mockGtag).toHaveBeenLastCalledWith("event", "page_view", {
      page_location: expect.stringContaining("/about"),
      page_path: "/about",
    });
  });

  it("page_location never contains ?d= even when present in window.location", () => {
    Object.defineProperty(window, "location", {
      value: {
        origin: "https://golfdataviz.com",
        pathname: "/strokes-gained",
        search: "?d=encodedRoundData",
        href: "https://golfdataviz.com/strokes-gained?d=encodedRoundData",
      },
      writable: true,
      configurable: true,
    });

    render(<GA4PageView />);

    const call = mockGtag.mock.calls[0];
    expect(call[2].page_location).not.toContain("?d=");
    expect(call[2].page_location).toBe(
      "https://golfdataviz.com/strokes-gained"
    );
  });

  it("no-ops gracefully when window.gtag is undefined", () => {
    delete (window as unknown as Record<string, unknown>).gtag;

    expect(() => render(<GA4PageView />)).not.toThrow();
  });
});
