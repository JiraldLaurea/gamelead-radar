import { z } from "zod";
import { redirectTo } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  website: z.string().trim().optional(),
  contactEmail: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
  contactUrl: z.string().trim().optional(),
  facebookUrl: z.string().trim().optional(),
  instagramUrl: z.string().trim().optional(),
  linkedinUrl: z.string().trim().optional(),
  tiktokUrl: z.string().trim().optional(),
  youtubeUrl: z.string().trim().optional(),
  twitterUrl: z.string().trim().optional(),
  enrichmentManualNotes: z.string().trim().optional()
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.opportunity.findUniqueOrThrow({ where: { id }, select: { companyId: true } });
  const input = schema.parse(Object.fromEntries(await request.formData()));

  await prisma.company.update({
    where: { id: lead.companyId },
    data: {
      website: emptyToNull(input.website),
      contactEmail: emptyToNull(input.contactEmail),
      contactPhone: emptyToNull(input.contactPhone),
      contactUrl: emptyToNull(input.contactUrl),
      facebookUrl: emptyToNull(input.facebookUrl),
      instagramUrl: emptyToNull(input.instagramUrl),
      linkedinUrl: emptyToNull(input.linkedinUrl),
      tiktokUrl: emptyToNull(input.tiktokUrl),
      youtubeUrl: emptyToNull(input.youtubeUrl),
      twitterUrl: emptyToNull(input.twitterUrl),
      enrichmentManualNotes: emptyToNull(input.enrichmentManualNotes),
      enrichmentStatus: "manual_review",
      enrichmentManuallyEdited: true
    }
  });

  return redirectTo(`/leads/${id}`);
}

function emptyToNull(value: string | undefined) {
  return value ? value : null;
}
