"use client";

import { Info, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { AutomationTestEmailForm } from "@/components/automation-test-email-form";
import { AutomationStatusPreviewButton } from "@/components/automation-status-preview-button";
import { LoadingForm } from "@/components/loading-form";
import { SettingsPanelHeading } from "@/components/settings-panel-heading";
import type { OperationsSettings } from "@/lib/operations-settings";
import { automationDisabledEventName } from "@/lib/snackbar-events";

export function OperationsSettingsForm({ settings }: { settings: OperationsSettings; testLeadExists: boolean }) {
  const automationFormId = "operations-automation-save-form";
  const limitsFormId = "operations-limits-save-form";
  const [autoEmailEnabled, setAutoEmailEnabled] = useState(settings.autoEmailEnabled);

  useEffect(() => {
    function disableAutomationToggle() {
      setAutoEmailEnabled(false);
    }

    window.addEventListener(automationDisabledEventName, disableAutomationToggle);
    return () => window.removeEventListener(automationDisabledEventName, disableAutomationToggle);
  }, []);

  return (
    <div className="operations-settings-form">
      <section className="settings-config-panel">
        <LoadingForm id={automationFormId} className="settings-panel-body" action="/api/settings/operations" loadingLabel="Saving automation settings">
          <input name="maxArticleCrawlLimit" type="hidden" value={settings.maxArticleCrawlLimit} />
          <input name="maxLeadAnalysisLimit" type="hidden" value={settings.maxLeadAnalysisLimit} />
          <input name="autoEmailDailyLimit" type="hidden" value={settings.autoEmailDailyLimit} />
          <SettingsPanelHeading
            title="Automatic email sending"
            subtitle="Control whether the app runs crawl, analysis, and Grade A outreach cycles automatically."
          />
          <div className="automation-toggle-panel">
            <div className="automation-toggle-info">
              <Info size={18} />
              <p>When enabled, the app keeps working until the daily email sending limit is reached.</p>
            </div>
          </div>
          <label className="switch-field">
            <input name="autoEmailEnabled" type="checkbox" checked={autoEmailEnabled} onChange={(event) => setAutoEmailEnabled(event.target.checked)} />
            <span className="switch-track" aria-hidden="true">
              <span className="switch-thumb" />
            </span>
            <span>
              <strong>Enable</strong>
            </span>
          </label>
          <div className="automation-schedule-panel">
            <label className="switch-field">
              <input name="autoEmailScheduleEnabled" type="checkbox" defaultChecked={settings.autoEmailScheduleEnabled} />
              <span className="switch-track" aria-hidden="true">
                <span className="switch-thumb" />
              </span>
              <span>
                <strong>Run only during a time window</strong>
              </span>
            </label>
            <div className="automation-schedule-row">
              <label className="daily-limit-field">
                <span>Start time</span>
                <input name="autoEmailScheduleStart" type="time" defaultValue={settings.autoEmailScheduleStart} />
              </label>
              <label className="daily-limit-field">
                <span>End time</span>
                <input name="autoEmailScheduleEnd" type="time" defaultValue={settings.autoEmailScheduleEnd} />
              </label>
            </div>
          </div>
        </LoadingForm>
        <div className="settings-config-footer">
          <AutomationTestEmailForm />
          <AutomationStatusPreviewButton />
          <button className="button" form={automationFormId} type="submit">
            <Save size={16} /> Save Changes
          </button>
        </div>
      </section>
      <section className="settings-config-panel">
        <LoadingForm id={limitsFormId} className="settings-panel-body" action="/api/settings/operations" loadingLabel="Saving operation limits">
          {autoEmailEnabled ? <input name="autoEmailEnabled" type="hidden" value="on" /> : null}
          {settings.autoEmailScheduleEnabled ? <input name="autoEmailScheduleEnabled" type="hidden" value="on" /> : null}
          <input name="autoEmailScheduleStart" type="hidden" value={settings.autoEmailScheduleStart} />
          <input name="autoEmailScheduleEnd" type="hidden" value={settings.autoEmailScheduleEnd} />
          <SettingsPanelHeading
            title="Operation Limit"
            subtitle="Set the maximum work allowed for each automated crawl, analysis, and email sending pass."
          />
          <div className="operations-limit-row">
            <label className="daily-limit-field">
              <span>Maximum article crawling limit(Max: 100)</span>
              <input name="maxArticleCrawlLimit" type="number" min={1} max={100} step={1} defaultValue={settings.maxArticleCrawlLimit} />
            </label>
            <label className="daily-limit-field">
              <span>Maximum lead analysis limit(Max: 10)</span>
              <input name="maxLeadAnalysisLimit" type="number" min={1} max={10} step={1} defaultValue={settings.maxLeadAnalysisLimit} />
            </label>
            <label className="daily-limit-field">
              <span>Daily automated email sending limit(Max: 10)</span>
              <input name="autoEmailDailyLimit" type="number" min={1} max={10} step={1} defaultValue={settings.autoEmailDailyLimit} />
            </label>
          </div>
        </LoadingForm>
        <div className="settings-config-footer">
          <button className="button" form={limitsFormId} type="submit">
            <Save size={16} /> Save Changes
          </button>
        </div>
      </section>
    </div>
  );
}
