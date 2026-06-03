import { buildEmailDraft, buildLinkedInDraft } from "@/lib/outreach";
import { redirectTo } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opportunity = await prisma.opportunity.findUniqueOrThrow({
    where: { id },
    include: { company: true, game: true }
  });
  if (["A", "B"].includes(opportunity.grade)) {
    const email = buildEmailDraft(opportunity);
    const linkedin = buildLinkedInDraft(opportunity);
    await prisma.outreachMessage.createMany({
      data: [
        { opportunityId: id, channel: "email", language: "en", subject: email.subject, body: email.body },
        { opportunityId: id, channel: "linkedin", language: "en", body: linkedin.body }
      ]
    });
    await prisma.opportunity.update({ where: { id }, data: { status: "draft_ready" } });
  }
  return redirectTo(`/leads/${id}`);
}
