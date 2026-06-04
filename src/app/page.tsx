import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/shell";
import { DashboardActionForm } from "@/components/dashboard-action-form";
import { DashboardRecentLeadsTable } from "@/components/dashboard-recent-leads-table";

export default async function DashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [articlesToday, totalArticles, processedArticles, pendingArticles, newLeads, gradeA, needsResearch, drafts, excluded, lastRun, recentLeads, errors] =
    await Promise.all([
      prisma.article.count({ where: { createdAt: { gte: today } } }),
      prisma.article.count(),
      prisma.article.count({ where: { processed: true } }),
      prisma.article.count({ where: { processed: false } }),
      prisma.opportunity.count({ where: { status: "new" } }),
      prisma.opportunity.count({ where: { grade: "A" } }),
      prisma.opportunity.count({ where: { status: "needs_research" } }),
      prisma.outreachMessage.count(),
      prisma.article.count({ where: { excluded: true } }),
      prisma.crawlRun.findFirst({ orderBy: { startedAt: "desc" } }),
      prisma.opportunity.findMany({
        include: { company: true, game: true, article: { include: { source: true } } },
        orderBy: [{ grade: "asc" }, { score: "desc" }],
        take: 8
      }),
      prisma.systemLog.findMany({ where: { level: "error" }, orderBy: { createdAt: "desc" }, take: 3 })
    ]);

  return (
    <Shell title="Dashboard" subtitle="Pre-launch game sales opportunities for QROAD">
      <div className="grid stats">
        <Stat label="Articles today" value={articlesToday} />
        <Stat label="Analyzed" value={`${processedArticles}/${totalArticles}`} hint={`${pendingArticles} pending`} />
        <Stat label="New leads" value={newLeads} />
        <Stat label="Grade A" value={gradeA} />
        <Stat label="Needs research" value={needsResearch} />
        <Stat label="Drafts" value={drafts} />
        <Stat label="Excluded" value={excluded} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: "minmax(0, 1fr)", marginTop: 16 }}>
        <section className="panel">
          <h2>Operations</h2>
          <div className="actions">
            <DashboardActionForm action="/api/crawl" kind="crawl" />
            <DashboardActionForm action="/api/analyze" kind="analyze" />
          </div>
          <p>Last crawl: {lastRun ? `${lastRun.status} at ${lastRun.startedAt.toLocaleString()}` : "Never"}</p>
          {errors.length ? (
            <div className="operation-error-card">
              <div className="operation-error-header">
                <span className="badge status-failed">recent error</span>
                <span>{errors[0].module} · {errors[0].createdAt.toLocaleString()}</span>
              </div>
              <p>{errors[0].message}</p>
              {errors.length > 1 ? <span className="cell-subtle">{errors.length - 1} more recent error(s) logged.</span> : null}
            </div>
          ) : (
            <p className="operation-empty-log">No recent errors logged.</p>
          )}
        </section>
        <section className="panel">
          <h2>Recent Leads</h2>
          <DashboardRecentLeadsTable
            leads={recentLeads.map((lead) => ({
              id: lead.id,
              grade: lead.grade,
              score: lead.score,
              company: lead.company.name,
              website: lead.company.website,
              email: lead.company.contactEmail,
              game: lead.game.title,
              stage: displayValue(lead.game.launchStage.replaceAll("_", " ")),
              packages: displayList(parseJsonArray(lead.recommendedPackages)),
              source: lead.article.source.name,
              status: lead.status.replaceAll("_", " ")
            }))}
          />
        </section>
      </div>
    </Shell>
  );
}

function parseJsonArray(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function displayValue(value?: string | null) {
  const normalized = value?.trim();
  if (!normalized || normalized.toLowerCase() === "unknown") return "N/A";
  return normalized;
}

function displayList(values: string[]) {
  const usefulValues = values.map(displayValue).filter((value) => value !== "N/A");
  return usefulValues.length ? usefulValues.join(", ") : "N/A";
}

function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}
