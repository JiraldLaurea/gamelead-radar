import { z } from "zod";
import { redirectTo } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  status: z.enum(["new", "needs_research", "draft_ready", "contacted", "replied", "rejected", "archived"])
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const input = schema.parse(Object.fromEntries(await request.formData()));
  await prisma.opportunity.update({ where: { id }, data: { status: input.status } });
  return redirectTo(`/leads/${id}`);
}
