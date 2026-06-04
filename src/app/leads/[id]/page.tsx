import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FilePenLine, RotateCcw, Save, SearchCheck, Tag } from "lucide-react";
import { LeadDetailComposeEmail } from "@/components/lead-detail-compose-email";
import { LoadingForm } from "@/components/loading-form";
import { Shell } from "@/components/shell";
import { getEmailBodyTemplate } from "@/lib/email-template";
import { prisma } from "@/lib/prisma";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.opportunity.findUnique({
    where: { id },
    include: { company: true, game: true, article: { include: { source: true } }, outreachMessages: true }
  });
  if (!lead) notFound();
  const emailBodyTemplate = await getEmailBodyTemplate();
  const enrichmentSources = parseJsonArray(lead.company.enrichmentSources);
  const secondaryEmails = parseJsonArray(lead.company.secondaryEmails);
  const secondaryPhones = parseJsonArray(lead.company.secondaryPhones);
  const visibleSecondaryPhones = secondaryPhones.slice(0, 5);
  const enrichmentButtonLabel =
    lead.company.enrichmentStatus === "not_started" && !lead.company.lastEnrichedAt ? "Run enrichment" : "Re-run enrichment";
  const recommendedPackages = parseJsonArray(lead.recommendedPackages);
  const launchStage = displayValue(lead.game.launchStage?.replaceAll("_", " "));
  const packageList = displayList(recommendedPackages);
  const evidence = evidenceForDisplay(parseJsonArray(lead.evidenceQuotes), {
    company: lead.company.name,
    game: lead.game.title,
    launchStage,
    platform: lead.game.platform,
    packages: recommendedPackages,
    grade: lead.grade,
    score: lead.score,
    nextAction: lead.nextAction
  });

  return (
    <Shell title={lead.game.title} subtitle={`${lead.company.name} · ${lead.company.country} · ${lead.status.replaceAll("_", " ")}`}>
      <div className="page-actions">
        <Link className="button secondary" href="/leads">
          <ArrowLeft size={16} /> Back to lead list
        </Link>
      </div>
      <div className="detail-layout">
        <section className="panel">
          <h2>Opportunity</h2>
          <p><span className={`badge grade-${lead.grade.toLowerCase()}`}>{lead.grade} {lead.score}</span></p>
          <p>{lead.reasoning}</p>
          <p><strong>Launch stage:</strong> {launchStage}</p>
          <p><strong>Packages:</strong> {packageList}</p>
          <p><strong>Next action:</strong> {displayValue(lead.nextAction)}</p>
          <p><strong>Uncertainty:</strong> {displayValue(lead.uncertainty)}</p>
          <h2>Evidence</h2>
          <ul>
            {evidence.map((quote) => <li key={quote}>{quote}</li>)}
          </ul>
          <div className="source-link-row">
            <a className="button source-article-button" href={lead.article.url} target="_blank">
              <ExternalLink size={16} /> Open source article
            </a>
          </div>
          <div className="status-control-group">
            <h3>Lead status</h3>
            <LoadingForm className="actions status-actions" action={`/api/leads/${lead.id}/status`} loadingLabel="Updating lead status">
            {["new", "needs_research", "draft_ready", "contacted", "replied", "rejected", "archived"].map((status) => (
              <button className="button secondary" name="status" value={status} key={status} type="submit" data-loading-label={`Setting status to ${status.replaceAll("_", " ")}`}>
                <Tag size={16} /> {status.replaceAll("_", " ")}
              </button>
            ))}
            </LoadingForm>
          </div>
        </section>
        <section className="panel">
          <h2>Contact Enrichment</h2>
          <p className="enrichment-summary">
            <span className={`badge status-${lead.company.enrichmentStatus}`}>
              {lead.company.enrichmentStatus.replaceAll("_", " ")}
            </span>
            <span className="enrichment-confidence">{lead.company.enrichmentConfidence}% confidence</span>
          </p>
          {lead.company.enrichmentError ? <p><strong>Error:</strong> {lead.company.enrichmentError}</p> : null}
          <dl className="detail-list">
            <dt>Website</dt>
            <dd>{lead.company.website ? <a href={lead.company.website} target="_blank">{lead.company.website}</a> : "Not set"}</dd>
            <dt>Email</dt>
            <dd>{lead.company.contactEmail ?? "Not found"}</dd>
            <dt>Other emails</dt>
            <dd>{secondaryEmails.length ? secondaryEmails.join(", ") : "None"}</dd>
            <dt>Phone</dt>
            <dd>{lead.company.contactPhone ?? "Not found"}</dd>
            <dt>Other phones</dt>
            <dd>
              {visibleSecondaryPhones.length ? visibleSecondaryPhones.join(", ") : "None"}
              {secondaryPhones.length > visibleSecondaryPhones.length ? (
                <span className="cell-subtle">{secondaryPhones.length - visibleSecondaryPhones.length} more hidden</span>
              ) : null}
            </dd>
            <dt>Contact page</dt>
            <dd>{lead.company.contactUrl ? <a href={lead.company.contactUrl} target="_blank">{lead.company.contactUrl}</a> : "Not found"}</dd>
          </dl>
          <div className="actions" style={{ marginBottom: 16 }}>
            <LeadDetailComposeEmail
              leadId={lead.id}
              companyName={lead.company.name}
              email={lead.company.contactEmail}
              emailBodyTemplate={emailBodyTemplate}
            />
            <LoadingForm action={`/api/leads/${lead.id}/enrich`} loadingLabel={enrichmentButtonLabel === "Run enrichment" ? "Running enrichment" : "Re-running enrichment"}>
              <button className="button secondary" type="submit">
                {enrichmentButtonLabel === "Run enrichment" ? <SearchCheck size={16} /> : <RotateCcw size={16} />}
                {enrichmentButtonLabel}
              </button>
            </LoadingForm>
          </div>
          <LoadingForm action={`/api/leads/${lead.id}/enrichment`} className="form-grid" loadingLabel="Saving enrichment edits">
            <label>Website<input name="website" defaultValue={lead.company.website ?? ""} placeholder="https://company.com" /></label>
            <label>Email<input name="contactEmail" defaultValue={lead.company.contactEmail ?? ""} placeholder="info@company.com" /></label>
            <label>Phone<input name="contactPhone" defaultValue={lead.company.contactPhone ?? ""} placeholder="+1 000 000 0000" /></label>
            <label>Contact page<input name="contactUrl" defaultValue={lead.company.contactUrl ?? ""} placeholder="https://company.com/contact" /></label>
            <label>Facebook<input name="facebookUrl" defaultValue={lead.company.facebookUrl ?? ""} /></label>
            <label>Instagram<input name="instagramUrl" defaultValue={lead.company.instagramUrl ?? ""} /></label>
            <label>LinkedIn<input name="linkedinUrl" defaultValue={lead.company.linkedinUrl ?? ""} /></label>
            <label>TikTok<input name="tiktokUrl" defaultValue={lead.company.tiktokUrl ?? ""} /></label>
            <label>YouTube<input name="youtubeUrl" defaultValue={lead.company.youtubeUrl ?? ""} /></label>
            <label>X / Twitter<input name="twitterUrl" defaultValue={lead.company.twitterUrl ?? ""} /></label>
            <label className="full-span">Manual notes<textarea name="enrichmentManualNotes" defaultValue={lead.company.enrichmentManualNotes ?? ""} /></label>
            <div className="form-actions full-span">
              <button className="button" type="submit"><Save size={16} /> Save enrichment edits</button>
            </div>
          </LoadingForm>
          <h2 style={{ marginTop: 18 }}>Enrichment Sources</h2>
          {enrichmentSources.length ? (
            <ul>
              {enrichmentSources.map((source) => <li key={source}><a href={source} target="_blank">{source}</a></li>)}
            </ul>
          ) : (
            <p>No enrichment sources stored yet.</p>
          )}
        </section>
        <section className="panel">
          <h2>Outreach Drafts</h2>
          <LoadingForm action={`/api/leads/${lead.id}/drafts`} loadingLabel="Generating outreach drafts" style={{ marginBottom: 16 }}>
            <button className="button" type="submit"><FilePenLine size={16} /> Generate Drafts</button>
          </LoadingForm>
          {lead.outreachMessages.map((message) => (
            <div className="card" key={message.id} style={{ padding: 14, marginBottom: 12 }}>
              <p><strong>{message.channel}</strong> {message.subject ? `· ${message.subject}` : null}</p>
              <p className="mono">{message.body}</p>
            </div>
          ))}
          {lead.outreachMessages.length === 0 ? <p>No drafts yet. Draft generation is limited to A/B leads.</p> : null}
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

function evidenceForDisplay(
  storedEvidence: string[],
  lead: {
    company: string;
    game: string;
    launchStage: string;
    platform: string;
    packages: string[];
    grade: string;
    score: number;
    nextAction: string;
  }
) {
  const englishEvidence = storedEvidence.filter((item) => !hasCjkOrHangul(item));
  if (englishEvidence.length > 0) return englishEvidence;

  return [
    `Article reviewed for ${lead.company} and ${lead.game}.`,
    lead.launchStage !== "N/A" ? `Detected launch stage: ${lead.launchStage}.` : "No launch stage was confidently detected.",
    displayValue(lead.platform) !== "N/A" ? `Detected platform information: ${displayValue(lead.platform)}.` : "No platform information was confidently detected.",
    lead.packages.length ? `Matched QROAD packages: ${lead.packages.join(", ")}.` : "No QROAD service package was confidently matched.",
    `Lead assessment: grade ${lead.grade} with score ${lead.score}.`,
    `Recommended next action: ${lead.nextAction}`
  ];
}

function hasCjkOrHangul(value: string) {
  return /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/u.test(value);
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
