import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { processArticle } from "../src/lib/article-analysis-service";

const prisma = new PrismaClient();

async function main() {
  const article = await prisma.article.findFirst({
    where: { processed: false },
    include: { source: true },
    orderBy: { createdAt: "desc" }
  });
  if (!article) {
    console.log("[OK] No pending article found");
    return;
  }
  const result = await processArticle(article);
  console.log(`[OK] analyzed one article: status=${result.status}, provider=${result.provider}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
