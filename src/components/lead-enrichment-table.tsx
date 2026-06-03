"use client";

import { ChevronDown, Download, Pencil, RotateCcw, SearchCheck, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { emailSubjectTemplate } from "@/lib/email-template-defaults";
import { LoadingForm } from "./loading-form";

type LeadRow = {
  id: string;
  grade: string;
  score: number;
  status: string;
  company: string;
  country: string;
  game: string;
  platform: string;
  stage: string;
  packages: string;
  source: string;
  enrichmentStatus: string;
  enrichmentConfidence: number;
  website?: string | null;
  email?: string | null;
};

export function LeadEnrichmentTable({ emailBodyTemplate, leads }: { emailBodyTemplate: string; leads: LeadRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [emailNotice, setEmailNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [emailSubject, setEmailSubject] = useState(emailSubjectTemplate);
  const [emailBody, setEmailBody] = useState(emailBodyTemplate);
  const emailAbortRef = useRef<AbortController | null>(null);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const selectedLeads = useMemo(() => leads.filter((lead) => selectedSet.has(lead.id)), [leads, selectedSet]);
  const selectedWithEmail = selectedLeads.filter((lead) => lead.email);
  const allVisibleSelected = leads.length > 0 && selected.length === leads.length;
  const exportOptions = [
    ["All leads CSV", "/api/export?format=csv"],
    ["Enriched leads CSV", "/api/export?format=csv&type=enriched"],
    ["Grade A CSV", "/api/export?format=csv&grade=A"],
    ["All leads Excel", "/api/export?format=xls"],
    ["Enriched leads Excel", "/api/export?format=xls&type=enriched"],
    ["Grade A Excel", "/api/export?format=xls&grade=A"]
  ] as const;

  function toggleLead(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }

  function toggleAll() {
    setSelected(allVisibleSelected ? [] : leads.map((lead) => lead.id));
  }

  async function sendSelectedEmails() {
    if (selectedWithEmail.length === 0 || sendingEmail) return;
    setEmailNotice(null);
    setSendingEmail(true);
    const controller = new AbortController();
    emailAbortRef.current = controller;
    try {
      const response = await fetch("/api/leads/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds: selectedWithEmail.map((lead) => lead.id),
          subject: emailSubject,
          body: emailBody
        }),
        signal: controller.signal
      });
      const payload = (await response.json()) as { success?: boolean; sent?: number; failed?: number; error?: string; results?: Array<{ error?: string }> };
      if (!response.ok || !payload.success) {
        const detail = payload.results?.find((result) => result.error)?.error;
        throw new Error(detail || payload.error || "Unable to send selected emails.");
      }
      setEmailNotice({
        kind: "success",
        text: `Sent ${payload.sent ?? 0} email${payload.sent === 1 ? "" : "s"}${payload.failed ? `, with ${payload.failed} failure(s)` : ""}.`
      });
      setShowEmailModal(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setEmailNotice({ kind: "error", text: "Email sending was canceled." });
      } else {
        setEmailNotice({ kind: "error", text: error instanceof Error ? error.message : "Unable to send selected emails." });
      }
    } finally {
      emailAbortRef.current = null;
      setSendingEmail(false);
    }
  }

  function cancelEmailSend() {
    emailAbortRef.current?.abort();
  }

  function resetEmailTemplate() {
    setEmailSubject(emailSubjectTemplate);
    setEmailBody(emailBodyTemplate);
  }

  return (
    <>
      {sendingEmail ? (
        <div className="loading-backdrop" role="presentation">
          <div className="loading-modal" role="alertdialog" aria-modal="true" aria-label="Sending emails">
            <div className="loading-modal-header">
              <h2>Sending emails</h2>
              <button className="icon-button" type="button" onClick={cancelEmailSend} aria-label="Cancel email sending">
                <X size={18} />
              </button>
            </div>
            <div className="loading-spinner" aria-hidden="true" />
            <p>Please wait while selected outreach emails are sent.</p>
            <button className="button secondary" type="button" onClick={cancelEmailSend}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      {showEmailModal ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="email-compose-title">
          <div className="compose-modal">
            <div className="compose-modal-header">
              <div>
                <h2 id="email-compose-title">Email selected leads</h2>
                <p className="inline-muted">{selectedWithEmail.length} recipient{selectedWithEmail.length === 1 ? "" : "s"}</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setShowEmailModal(false)} aria-label="Close email modal" disabled={sendingEmail}>
                <X size={18} />
              </button>
            </div>
            <div className="compose-modal-body">
              <div className="compose-recipients">
                <span>Recipients</span>
                <div className="recipient-pills">
                  {selectedWithEmail.map((lead) => (
                    <span className="recipient-pill" key={lead.id} title={lead.email ?? undefined}>
                      {lead.company}
                    </span>
                  ))}
                </div>
              </div>
              <label>
                Subject
                <input value={emailSubject} onChange={(event) => setEmailSubject(event.target.value)} />
              </label>
              <label>
                Body
                <textarea value={emailBody} onChange={(event) => setEmailBody(event.target.value)} rows={10} />
              </label>
              <p className="inline-muted compose-hint">Use [company_name], [game_title], or [opportunity_type] to personalize each email.</p>
            </div>
            <div className="compose-modal-actions">
              <button className="button secondary" type="button" onClick={resetEmailTemplate} disabled={sendingEmail}>
                <RotateCcw size={16} /> Reset
              </button>
              <div className="compose-modal-action-group">
                <button className="button secondary" type="button" onClick={() => setShowEmailModal(false)} disabled={sendingEmail}>
                  Cancel
                </button>
                <button className="button" type="button" onClick={sendSelectedEmails} disabled={sendingEmail || !emailSubject.trim() || !emailBody.trim()}>
                  <Send size={16} /> {sendingEmail ? "Sending..." : "Send Email"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {emailNotice ? <p className={emailNotice.kind === "success" ? "notice" : "notice warning"}>{emailNotice.text}</p> : null}
      <LoadingForm action="/api/leads/enrich" loadingLabel="Enriching leads">
      {leads.map((lead) => (
        <input key={lead.id} name="visibleLeadIds" type="hidden" value={lead.id} />
      ))}
      <div className="lead-bulk-actions">
        <div className="lead-bulk-action-group">
          <span>{selected.length} selected</span>
          <button className="button" type="submit" disabled={selected.length === 0} data-loading-label="Enriching selected leads">
            <SearchCheck size={16} /> Enrich Selected
          </button>
          <button className="button secondary" type="button" onClick={() => setShowEmailModal(true)} disabled={selectedWithEmail.length === 0 || sendingEmail}>
            <Pencil size={16} /> Compose Email
          </button>
        </div>
        <div className="export-menu">
          <button
            className="button secondary"
            type="button"
            aria-expanded={showExportMenu}
            onClick={() => setShowExportMenu((current) => !current)}
          >
            <Download size={16} /> Export <ChevronDown size={16} />
          </button>
          {showExportMenu ? (
            <div className="export-menu-list">
              {exportOptions.map(([label, href]) => (
                <a key={href} href={href} onClick={() => setShowExportMenu(false)}>
                  {label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="table-wrap lead-list-table-wrap">
        <table className="lead-list-table">
          <thead>
            <tr>
              <th className="lead-select-column">
                <input
                  aria-label="Select all visible leads"
                  checked={allVisibleSelected}
                  className="row-checkbox"
                  type="checkbox"
                  onChange={toggleAll}
                />
              </th>
              <th className="lead-grade-column">Grade</th>
              <th className="lead-company-column">Company</th>
              <th className="lead-email-column">Email</th>
              <th className="lead-country-column">Country</th>
              <th className="lead-game-column">Game</th>
              <th className="lead-platform-column">Platform</th>
              <th className="lead-stage-column">Stage</th>
              <th className="lead-packages-column">Packages</th>
              <th className="lead-enrichment-column">Enrichment</th>
              <th className="lead-source-column">Source</th>
              <th className="lead-status-column">Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                className={selectedSet.has(lead.id) ? "selected-row clickable-row" : "clickable-row"}
                key={lead.id}
                onClick={() => router.push(`/leads/${lead.id}`)}
              >
                <td>
                  <input
                    aria-label={`Select ${lead.company}`}
                    checked={selectedSet.has(lead.id)}
                    className="row-checkbox"
                    name="leadIds"
                    type="checkbox"
                    value={lead.id}
                    onClick={(event) => event.stopPropagation()}
                    onChange={() => toggleLead(lead.id)}
                  />
                </td>
                <td><span className={`badge grade-${lead.grade.toLowerCase()}`}>{lead.grade} {lead.score}</span></td>
                <td>
                  <strong>{lead.company}</strong>
                  {lead.website ? <span className="cell-subtle">{lead.website}</span> : null}
                </td>
                <td>{lead.email ? <span className="truncate-cell">{lead.email}</span> : <span className="cell-subtle">N/A</span>}</td>
                <td>{lead.country}</td>
                <td>{lead.game}</td>
                <td>{lead.platform}</td>
                <td>{lead.stage}</td>
                <td><span className="one-line-cell">{lead.packages}</span></td>
                <td>
                  <span className={`badge status-${lead.enrichmentStatus}`}>{lead.enrichmentStatus.replaceAll("_", " ")}</span>
                  <span className="cell-subtle">{lead.enrichmentConfidence}% confidence</span>
                </td>
                <td>{lead.source}</td>
                <td>{lead.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </LoadingForm>
    </>
  );
}
