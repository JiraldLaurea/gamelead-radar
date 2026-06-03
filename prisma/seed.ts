import { PrismaClient } from "@prisma/client";
import { getSeedSources } from "../scripts/source-seed-utils";

const prisma = new PrismaClient();

async function main() {
  const sources = getSeedSources();
  for (const source of sources) {
    await prisma.source.upsert({
      where: { url: source.url },
      update: source,
      create: source
    });
  }

  const existing = await prisma.article.count();
  if (existing === 0) {
    const source = await prisma.source.findFirstOrThrow();
    await prisma.article.create({
      data: {
        sourceId: source.id,
        title: "Sample Korean developer opens global pre-registration for mobile RPG",
        url: "https://example.com/gamelead/sample-preregistration",
        publishedAt: new Date(),
        rawContent:
          "A Korean developer announced global pre-registration for its upcoming mobile RPG on Google Play and the App Store before launch.",
        summary: "Sample pre-launch mobile article for local validation.",
        language: "en",
        contentHash: "seed-sample-preregistration"
      }
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
