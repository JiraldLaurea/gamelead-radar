"use client";

import { useRouter } from "next/navigation";

type DashboardRecentLeadRow = {
  id: string;
  grade: string;
  score: number;
  company: string;
  website?: string | null;
  email?: string | null;
  game: string;
};

export function DashboardRecentLeadsTable({ leads }: { leads: DashboardRecentLeadRow[] }) {
  const router = useRouter();

  return (
    <div className="table-wrap">
      <div className="table-scroll lead-list-table-wrap dashboard-recent-leads-table-wrap">
        <table className="lead-list-table dashboard-recent-leads-table">
        <thead>
          <tr>
            <th className="lead-grade-column">Grade</th>
            <th className="lead-company-column">Company</th>
            <th className="lead-email-column">Email</th>
            <th className="lead-game-column">Game</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr className="clickable-row" key={lead.id} onClick={() => router.push(`/leads/${lead.id}`)}>
              <td>
                <span className={`badge grade-${lead.grade.toLowerCase()}`}>{lead.grade} {lead.score}</span>
              </td>
              <td>
                <strong>{lead.company}</strong>
                {lead.website ? <span className="cell-subtle">{lead.website}</span> : null}
              </td>
              <td>{lead.email ? <span className="truncate-cell">{lead.email}</span> : <span className="cell-subtle">N/A</span>}</td>
              <td>{lead.game}</td>
            </tr>
          ))}
          {leads.length === 0 ? (
            <tr>
              <td colSpan={4}>No leads yet. Seed the database, crawl sources, or analyze sample articles.</td>
            </tr>
          ) : null}
        </tbody>
        </table>
      </div>
    </div>
  );
}
