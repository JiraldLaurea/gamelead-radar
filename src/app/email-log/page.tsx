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
        <EmailLogTable
          filterOptions={{
            companies: uniqueCompanies(companies.map((item) => item.opportunity.company)),
            statuses: statuses.map((status) => status.status),
            values: {
              companyId: params.companyId,
              from: params.from,
              status: selectedStatus,
              to: params.to
            }
          }}
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
