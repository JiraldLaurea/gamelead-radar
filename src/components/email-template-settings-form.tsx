"use client";

import { Plus, RotateCcw, Save } from "lucide-react";
import { useRef, useState } from "react";
import { defaultEmailBodyTemplate } from "@/lib/email-template-defaults";
import { HelpModal } from "./help-modal";

type EmailTemplateSettingsFormProps = {
  initialBody: string;
};

export function EmailTemplateSettingsForm({ initialBody }: EmailTemplateSettingsFormProps) {
  const [body, setBody] = useState(normalizeTemplatePlaceholders(initialBody));
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);

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

      setBody(normalizeTemplatePlaceholders(payload.body || body));
      setNotice({ kind: "success", text: "Email template saved." });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Unable to save email template." });
    } finally {
      setLoading(false);
    }
  }

  function insertEmailPlaceholder(placeholder: string) {
    const textarea = bodyTextareaRef.current;
    if (!textarea) {
      setBody((current) => `${current}${current ? " " : ""}${placeholder}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextBody = `${body.slice(0, start)}${placeholder}${body.slice(end)}`;
    setBody(nextBody);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPosition = start + placeholder.length;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
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
      <div className="section-heading">
        <div>
          <h2>Email Template</h2>
          <p className="inline-muted">This body is used as the default message when composing lead emails.</p>
        </div>
        <HelpModal title="Email Template Placeholders" items={emailTemplatePlaceholderHelp} buttonLabel="Template Help" />
      </div>
      <label>
        Body
        <textarea ref={bodyTextareaRef} className="settings-template-textarea" value={body} onChange={(event) => setBody(event.target.value)} rows={14} />
      </label>
      <div className="placeholder-button-group" aria-label="Email template placeholder insert buttons">
        {emailTemplatePlaceholderHelp.map((placeholder) => (
          <button
            className="button secondary compact-button"
            key={placeholder.label}
            type="button"
            onClick={() => insertEmailPlaceholder(placeholder.label)}
            disabled={loading}
          >
            <Plus size={16} /> {placeholder.label}
          </button>
        ))}
      </div>
      <label>
        Preview
        <div className="template-preview" aria-label="Highlighted email template preview">
          {renderTemplatePreview(body)}
        </div>
      </label>
      {notice ? <p className={notice.kind === "success" ? "notice" : "notice warning"}>{notice.text}</p> : null}
      <div className="settings-template-actions">
        <button className="button secondary" type="button" onClick={() => setBody(normalizeTemplatePlaceholders(defaultEmailBodyTemplate))} disabled={loading}>
          <RotateCcw size={16} /> Reset
        </button>
        <button className="button" type="submit" disabled={loading || !body.trim()}>
          <Save size={16} /> Save Template
        </button>
      </div>
    </form>
  );
}

const emailTemplatePlaceholderHelp = [
  { label: "[company_name]", description: "Lead company name." },
  { label: "[game_title]", description: "Detected game title." },
  { label: "[opportunity_type]", description: "Detected opportunity type." }
];

function normalizeTemplatePlaceholders(value: string) {
  return value.replace(/\[business_name\]/gi, "[company_name]");
}

function renderTemplatePreview(value: string) {
  const parts = value.split(/(\[(?:company_name|game_title|opportunity_type)\])/gi);

  return parts.map((part, index) => {
    if (/^\[(?:company_name|game_title|opportunity_type)\]$/i.test(part)) {
      return (
        <strong className="template-placeholder-token" key={`${part}-${index}`}>
          {part}
        </strong>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}
