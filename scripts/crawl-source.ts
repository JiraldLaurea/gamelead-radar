import { PrismaClient } from "@prisma/client";
import { crawlSingleSource } from "../src/lib/crawler";

const prisma = new PrismaClient();

async function main() {
  const key = process.argv[2];
  if (!key) throw new Error("Usage: npm run crawl:source -- <source-id-or-name>");

  const source = await prisma.source.findFirst({
    where: {
      OR: [{ id: key }, { name: key }, { url: key }]
    }
  });
  if (!source) throw new Error(`Source not found: ${key}`);

  const result = await crawlSingleSource(source.id);
  console.log(`[OK] ${source.name} - found: ${result.articlesFound}, saved: ${result.articlesSaved}`);
  if (result.errors.length) console.log(result.errors.join("\n"));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
