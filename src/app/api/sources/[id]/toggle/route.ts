import { redirectTo } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const source = await prisma.source.findUniqueOrThrow({ where: { id } });
  await prisma.source.update({
    where: { id },
    data: { active: !source.active }
  });
  return redirectTo("/sources");
}
