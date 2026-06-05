import { Info, Save } from "lucide-react";
import { AutomationTestEmailForm } from "@/components/automation-test-email-form";
import { LoadingForm } from "@/components/loading-form";
import type { OperationsSettings } from "@/lib/operations-settings";

export function OperationsSettingsForm({ settings }: { settings: OperationsSettings; testLeadExists: boolean }) {
  const saveFormId = "operations-settings-save-form";

  return (
    <div className="operations-settings-form">
      <LoadingForm id={saveFormId} className="operations-settings-fields" action="/api/settings/operations" loadingLabel="Saving operations settings">
        <div className="automation-toggle-panel">
          <div className="automation-toggle-info">
            <Info size={18} />
            <p>When enabled, the app runs crawl, analysis, and Grade A outreach cycles until the daily email limit is reached.</p>
          </div>
        </div>
        <label className="switch-field">
          <input name="autoEmailEnabled" type="checkbox" defaultChecked={settings.autoEmailEnabled} />
          <span className="switch-track" aria-hidden="true">
            <span className="switch-thumb" />
          </span>
          <span>
            <strong>Automatic email sending</strong>
          </span>
        </label>
        <div className="operations-limit-row">
          <label className="daily-limit-field">
            <span>Maximum article crawling limit</span>
            <input name="maxArticleCrawlLimit" type="number" min={1} max={100} step={1} defaultValue={settings.maxArticleCrawlLimit} />
          </label>
          <label className="daily-limit-field">
            <span>Maximum lead analysis limit</span>
            <input name="maxLeadAnalysisLimit" type="number" min={1} max={10} step={1} defaultValue={settings.maxLeadAnalysisLimit} />
          </label>
          <label className="daily-limit-field">
            <span>Daily email sending limit</span>
            <input name="autoEmailDailyLimit" type="number" min={1} max={10} step={1} defaultValue={settings.autoEmailDailyLimit} />
          </label>
        </div>
      </LoadingForm>
      <div className="operations-settings-actions">
        <button className="button" form={saveFormId} type="submit">
          <Save size={16} /> Save changes
        </button>
        <AutomationTestEmailForm />
      </div>
    </div>
  );
}
