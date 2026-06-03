import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { contentHash } from "../src/lib/analysis";

const prisma = new PrismaClient();

async function main() {
  const source = await prisma.source.upsert({
    where: { url: "https://example.com/gamelead/openai-sample-source" },
    update: {},
    create: {
      name: "OpenAI Sample Source",
      region: "korea",
      language: "en",
      sourceType: "official_press",
      url: "https://example.com/gamelead/openai-sample-source",
      active: false,
      priority: 1,
      reliability: "high",
      crawlFrequencyHours: 24
    }
  });

  const title = "Korean developer Blue Harbor opens global pre-registration for Steam and mobile RPG Starfall Atlas";
  await prisma.article.upsert({
    where: { url: "https://example.com/gamelead/openai-sample-article" },
    update: { processed: false, excluded: false },
    create: {
      sourceId: source.id,
      title,
      url: "https://example.com/gamelead/openai-sample-article",
      publishedAt: new Date(),
      rawContent:
        "Blue Harbor, a Korean game developer and publisher, announced global pre-registration for its upcoming RPG Starfall Atlas. The game is coming to Steam, iOS, and Android, with a closed beta scheduled before launch.",
      summary: "Synthetic OpenAI smoke-test article.",
      language: "en",
      contentHash: contentHash(title)
    }
  });

  console.log("[OK] Seeded one pending OpenAI sample article");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
