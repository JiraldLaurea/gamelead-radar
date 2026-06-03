import { PrismaClient } from "@prisma/client";
import { countryFromSourceRegion } from "../src/lib/analysis";

const prisma = new PrismaClient();

async function main() {
  const opportunities = await prisma.opportunity.findMany({
    include: {
      article: { include: { source: true } },
      company: true
    }
  });

  let updated = 0;
  for (const opportunity of opportunities) {
    const inferredCountry = countryFromSourceRegion(opportunity.article.source.region);
    const country = opportunity.company.country === "Unknown" ? inferredCountry : opportunity.company.country;
    const name = opportunity.company.name === "Unknown" ? "Needs research" : opportunity.company.name;

    if (country !== opportunity.company.country || name !== opportunity.company.name) {
      await prisma.company.update({
        where: { id: opportunity.companyId },
        data: { country, name }
      });
      await prisma.opportunity.update({
        where: { id: opportunity.id },
        data: { targetRegion: country }
      });
      updated += 1;
    }
  }

  console.log(`[OK] Enriched ${updated} existing leads from source metadata`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
