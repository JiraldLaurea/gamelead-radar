import { redirectTo } from "@/lib/http";
import { enrichOpportunityLead } from "@/lib/lead-enrichment";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await enrichOpportunityLead(id);
  return redirectTo(`/leads/${id}`);
}
