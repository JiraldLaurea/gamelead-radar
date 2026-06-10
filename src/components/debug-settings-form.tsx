"use client";

import { Loader, Save } from "lucide-react";
import { useState } from "react";
import { LoadingForm, LoadingSpinner } from "@/components/loading-form";
import type { DebugSettings } from "@/lib/operations-settings";

export function DebugSettingsForm({ settings }: { settings: DebugSettings }) {
  const formId = "debug-settings-save-form";
  const [showLoadingPreview, setShowLoadingPreview] = useState(false);

  return (
    <section className="settings-config-panel debug-settings-panel">
      <LoadingForm id={formId} className="settings-panel-body" action="/api/settings/debug" loadingLabel="Saving debug settings">
        <div className="settings-panel-heading">
          <div>
            <h2>Debug</h2>
            <p>Preview internal UI states and test automation without real outbound email.</p>
          </div>
        </div>
        <label className="switch-field">
          <input name="disableActualEmailSending" type="checkbox" defaultChecked={settings.disableActualEmailSending} />
          <span className="switch-track" aria-hidden="true">
            <span className="switch-thumb" />
          </span>
          <span>
            <strong>Disable actual email sending</strong>
            <small>Automation will still record sent email logs, but SMTP will not send to real leads.</small>
          </span>
        </label>
      </LoadingForm>
      <div className="settings-panel-footer">
        <button className="button secondary" type="button" onClick={() => setShowLoadingPreview(true)}>
          <Loader size={16} /> Show loading modal
        </button>
        <button className="button" form={formId} type="submit">
          <Save size={16} /> Save changes
        </button>
      </div>
      {showLoadingPreview ? (
        <div className="loading-backdrop" role="presentation">
          <div className="loading-modal" role="dialog" aria-modal="true" aria-labelledby="debug-loading-title">
            <div className="loading-modal-body">
              <LoadingSpinner />
              <h2 id="debug-loading-title">Debug loading modal</h2>
              <p>Please wait while the system finishes this action.</p>
            </div>
            <div className="modal-footer loading-modal-actions">
              <button className="button secondary" type="button" onClick={() => setShowLoadingPreview(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
