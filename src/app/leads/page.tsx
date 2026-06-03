import Link from "next/link";
import { Shell } from "@/components/shell";
import { LeadEnrichmentTable } from "@/components/lead-enrichment-table";
import { getEmailBodyTemplate } from "@/lib/email-template";
import { prisma } from "@/lib/prisma";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const companyWhere = {
    ...(params.country ? { country: params.country } : {}),
    ...(params.enrichmentStatus ? { enrichmentStatus: params.enrichmentStatus } : {})
  };
  const where = {
    ...(params.grade ? { grade: params.grade } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(Object.keys(companyWhere).length ? { company: companyWhere } : {}),
    ...(params.stage ? { game: { launchStage: params.stage } } : {})
  };
  const [leads, countries, stages, emailBodyTemplate] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      include: { company: true, game: true, article: { include: { source: true } } },
      orderBy: [{ grade: "asc" }, { score: "desc" }],
      take: 100
    }),
    prisma.company.findMany({ select: { country: true }, distinct: ["country"], orderBy: { country: "asc" } }),
    prisma.game.findMany({ select: { launchStage: true }, distinct: ["launchStage"], orderBy: { launchStage: "asc" } }),
    getEmailBodyTemplate()
  ]);
  return (
    <Shell title="Lead List" subtitle="Qualified QROAD opportunities with scoring, packages, and status.">
      <section className="panel">
        <form className="filter-row" method="get">
          <select name="grade" defaultValue={params.grade ?? ""}>
            <option value="">All grades</option>
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
            <option value="D">Grade D</option>
          </select>
          <select name="status" defaultValue={params.status ?? ""}>
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="needs_research">Needs research</option>
            <option value="draft_ready">Draft ready</option>
            <option value="contacted">Contacted</option>
            <option value="archived">Archived</option>
          </select>
          <select name="country" defaultValue={params.country ?? ""}>
            <option value="">All countries</option>
            {countries
              .filter((country) => country.country)
              .map((country) => (
                <option key={country.country} value={country.country}>
                  {country.country}
                </option>
              ))}
          </select>
          <select name="stage" defaultValue={params.stage ?? ""}>
            <option value="">All stages</option>
            {stages
              .filter((stage) => stage.launchStage)
              .map((stage) => (
                <option key={stage.launchStage} value={stage.launchStage}>
                  {stage.launchStage.replaceAll("_", " ")}
                </option>
              ))}
          </select>
          <select name="enrichmentStatus" defaultValue={params.enrichmentStatus ?? ""}>
            <option value="">All enrichment</option>
            <option value="not_started">Not started</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="partial">Partial</option>
            <option value="failed">Failed</option>
            <option value="manual_review">Manual review</option>
          </select>
          <button className="button" type="submit">Filter</button>
          <Link className="button secondary" href="/leads">Reset</Link>
        </form>
      </section>
      {params.enriched ? <p className="notice">Enrichment finished for {params.enriched} lead(s).</p> : null}
      {params.analyzed ? (
        <p className={params.analysisFailed && params.analysisFailed !== "0" ? "notice warning" : "notice"}>
          Analysis finished for {params.analyzed} article(s)
          {params.analysisFailed && params.analysisFailed !== "0" ? `, with ${params.analysisFailed} failure(s).` : "."}
        </p>
      ) : null}
      <section className="panel" style={{ marginTop: 16 }}>
        <LeadEnrichmentTable
          emailBodyTemplate={emailBodyTemplate}
          leads={leads.map((lead) => ({
            id: lead.id,
            grade: lead.grade,
            score: lead.score,
            status: lead.status.replaceAll("_", " "),
            company: lead.company.name,
            country: lead.company.country,
            game: lead.game.title,
            platform: lead.game.platform,
            stage: lead.game.launchStage.replaceAll("_", " "),
            packages: JSON.parse(lead.recommendedPackages).join(", "),
            source: lead.article.source.name,
            enrichmentStatus: lead.company.enrichmentStatus,
            enrichmentConfidence: lead.company.enrichmentConfidence,
            website: lead.company.website,
            email: lead.company.contactEmail
          }))}
        />
      </section>
    </Shell>
  );
}
