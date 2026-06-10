"use client";

import { Pencil, Plus, RotateCcw, Send, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { emailSubjectTemplate } from "@/lib/email-template-defaults";
import { showSnackbar } from "@/lib/snackbar-events";

type LeadDetailComposeEmailProps = {
  leadId: string;
  companyName: string;
  email?: string | null;
  emailBodyTemplate: string;
};

const emailPlaceholders = ["[company_name]", "[game_title]", "[opportunity_type]"] as const;

export function LeadDetailComposeEmail({ leadId, companyName, email, emailBodyTemplate }: LeadDetailComposeEmailProps) {
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [subject, setSubject] = useState(emailSubjectTemplate);
  const [body, setBody] = useState(emailBodyTemplate);
  const [attachments, setAttachments] = useState<File[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const attachmentInputId = useId();

  async function sendEmail() {
    if (!email || sending) return;
    setNotice(null);
    setSending(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const formData = new FormData();
      formData.append("leadIds", JSON.stringify([leadId]));
      formData.append("subject", subject);
      formData.append("body", body);
      attachments.forEach((file) => formData.append("attachments", file));

      const response = await fetch("/api/leads/send-email", {
        method: "POST",
        body: formData,
        signal: controller.signal
      });
      const payload = (await response.json()) as { success?: boolean; sent?: number; failed?: number; error?: string; results?: Array<{ error?: string }> };

      if (!response.ok || !payload.success) {
        const detail = payload.results?.find((result) => result.error)?.error;
        throw new Error(detail || payload.error || "Unable to send email.");
      }

      setNotice({ kind: "success", text: "Sent 1 email." });
      showSnackbar("Sent 1 email.");
      setShowModal(false);
      setAttachments([]);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setNotice({ kind: "error", text: "Email sending was canceled." });
        showSnackbar("Email sending was canceled.", "error");
      } else {
        const message = error instanceof Error ? error.message : "Unable to send email.";
        setNotice({ kind: "error", text: message });
        showSnackbar(message, "error");
      }
    } finally {
      abortRef.current = null;
      setSending(false);
    }
  }

  function cancelSend() {
    abortRef.current?.abort();
  }

  function resetTemplate() {
    setSubject(emailSubjectTemplate);
    setBody(emailBodyTemplate);
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

  function addAttachments(files: FileList | null) {
    if (!files) return;
    const selectedFiles = Array.from(files);
    setAttachments((current) => [...current, ...selectedFiles].slice(0, 5));
  }

  function removeAttachment(index: number) {
    setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <>
      {sending ? (
        <div className="loading-backdrop" role="presentation">
          <div className="loading-modal" role="alertdialog" aria-modal="true" aria-label="Sending email">
            <div className="loading-modal-header">
              <h2>Sending email</h2>
              <button className="icon-button" type="button" onClick={cancelSend} aria-label="Cancel email sending">
                <X size={18} />
              </button>
            </div>
            <div className="loading-spinner" aria-hidden="true" />
            <p>Please wait while the outreach email is sent.</p>
            <button className="button secondary" type="button" onClick={cancelSend}>
               Cancel
            </button>
          </div>
        </div>
      ) : null}

      {showModal ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowModal(false)}>
          <div className="compose-modal" role="dialog" aria-modal="true" aria-labelledby="lead-email-compose-title" onClick={(event) => event.stopPropagation()}>
            <div className="compose-modal-header">
              <div>
                <h2 id="lead-email-compose-title">Email selected leads</h2>
                <p className="inline-muted">1 recipient</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setShowModal(false)} aria-label="Close email modal" disabled={sending}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-scroll">
              <div className="compose-modal-body">
                <div className="compose-recipients">
                  <span>Recipients</span>
                  <div className="recipient-pills">
                    <span className="recipient-pill" title={email ?? undefined}>
                      {companyName}
                    </span>
                  </div>
                </div>
                <label>
                  Subject
                  <input value={subject} onChange={(event) => setSubject(event.target.value)} />
                </label>
                <label>
                  Body
                  <textarea ref={bodyTextareaRef} value={body} onChange={(event) => setBody(event.target.value)} rows={10} />
                </label>
                <div className="placeholder-button-group" aria-label="Email placeholder insert buttons">
                  {emailPlaceholders.map((placeholder) => (
                    <button className="button secondary compact-button" key={placeholder} type="button" onClick={() => insertEmailPlaceholder(placeholder)} disabled={sending}>
                      <Plus size={16} /> {placeholder}
                    </button>
                  ))}
                </div>
                <div className="field-group">
                  <span>Attachments</span>
                  <input
                    id={attachmentInputId}
                    className="file-upload-input"
                    type="file"
                    multiple
                    disabled={sending}
                    onChange={(event) => {
                      addAttachments(event.target.files);
                      event.currentTarget.value = "";
                    }}
                  />
                  <label className="file-upload-control" htmlFor={attachmentInputId}>
                    <span className="button secondary compact-button">
                      Choose files
                    </span>
                  </label>
                  <span className="field-note">Up to 5 files, 10MB max each file.</span>
                </div>
                {attachments.length > 0 ? (
                  <div className="attachment-list">
                    {attachments.map((file, index) => (
                      <span className="attachment-pill" key={`${file.name}-${file.size}-${index}`} title={file.name}>
                        {file.name}
                        <button type="button" aria-label={`Remove ${file.name}`} onClick={() => removeAttachment(index)} disabled={sending}>
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="modal-footer compose-modal-actions">
              <div className="compose-modal-action-group">
                <button className="button secondary" type="button" onClick={() => setShowModal(false)} disabled={sending}>
                   Cancel
                </button>
              </div>
              <div className="compose-modal-action-group">
                <button className="button secondary" type="button" onClick={resetTemplate} disabled={sending}>
                  <RotateCcw size={16} /> Reset
                </button>
                <button className="button" type="button" onClick={sendEmail} disabled={sending || !subject.trim() || !body.trim()}>
                  <Send size={16} /> Send Email
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <button className="button" type="button" onClick={() => setShowModal(true)} disabled={!email || sending}>
        <Pencil size={16} /> Compose Email
      </button>
      {notice ? <p className={notice.kind === "success" ? "notice detail-compose-notice" : "notice warning detail-compose-notice"}>{notice.text}</p> : null}
    </>
  );
}
