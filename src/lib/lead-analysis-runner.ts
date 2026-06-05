import { prioritizeArticles, processArticle } from "@/lib/article-analysis-service";
import { prisma } from "@/lib/prisma";

export async function analyzePendingArticles(limit: number) {
  const articles = prioritizeArticles(
    await prisma.article.findMany({ where: { processed: false }, include: { source: true }, take: Math.max(limit, 100) })
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

  return { analyzed, failed, requested: articles.length };
}
