import { DatabaseBackup, Plus, SearchCheck, Trash2 } from "lucide-react";
import { Shell } from "@/components/shell";
import { LoadingForm } from "@/components/loading-form";
import { EmailTemplateSettingsForm } from "@/components/email-template-settings-form";
import { OperationsSettingsForm } from "@/components/operations-settings-form";
import { DebugSettingsForm } from "@/components/debug-settings-form";
import { SettingsPanelHeading } from "@/components/settings-panel-heading";
import { getEmailBodyTemplate, getEmailTemplateAttachment } from "@/lib/email-template";
import { getDebugSettings, getOperationsSettings } from "@/lib/operations-settings";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [sources, articles, leads, emailBodyTemplate, emailTemplateAttachment, operationsSettings, debugSettings, testLeadExists] = await Promise.all([
    prisma.source.count(),
    prisma.article.count(),
    prisma.opportunity.count(),
    getEmailBodyTemplate(),
    getEmailTemplateAttachment(),
    getOperationsSettings(),
    getDebugSettings(),
    prisma.opportunity
      .findFirst({
        where: {
          grade: "A",
          company: { contactEmail: "jiraldcalusay@gmail.com", name: "Test Studio" },
          game: { title: "Neon Quest" }
        },
        select: { id: true }
      })
      .then(Boolean)
  ]);
  return (
    <Shell title="Settings" subtitle="Local configuration, safety switches, database status, and backups.">
      <div className="settings-page">
        <OperationsSettingsForm settings={operationsSettings} testLeadExists={testLeadExists} />
        <DebugSettingsForm settings={debugSettings} />
        <section className="panel settings-action-panel" style={{ marginTop: 16 }}>
          <EmailTemplateSettingsForm initialAttachment={emailTemplateAttachment} initialBody={emailBodyTemplate} />
        </section>
        <section className="panel settings-action-panel">
          <div className="settings-panel-body">
            <SettingsPanelHeading title="Environment" subtitle="Review configured API keys and test search provider connections." />
            <dl className="settings-detail-list">
              <dt>OpenAI API key</dt>
              <dd>{process.env.OPENAI_API_KEY ? "Configured" : "Not configured"}</dd>
              <dt>Model</dt>
              <dd>{process.env.OPENAI_MODEL || "gpt-4.1-mini"}</dd>
              <dt>Google Search API key</dt>
              <dd>{process.env.GOOGLE_SEARCH_API_KEY ? "Configured" : "Not configured"}</dd>
              <dt>Google Search CX</dt>
              <dd>{process.env.GOOGLE_SEARCH_CX || process.env.GOOGLE_CSE_ID ? "Configured" : "Not configured"}</dd>
              <dt>Serper key</dt>
              <dd>{process.env.SERPER_API_KEY ? "Configured" : "Not configured"}</dd>
              <dt>SerpAPI key</dt>
              <dd>{process.env.SERPAPI_API_KEY || process.env.SEARCH_API_KEY ? "Configured" : "Not configured"}</dd>
              <dt>SMTP email sending</dt>
              <dd>{process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS ? "Configured" : "Not configured"}</dd>
              <dt>Auto email send</dt>
              <dd>{process.env.ENABLE_AUTO_EMAIL_SEND === "true" ? "Enabled" : "Disabled"}</dd>
              <dt>LinkedIn automation</dt>
              <dd>{process.env.ENABLE_LINKEDIN_AUTOMATION === "true" ? "Enabled" : "Disabled"}</dd>
            </dl>
            {params.googleSearch === "success" ? <p className="notice">Google Search connection test succeeded.</p> : null}
            {params.googleSearch === "empty" ? <p className="notice warning">Google Search responded, but returned no results.</p> : null}
            {params.googleSearch === "missing" ? <p className="notice warning">Add both GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_CX before testing.</p> : null}
            {params.googleSearch === "failed" ? (
              <p className="notice warning">
                Google Search test failed{params.status ? ` with HTTP ${params.status}` : ""}
                {params.reason ? ` (${params.reason})` : ""}. Check the API key, CX, quota, and API enablement.
                {params.reason === "PERMISSION_DENIED" ? " If this is a new Google project, use Serper instead for web discovery." : ""}
              </p>
            ) : null}
            {params.serper === "success" ? <p className="notice">Serper connection test succeeded.</p> : null}
            {params.serper === "empty" ? <p className="notice warning">Serper responded, but returned no results.</p> : null}
            {params.serper === "missing" ? <p className="notice warning">Add SERPER_API_KEY before testing Serper.</p> : null}
            {params.serper === "failed" ? (
              <p className="notice warning">
                Serper test failed{params.status ? ` with HTTP ${params.status}` : ""}
                {params.reason ? ` (${params.reason})` : ""}. Check the key and account quota.
              </p>
            ) : null}
            {params.serpapi === "success" ? <p className="notice">SerpAPI connection test succeeded.</p> : null}
            {params.serpapi === "empty" ? <p className="notice warning">SerpAPI responded, but returned no results.</p> : null}
            {params.serpapi === "missing" ? <p className="notice warning">Add SERPAPI_API_KEY before testing SerpAPI.</p> : null}
            {params.serpapi === "failed" ? (
              <p className="notice warning">
                SerpAPI test failed{params.status ? ` with HTTP ${params.status}` : ""}
                {params.reason ? ` (${params.reason})` : ""}. Check the key and account quota.
              </p>
            ) : null}
          </div>
          <div className="settings-panel-footer actions settings-test-actions">
            <LoadingForm action="/api/settings/serper-test" loadingLabel="Testing Serper">
              <button className="button secondary" disabled={!process.env.SERPER_API_KEY} type="submit">
                <SearchCheck size={16} /> Test Serper
              </button>
            </LoadingForm>
            <LoadingForm action="/api/settings/google-search-test" loadingLabel="Testing Google Search">
              <button
                className="button secondary"
                disabled={!process.env.GOOGLE_SEARCH_API_KEY || !(process.env.GOOGLE_SEARCH_CX || process.env.GOOGLE_CSE_ID)}
                type="submit"
              >
                <SearchCheck size={16} /> Test Google Search
              </button>
            </LoadingForm>
            <LoadingForm action="/api/settings/serpapi-test" loadingLabel="Testing SerpAPI">
              <button className="button secondary" disabled={!(process.env.SERPAPI_API_KEY || process.env.SEARCH_API_KEY)} type="submit">
                <SearchCheck size={16} /> Test SerpAPI
              </button>
            </LoadingForm>
          </div>
        </section>
        <section className="panel settings-action-panel" style={{ marginTop: 16 }}>
          <div className="settings-panel-body">
            <SettingsPanelHeading title="Database" subtitle="View local workspace totals and run a backup of collected data." />
            <dl className="settings-detail-list">
              <dt>Sources</dt>
              <dd>{sources}</dd>
              <dt>Articles</dt>
              <dd>{articles}</dd>
              <dt>Opportunities</dt>
              <dd>{leads}</dd>
            </dl>
          </div>
          <div className="settings-panel-footer">
            <LoadingForm action="/api/backup" loadingLabel="Running backup">
              <button className="button" type="submit"><DatabaseBackup size={16} /> Run Backup</button>
            </LoadingForm>
          </div>
        </section>
        <section className="panel settings-action-panel" style={{ marginTop: 16 }}>
          <div className="settings-panel-body">
            <SettingsPanelHeading title="Add Test Data" subtitle="Adds one Grade A test opportunity with a completed enrichment record and email address for outreach testing." />
            {params.testData === "success" ? <p className="notice">Grade A test lead added with email jiraldcalusay@gmail.com.</p> : null}
            {params.testData === "exists" ? <p className="notice warning">The Grade A sample lead already exists.</p> : null}
          </div>
          <div className="settings-panel-footer">
            <LoadingForm action="/api/test-data" loadingLabel="Adding test data">
              <button className="button" type="submit" disabled={testLeadExists}><Plus size={16} /> Add Test Data</button>
            </LoadingForm>
          </div>
        </section>
        <section className="panel settings-action-panel" style={{ marginTop: 16 }}>
          <LoadingForm className="settings-action-form" action="/api/reset-data" loadingLabel="Clearing collected data">
            <div className="settings-panel-body">
              <SettingsPanelHeading
                title="Reset Test Data"
                subtitle="Clears articles, companies, games, opportunities, outreach drafts, crawl runs, and logs. Registered sources stay in place."
              />
              {params.reset === "success" ? <p className="notice">Collected data was reset successfully. Sources were kept.</p> : null}
              {params.reset === "invalid" ? <p className="notice warning">Type RESET exactly before clearing collected data.</p> : null}
              <input name="confirmation" placeholder="Type RESET" aria-label="Reset confirmation" />
            </div>
            <div className="settings-panel-footer">
              <button className="button secondary" type="submit"><Trash2 size={16} /> Clear Collected Data</button>
            </div>
          </LoadingForm>
        </section>
      </div>
    </Shell>
  );
}
