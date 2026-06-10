"use client";

import { Eye, FileUp, Plus, RotateCcw, Save, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { defaultEmailBodyTemplate } from "@/lib/email-template-defaults";
import type { EmailTemplateAttachment } from "@/lib/email-template";
import { showSnackbar } from "@/lib/snackbar-events";
import { HelpModal } from "./help-modal";
import { SettingsPanelHeading } from "./settings-panel-heading";

type EmailTemplateSettingsFormProps = {
  initialAttachment: EmailTemplateAttachment | null;
  initialBody: string;
};

export function EmailTemplateSettingsForm({ initialAttachment, initialBody }: EmailTemplateSettingsFormProps) {
  const [body, setBody] = useState(normalizeTemplatePlaceholders(initialBody));
  const [defaultAttachment, setDefaultAttachment] = useState<EmailTemplateAttachment | null>(initialAttachment);
  const [selectedAttachment, setSelectedAttachment] = useState<File | null>(null);
  const [removeDefaultAttachment, setRemoveDefaultAttachment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const attachmentInputId = useId();

  async function saveTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("body", body);
      if (selectedAttachment) {
        formData.append("defaultAttachment", selectedAttachment);
      } else if (removeDefaultAttachment) {
        formData.append("removeDefaultAttachment", "true");
      }

      const response = await fetch("/api/settings/email-template", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as { body?: string; attachment?: EmailTemplateAttachment | null; error?: string };

      if (!response.ok) throw new Error(payload.error || "Unable to save email template.");

      setBody(normalizeTemplatePlaceholders(payload.body || body));
      setDefaultAttachment(payload.attachment ?? null);
      setSelectedAttachment(null);
      setRemoveDefaultAttachment(false);
      setNotice({ kind: "success", text: "Email template saved." });
      showSnackbar("Email template saved.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save email template.";
      setNotice({ kind: "error", text: message });
      showSnackbar(message, "error");
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
      <div className="settings-panel-body">
        <SettingsPanelHeading
          title="Email Template"
          subtitle="This body is used as the default message when composing lead emails."
          actions={
            <>
              <button className="button secondary help-button" type="button" onClick={() => setShowPreview(true)}>
                <Eye size={16} /> Show Preview
              </button>
              <HelpModal title="Email Template Placeholders" items={emailTemplatePlaceholderHelp} buttonLabel="Template Help" />
            </>
          }
        />
        {showPreview ? (
          <div className="modal-backdrop" role="presentation" onClick={() => setShowPreview(false)}>
            <div className="modal template-preview-modal" role="dialog" aria-modal="true" aria-labelledby="template-preview-title" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <h2 id="template-preview-title">Email Preview</h2>
                <button className="icon-button" type="button" onClick={() => setShowPreview(false)} aria-label="Close preview">
                  <X size={18} />
                </button>
              </div>
              <div className="template-preview modal-template-preview" aria-label="Highlighted email template preview">
                {renderTemplatePreview(body)}
              </div>
            </div>
          </div>
        ) : null}
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
        <div className="field-group">
          <span>Default attachment</span>
          <input
            id={attachmentInputId}
            className="file-upload-input"
            type="file"
            disabled={loading}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setSelectedAttachment(file);
              if (file) setRemoveDefaultAttachment(false);
              event.currentTarget.value = "";
            }}
          />
          <label className="file-upload-control" htmlFor={attachmentInputId}>
            <span className="button secondary compact-button">
              <FileUp size={16} /> Choose file
            </span>
          </label>
          <span className="field-note">Optional default file attached to composed and automatic emails. 10MB max.</span>
          {selectedAttachment || (defaultAttachment && !removeDefaultAttachment) ? (
            <div className="attachment-list">
              <span className="attachment-pill" title={selectedAttachment?.name ?? defaultAttachment?.filename}>
                {selectedAttachment?.name ?? defaultAttachment?.filename}
                <button
                  type="button"
                  aria-label="Remove default attachment"
                  onClick={() => {
                    setSelectedAttachment(null);
                    setRemoveDefaultAttachment(Boolean(defaultAttachment));
                  }}
                  disabled={loading}
                >
                  <X size={14} />
                </button>
              </span>
            </div>
          ) : null}
        </div>
        {notice ? <p className={notice.kind === "success" ? "notice" : "notice warning"}>{notice.text}</p> : null}
      </div>
      <div className="settings-panel-footer settings-template-actions">
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
