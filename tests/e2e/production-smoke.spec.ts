import { expect, test } from "@playwright/test";

async function fillPartialRound(page: import("@playwright/test").Page) {
  await page.fill('[name="handicapIndex"]', "14.3");
  await page.fill('[name="course"]', "Pacifica Sharp Park");
  await page.fill('[name="courseRating"]', "72.0");
  await page.fill('[name="slopeRating"]', "130");
  await page.fill('[name="score"]', "87");
  await page.fill('[name="fairwayAttempts"]', "14");
  await page.fill('[name="totalPutts"]', "33");
  await page.fill('[name="penaltyStrokes"]', "2");
  await page.fill('[name="eagles"]', "0");
  await page.fill('[name="birdies"]', "1");
  await page.fill('[name="pars"]', "7");
  await page.fill('[name="bogeys"]', "7");
  await page.fill('[name="doubleBogeys"]', "2");
  await page.fill('[name="triplePlus"]', "1");
}

async function fillFullRound(page: import("@playwright/test").Page) {
  await fillPartialRound(page);
  await page.fill('[name="fairwaysHit"]', "7");
  await page.fill('[name="greensInRegulation"]', "6");
}

test.describe("Production smoke", () => {
  test("critical live flow works end-to-end", async ({ page, browserName, context }) => {
    test.skip(
      !process.env.PLAYWRIGHT_BASE_URL?.startsWith("https://"),
      "Production smoke runs only against an explicit remote base URL"
    );

    await page.goto("/?utm_source=reddit");
    await expect(page.getByTestId("hero-headline")).toBeVisible();
    await expect(page.getByTestId("hero-cta")).toHaveAttribute(
      "href",
      "/strokes-gained?utm_source=reddit"
    );

    await page.getByTestId("hero-cta").click();
    await expect(page).toHaveURL(/\/strokes-gained\?utm_source=reddit/);

    await fillFullRound(page);
    await page.click('button[type="submit"]');
    await expect(page.getByTestId("sg-results")).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\?d=/);

    const downloadPromise = page.waitForEvent("download", { timeout: 10000 });
    await page.getByTestId("download-png").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("strokes-gained.png");

    const partialPage = await context.newPage();
    await partialPage.goto("/strokes-gained");
    await fillPartialRound(partialPage);
    await partialPage.click('button[type="submit"]');
    const partialResults = partialPage.getByTestId("sg-results");
    await expect(partialResults).toBeVisible({ timeout: 10000 });

    const estButtons = partialResults.getByRole("button", { name: "Est." });
    await expect(estButtons.first()).toBeVisible();
    await estButtons.first().click();
    await expect(
      partialResults.getByText(
        "This category is estimated from related stats because not all inputs were provided."
      )
    ).toBeVisible();
    await partialPage.keyboard.press("Escape");
    await expect(
      partialResults.getByText(
        "This category is estimated from related stats because not all inputs were provided."
      )
    ).not.toBeVisible();

    await partialPage.close();

    test.info().annotations.push({
      type: "browser",
      description: browserName,
    });
  });
});
