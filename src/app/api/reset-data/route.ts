import { z } from "zod";
import { redirectTo } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  confirmation: z.literal("RESET")
});

export async function POST(request: Request) {
  const form = Object.fromEntries(await request.formData());
  const parsed = schema.safeParse(form);

  if (!parsed.success) {
    return redirectTo("/settings?reset=invalid");
  }

  await prisma.$transaction([
    prisma.outreachMessage.deleteMany(),
    prisma.opportunity.deleteMany(),
    prisma.game.deleteMany(),
    prisma.company.deleteMany(),
    prisma.article.deleteMany(),
    prisma.crawlRun.deleteMany(),
    prisma.systemLog.deleteMany(),
    prisma.source.updateMany({ data: { lastCrawledAt: null } })
  ]);

  return redirectTo("/settings?reset=success");
}
