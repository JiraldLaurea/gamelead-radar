import { PrismaClient } from "@prisma/client";
import { extractCompanyNameFromTitle } from "../src/lib/analysis";

const prisma = new PrismaClient();

async function main() {
  const leads = await prisma.opportunity.findMany({
    include: { article: { include: { source: true } }, company: true }
  });

  let updated = 0;
  for (const lead of leads) {
    const companyName = extractCompanyNameFromTitle(lead.article.title) ?? "Needs research";
    if (companyName === lead.company.name) continue;
    await prisma.company.update({
      where: { id: lead.companyId },
      data: { name: companyName }
    });
    updated += 1;
  }

  console.log(`[OK] Enriched ${updated} company names from article titles`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
