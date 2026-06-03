import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import { prioritizeArticles, processArticle } from "../src/lib/article-analysis-service";

const prisma = new PrismaClient();

async function main() {
  const articles = prioritizeArticles(
    await prisma.article.findMany({ where: { processed: false }, include: { source: true }, take: 500 })
  );
  let created = 0;
  let excluded = 0;
  let needsResearch = 0;
  let openai = 0;
  let heuristic = 0;

  for (const article of articles) {
    const result = await processArticle(article);
    if (result.status === "excluded") excluded += 1;
    if (result.status === "needs_research") needsResearch += 1;
    if (result.status === "created") created += 1;
    if (result.provider === "openai") openai += 1;
    if (result.provider === "heuristic") heuristic += 1;
  }

  console.log(
    `[OK] analyzed=${articles.length}, created=${created}, needs_research=${needsResearch}, excluded=${excluded}, openai=${openai}, heuristic=${heuristic}`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
