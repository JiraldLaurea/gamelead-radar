import { z } from "zod";
import { redirectTo } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2),
  region: z.string(),
  language: z.string().default("en"),
  sourceType: z.string(),
  url: z.string().url(),
  active: z.enum(["true", "false"]),
  crawlFrequencyHours: z.coerce.number().int().min(1),
  priority: z.coerce.number().int().min(1).max(5).default(3),
  reliability: z.string().default("medium"),
  maxItemsPerRun: z.coerce.number().int().min(1).max(100).default(30),
  notes: z.string().optional()
});

export async function POST(request: Request) {
  const form = Object.fromEntries(await request.formData());
  const input = schema.parse(form);
  await prisma.source.upsert({
    where: { url: input.url },
    update: {
      name: input.name,
      region: input.region,
      language: input.language,
      sourceType: input.sourceType,
      active: input.active === "true",
      crawlFrequencyHours: input.crawlFrequencyHours,
      priority: input.priority,
      reliability: input.reliability,
      maxItemsPerRun: input.maxItemsPerRun,
      notes: input.notes
    },
    create: {
      name: input.name,
      region: input.region,
      language: input.language,
      sourceType: input.sourceType,
      url: input.url,
      active: input.active === "true",
      crawlFrequencyHours: input.crawlFrequencyHours,
      priority: input.priority,
      reliability: input.reliability,
      maxItemsPerRun: input.maxItemsPerRun,
      notes: input.notes
    }
  });
  return redirectTo("/sources");
}
