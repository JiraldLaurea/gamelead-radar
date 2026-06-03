import { redirectTo } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { verifySource } from "@/lib/source-validation";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const source = await prisma.source.findUniqueOrThrow({ where: { id } });
  await verifySource(source);
  return redirectTo("/sources");
}
