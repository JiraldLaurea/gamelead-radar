import { enrichOpportunityLead } from "@/lib/lead-enrichment";
import { redirectTo } from "@/lib/http";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  let leadIds: string[] = [];
  if (contentType.includes("application/json")) {
    leadIds = ((await request.json())?.leadIds as string[] | undefined) ?? [];
  } else {
    const formData = await request.formData();
    leadIds =
      formData.get("mode") === "allVisible"
        ? formData.getAll("visibleLeadIds").map(String)
        : formData.getAll("leadIds").map(String);
  }

  const uniqueLeadIds = [...new Set(leadIds)].filter(Boolean).slice(0, Number(process.env.ENRICHMENT_BATCH_LIMIT ?? 25));

  for (const leadId of uniqueLeadIds) {
    await enrichOpportunityLead(leadId);
  }

  if (contentType.includes("application/json")) {
    return Response.json({ success: true, processed: uniqueLeadIds.length });
  }

  return redirectTo(`/leads?enriched=${uniqueLeadIds.length}`);
}
