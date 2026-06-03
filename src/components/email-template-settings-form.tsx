"use client";

import { RotateCcw, Save } from "lucide-react";
import { useState } from "react";
import { defaultEmailBodyTemplate } from "@/lib/email-template-defaults";

type EmailTemplateSettingsFormProps = {
  initialBody: string;
};

export function EmailTemplateSettingsForm({ initialBody }: EmailTemplateSettingsFormProps) {
  const [body, setBody] = useState(initialBody);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  async function saveTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setLoading(true);
    try {
      const response = await fetch("/api/settings/email-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body })
      });
      const payload = (await response.json()) as { body?: string; error?: string };

      if (!response.ok) throw new Error(payload.error || "Unable to save email template.");

      setBody(payload.body || body);
      setNotice({ kind: "success", text: "Email template saved." });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Unable to save email template." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="settings-template-form" onSubmit={saveTemplate}>
      {loading ? (
        <div className="loading-backdrop" role="presentation">
          <div className="loading-modal" role="status" aria-live="polite" aria-label="Saving email template">
            <div className="loading-modal-header">
              <h2>Saving email template</h2>
            </div>
            <div className="loading-spinner" aria-hidden="true" />
          </div>
        </div>
      ) : null}
      <div>
        <h2>Email Template</h2>
        <p className="inline-muted">This body is used as the default message when composing lead emails.</p>
      </div>
      <label>
        Body
        <textarea className="settings-template-textarea" value={body} onChange={(event) => setBody(event.target.value)} rows={14} />
      </label>
      <div className="settings-placeholder-list">
        <span>Placeholders</span>
        <p><strong>[company_name]</strong>: lead company name</p>
        <p><strong>[game_title]</strong>: detected game title</p>
        <p><strong>[opportunity_type]</strong>: detected opportunity type</p>
      </div>
      {notice ? <p className={notice.kind === "success" ? "notice" : "notice warning"}>{notice.text}</p> : null}
      <div className="settings-template-actions">
        <button className="button secondary" type="button" onClick={() => setBody(defaultEmailBodyTemplate)} disabled={loading}>
          <RotateCcw size={16} /> Reset
        </button>
        <button className="button" type="submit" disabled={loading || !body.trim()}>
          <Save size={16} /> Save Template
        </button>
      </div>
    </form>
  );
}
