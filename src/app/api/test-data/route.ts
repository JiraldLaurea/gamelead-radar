import { redirectTo } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const now = new Date();
  const suffix = now.getTime();
  const existing = await prisma.opportunity.findFirst({
    where: {
      grade: "A",
      company: { contactEmail: "jiraldcalusay@gmail.com", name: "Test Studio" },
      game: { title: "Neon Quest" }
    }
  });
  if (existing) {
    return redirectTo("/settings?testData=exists");
  }

  const source =
    (await prisma.source.findFirst({ orderBy: { createdAt: "asc" } })) ??
    (await prisma.source.create({
      data: {
        name: "Local Test Source",
        region: "global",
        language: "en",
        sourceType: "rss",
        url: "https://example.com/gamelead-radar-local-test-feed.xml",
        active: false,
        requiresVerification: false,
        verificationStatus: "ok",
        priority: 5,
        reliability: "low",
        notes: "Local source used for manually added test data."
      }
    }));

  await prisma.$transaction(async (tx) => {
    const article = await tx.article.create({
      data: {
        sourceId: source.id,
        title: "Test Studio opens pre-registration for Neon Quest",
        url: `https://example.com/gamelead-radar/test-lead-${suffix}`,
        publishedAt: now,
        rawContent:
          "Test Studio announced pre-registration for Neon Quest, an upcoming cross-platform RPG preparing for a global launch.",
        summary: "Grade A local test lead for email automation validation.",
        language: "en",
        processed: true,
        contentHash: `test-lead-${suffix}`
      }
    });
    const company = await tx.company.create({
      data: {
        name: "Test Studio",
        country: "Japan",
        companyType: "game_studio",
        website: "https://example.com/test-studio",
        websiteStatus: "found",
        contactEmail: "jiraldcalusay@gmail.com",
        contactPhone: "+81 3 0000 0000",
        enrichmentStatus: "completed",
        enrichmentConfidence: 100,
        enrichmentSources: JSON.stringify(["https://example.com/test-studio"]),
        lastEnrichedAt: now
      }
    });
    const game = await tx.game.create({
      data: {
        title: "Neon Quest",
        platform: "PC, iOS, Android",
        genre: "RPG",
        launchStage: "pre_registration",
        expectedLaunchDate: new Date("2026-08-28T00:00:00.000Z")
      }
    });

    await tx.opportunity.create({
      data: {
        articleId: article.id,
        companyId: company.id,
        gameId: game.id,
        targetRegion: "Japan",
        opportunityType: "pre_launch_support",
        score: 92,
        grade: "A",
        status: "new",
        recommendedPackages: JSON.stringify([
          "Pre-Launch QA Package",
          "Global Launch Localization Package",
          "Launch Operation Support Package"
        ]),
        reasoning: "Test lead created from Settings for local email automation validation.",
        evidenceQuotes: JSON.stringify([
          "Test Studio announced pre-registration for Neon Quest.",
          "The game is preparing for a global launch.",
          "The company has a verified test email for outreach validation."
        ]),
        uncertainty: "Local test data only.",
        nextAction: "Send a test outreach email to validate Grade A email automation."
      }
    });
  });

  return redirectTo("/settings?testData=success");
}
