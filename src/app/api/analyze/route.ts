import { prioritizeArticles, processArticle } from "@/lib/article-analysis-service";
import { redirectTo } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return redirectTo("/");
}

export async function POST() {
  const limit = process.env.OPENAI_API_KEY ? Number(process.env.OPENAI_ANALYZE_BATCH_SIZE ?? 10) : 50;
  const articles = prioritizeArticles(
    await prisma.article.findMany({ where: { processed: false }, include: { source: true }, take: 100 })
  ).slice(0, limit);

  let analyzed = 0;
  let failed = 0;
  for (const article of articles) {
    try {
      await processArticle(article);
      analyzed += 1;
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : "Unknown analysis error";
      await prisma.systemLog.create({
        data: {
          level: "error",
          module: "analysis",
          message: `Analyze pending failed for article: ${message}`,
          metadata: JSON.stringify({ articleId: article.id, url: article.url })
        }
      });
    }
  }

  return redirectTo(`/leads?analyzed=${analyzed}&analysisFailed=${failed}`);
}
