import { test, expect, type Page } from "@playwright/test";
import { fillPartialRound } from "./helpers/round-form";

async function fillCaveatedAtgFallbackRound(page: Page) {
  await fillPartialRound(page);
  await page.fill('[name="fairwaysHit"]', "7");
  await page.fill('[name="greensInRegulation"]', "7");
  await page.fill('[name="totalPutts"]', "31");
  await page.fill('[name="birdies"]', "1");
  await page.fill('[name="pars"]', "6");
  await page.fill('[name="bogeys"]', "5");
  await page.fill('[name="doubleBogeys"]', "4");
  await page.fill('[name="triplePlus"]', "2");
}

async function fillAssertiveAtgFallbackControlRound(page: Page) {
  await fillPartialRound(page);
  await page.fill('[name="fairwaysHit"]', "7");
  await page.fill('[name="greensInRegulation"]', "7");
  await page.fill('[name="totalPutts"]', "32");
  await page.fill('[name="birdies"]', "1");
  await page.fill('[name="pars"]', "9");
  await page.fill('[name="bogeys"]', "7");
  await page.fill('[name="doubleBogeys"]', "1");
  await page.fill('[name="triplePlus"]', "0");
}

test.describe("SG trust hardening", () => {
  test("caveated ATG-fallback rounds show the trust-context card and suppress editorial emphasis", async ({
    page,
  }) => {
    await page.goto("/strokes-gained");
    await fillCaveatedAtgFallbackRound(page);
    await page.click('button[type="submit"]');

    await expect(page.getByText("Your Round Breakdown")).toBeVisible();
    const trustCard = page.getByTestId("presentation-trust-card");
    await expect(trustCard).toBeVisible();
    await expect(trustCard.getByText("Round Summary")).toBeVisible();
    await expect(
      trustCard.getByText(
        "Your total SG is course-adjusted. Individual category estimates are based on scorecard stats and may not reflect shot-by-shot performance."
      )
    ).toBeVisible();
    await expect(page.getByText("Key Insights")).toHaveCount(0);
    await expect(page.getByText("Biggest Strength")).toHaveCount(0);
    await expect(page.getByText("Biggest Weakness")).toHaveCount(0);
    await expect(page.getByTestId("percentile-standout")).toHaveCount(0);
  });

  test("healthy ATG-fallback control rounds stay assertive", async ({ page }) => {
    await page.goto("/strokes-gained");
    await fillAssertiveAtgFallbackControlRound(page);
    await page.click('button[type="submit"]');

    await expect(page.getByText("Your Round Breakdown")).toBeVisible();
    await expect(page.getByTestId("presentation-trust-card")).toHaveCount(0);
    await expect(page.getByText("Key Insights")).toBeVisible();
  });

  test("mobile More Stats shows one-putts and enforces the short-game validation", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/strokes-gained");
    await fillPartialRound(page);
    await page.getByRole("button", { name: /show more stats/i }).click();

    await expect(
      page.getByRole("spinbutton", { name: /one-putts/i })
    ).toBeVisible();
    await expect(
      page.getByText(
        "Optional. Helps build a more complete picture of your short game."
      )
    ).toBeVisible();

    await page.fill('[name="onePutts"]', "10");
    await page.fill('[name="threePutts"]', "9");
    await page.click('button[type="submit"]');

    await expect(
      page.getByText("One-putts and three-putts can't exceed 18 holes")
    ).toBeVisible();
  });
});
