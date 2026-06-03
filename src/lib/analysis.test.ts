import { describe, expect, it } from "vitest";
import { analyzeArticleHeuristically } from "./analysis";

describe("analyzeArticleHeuristically", () => {
  it("includes a target pre-registration mobile lead", () => {
    const result = analyzeArticleHeuristically({
      title: "Korean developer opens global pre-registration for mobile RPG",
      url: "https://example.com/news",
      publishedAt: new Date(),
      rawContent: "The Korean developer announced pre-registration on Google Play and the App Store before global launch."
    });

    expect(result.is_relevant).toBe(true);
    expect(result.game.launch_stage).toBe("pre_registration");
    expect(result.opportunity.recommended_packages).toContain("Pre-Registration Marketing Package");
  });

  it("excludes post-launch review-only articles", () => {
    const result = analyzeArticleHeuristically({
      title: "Review: console-only game is out now",
      url: "https://example.com/review",
      publishedAt: new Date(),
      rawContent: "This review covers an already launched console-only packaged game with user reactions."
    });

    expect(result.is_relevant).toBe(false);
    expect(result.opportunity.grade).toBe("D");
  });
});
