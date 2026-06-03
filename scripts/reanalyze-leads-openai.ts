import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { analyzeArticle } from "../src/lib/openai-analysis";

const prisma = new PrismaClient();

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for reanalysis");
  }

  const limit = Number(process.argv[2] ?? process.env.OPENAI_REANALYZE_LIMIT ?? 10);
  const leads = await prisma.opportunity.findMany({
    where: {
      OR: [
        { company: { name: { contains: "Needs research" } } },
        { company: { name: { contains: "Unknown" } } },
        { company: { name: { contains: "セガ" } } },
        { game: { title: { contains: "ドット" } } },
        { game: { title: { contains: "ぷよ" } } },
        { game: { title: { contains: "ポケット" } } }
      ]
    },
    include: {
      article: { include: { source: true } },
      company: true,
      game: true
    },
    orderBy: [{ grade: "asc" }, { score: "desc" }],
    take: limit
  });

  let updated = 0;
  for (const lead of leads) {
    const result = await analyzeArticle(lead.article);
    if (result.provider !== "openai") {
      console.log(`[WARN] ${lead.article.title} fell back to heuristic: ${result.error ?? "unknown"}`);
      continue;
    }
    const analysis = result.analysis;
    await prisma.company.update({
      where: { id: lead.companyId },
      data: {
        name: analysis.company.name || lead.company.name,
        country: analysis.company.country,
        companyType: analysis.company.company_type
      }
    });
    await prisma.game.update({
      where: { id: lead.gameId },
      data: {
        title: analysis.game.title || lead.game.title,
        platform: analysis.game.platforms.join(", ") || lead.game.platform,
        genre: analysis.game.genre,
        launchStage: analysis.game.launch_stage,
        expectedLaunchDate: analysis.game.expected_launch_date ? new Date(analysis.game.expected_launch_date) : null
      }
    });
    await prisma.opportunity.update({
      where: { id: lead.id },
      data: {
        targetRegion: analysis.company.country,
        opportunityType: analysis.opportunity.opportunity_type,
        score: analysis.opportunity.score,
        grade: analysis.opportunity.grade,
        recommendedPackages: JSON.stringify(analysis.opportunity.recommended_packages),
        reasoning: analysis.relevance_reason,
        evidenceQuotes: JSON.stringify(analysis.evidence.key_quotes),
        uncertainty: analysis.uncertainty,
        nextAction: analysis.opportunity.next_action,
        status: analysis.is_relevant ? lead.status : "needs_research"
      }
    });
    updated += 1;
    console.log(`[OK] ${lead.article.title.slice(0, 60)} -> ${analysis.company.name} / ${analysis.game.title}`);
  }

  console.log(`[OK] Reanalyzed ${updated}/${leads.length} leads with OpenAI`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
