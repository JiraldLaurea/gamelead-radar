import Link from "next/link";
import { Filter, RotateCcw } from "lucide-react";
import { EmailLogTable } from "@/components/email-log-table";
import { Shell } from "@/components/shell";
import { prisma } from "@/lib/prisma";

export default async function EmailLogPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const fromDate = parseDateStart(params.from);
  const toDate = parseDateEnd(params.to);
  const selectedStatus = params.status ?? "sent";
  const where = {
    channel: "email",
    ...(selectedStatus ? { status: selectedStatus } : {}),
    ...(params.companyId ? { opportunity: { companyId: params.companyId } } : {}),
    ...(fromDate || toDate ? { updatedAt: { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) } } : {})
  };

  const [messages, companies, statuses] = await Promise.all([
    prisma.outreachMessage.findMany({
    where: {
      ...where
    },
    include: {
      opportunity: {
        include: {
          company: true,
          game: true
        }
      }
    },
    orderBy: { updatedAt: "desc" },
    take: 100
    }),
    prisma.outreachMessage.findMany({
      where: { channel: "email" },
      select: {
        opportunity: {
          select: {
            company: {
              select: { id: true, name: true }
            }
          }
        }
      },
      distinct: ["opportunityId"],
      orderBy: { updatedAt: "desc" }
    }),
    prisma.outreachMessage.findMany({
      where: { channel: "email" },
      select: { status: true },
      distinct: ["status"],
      orderBy: { status: "asc" }
    })
  ]);

  return (
    <Shell title="Email Log" subtitle="Sent outreach emails with recipient details and message content.">
      <div className="email-log-page">
        <section className="panel email-log-filter-panel">
          <form className="filter-row email-log-filter-row" method="get">
            <label>
              From
              <input name="from" type="date" defaultValue={params.from ?? ""} />
            </label>
            <label>
              To
              <input name="to" type="date" defaultValue={params.to ?? ""} />
            </label>
            <label>
              Company
              <select name="companyId" defaultValue={params.companyId ?? ""}>
                <option value="">All businesses</option>
                {uniqueCompanies(companies.map((item) => item.opportunity.company)).map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select name="status" defaultValue={selectedStatus}>
                <option value="">All statuses</option>
                {statuses.map((status) => (
                  <option key={status.status} value={status.status}>
                    {status.status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <button className="button" type="submit"><Filter size={16} /> Filter</button>
            <Link className="button secondary" href="/email-log"><RotateCcw size={16} /> Reset</Link>
          </form>
        </section>
        <EmailLogTable
          messages={messages.map((message) => ({
            id: message.id,
            leadId: message.opportunity.id,
            sentAt: message.updatedAt.toLocaleString(),
            company: message.opportunity.company.name,
            recipientEmail: message.opportunity.company.contactEmail,
            country: message.opportunity.company.country,
            game: message.opportunity.game.title,
            grade: message.opportunity.grade,
            score: message.opportunity.score,
            status: message.status.replaceAll("_", " "),
            subject: message.subject ?? "(No subject)",
            body: message.body
          }))}
        />
      </div>
    </Shell>
  );
}

function parseDateStart(value?: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateEnd(value?: string) {
  if (!value) return null;
  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function uniqueCompanies(companies: Array<{ id: string; name: string }>) {
  return Array.from(new Map(companies.map((company) => [company.id, company])).values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}
