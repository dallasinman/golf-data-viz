import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCreateClient,
  mockFrom,
  mockGetUser,
  mockRevalidatePath,
} = vi.hoisted(() => {
  const mockFrom = vi.fn();
  const mockCreateClient = vi.fn(async () => ({ from: mockFrom }));
  const mockGetUser = vi.fn();
  const mockRevalidatePath = vi.fn();

  return {
    mockCreateClient,
    mockFrom,
    mockGetUser,
    mockRevalidatePath,
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/lib/supabase/auth", () => ({
  getUser: mockGetUser,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

vi.mock("@/lib/golf/round-queries", () => ({
  getLessonReportBySelection: vi.fn(),
  getRoundsForLessonReport: vi.fn(),
}));

import { createLessonReportShareToken } from "@/app/(tools)/strokes-gained/lesson-prep/actions";

describe("createLessonReportShareToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("checks report ownership before returning an existing share token", async () => {
    mockGetUser.mockResolvedValue({ id: "user-1" });

    const reportSingle = vi.fn().mockResolvedValue({
      data: { id: "report-1" },
      error: null,
    });
    const reportEqUser = vi.fn(() => ({ single: reportSingle }));
    const reportEqId = vi.fn(() => ({ eq: reportEqUser }));
    const reportSelect = vi.fn(() => ({ eq: reportEqId }));

    const shareSingle = vi.fn().mockResolvedValue({
      data: { token: "share-token" },
      error: null,
    });
    const shareEqOwner = vi.fn(() => ({ single: shareSingle }));
    const shareEqReport = vi.fn(() => ({ eq: shareEqOwner }));
    const shareSelect = vi.fn(() => ({ eq: shareEqReport }));

    mockFrom
      .mockReturnValueOnce({ select: reportSelect })
      .mockReturnValueOnce({ select: shareSelect });

    const result = await createLessonReportShareToken("report-1");

    expect(mockFrom).toHaveBeenNthCalledWith(1, "lesson_reports");
    expect(reportEqId).toHaveBeenCalledWith("id", "report-1");
    expect(reportEqUser).toHaveBeenCalledWith("user_id", "user-1");
    expect(mockFrom).toHaveBeenNthCalledWith(2, "lesson_report_shares");
    expect(shareEqReport).toHaveBeenCalledWith("report_id", "report-1");
    expect(shareEqOwner).toHaveBeenCalledWith("owner_id", "user-1");
    expect(result).toEqual({
      success: true,
      token: "share-token",
      shareUrl: "https://golfdataviz.com/strokes-gained/shared/report/share-token",
      created: false,
    });
  });
});
