import { PrismaClient } from "@prisma/client";
import { getSeedSources } from "./source-seed-utils";

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
  console.log(`[OK] Seeded ${sources.length} sources`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
