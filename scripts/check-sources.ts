import { PrismaClient } from "@prisma/client";
import { verifySource } from "../src/lib/source-validation";

const prisma = new PrismaClient();

async function main() {
  const activeOnly = process.argv.includes("--active-only");
  const sources = await prisma.source.findMany({
    where: activeOnly ? { active: true } : {},
    orderBy: [{ priority: "asc" }, { name: "asc" }]
  });

  for (const source of sources) {
    const result = await verifySource(source);
    const label = result.status === "ok" ? "OK" : result.status === "warning" ? "WARN" : "FAIL";
    const latest = result.latestPublishedAt ? result.latestPublishedAt.toISOString().slice(0, 10) : "unknown";
    const detail = result.error ? ` - ${result.error}` : "";
    console.log(`[${label}] ${source.name} - ${result.itemCount} items parsed - latest: ${latest}${detail}`);
    await delay(Number(process.env.REQUEST_DELAY_MS ?? 500));
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
