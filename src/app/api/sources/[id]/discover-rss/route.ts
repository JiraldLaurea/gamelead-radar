import { redirectTo } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { discoverRss } from "@/lib/source-validation";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const source = await prisma.source.findUniqueOrThrow({ where: { id } });
  await discoverRss(source);
  return redirectTo("/sources");
}
