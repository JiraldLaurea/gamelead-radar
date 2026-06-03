import { PrismaClient } from "@prisma/client";
import { discoverRss } from "../src/lib/source-validation";

const prisma = new PrismaClient();

async function main() {
  const sources = await prisma.source.findMany({
    where: { sourceType: { in: ["rss_autodiscovery", "website", "official_press"] } },
    orderBy: [{ priority: "asc" }, { name: "asc" }]
  });

  for (const source of sources) {
    const result = await discoverRss(source);
    if (result.resolvedFeedUrl) {
      console.log(`[OK] ${source.name} -> ${result.resolvedFeedUrl}`);
    } else {
      console.log(`[WARN] ${source.name} - ${result.error ?? "RSS not found"}`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
