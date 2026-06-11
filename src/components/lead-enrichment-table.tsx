"use client";

import Checkbox from "@mui/material/Checkbox";
import { ChevronDown, Filter, Pencil, Plus, RotateCcw, SearchCheck, Send, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { emailSubjectTemplate } from "@/lib/email-template-defaults";
import { showSnackbar } from "@/lib/snackbar-events";
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
  emailChecked: boolean;
};

const checkboxSx = {
  color: "#667085",
  "&.Mui-checked": {
    color: "#0f766e"
  },
  "&.MuiCheckbox-indeterminate": {
    color: "#0f766e"
  }
};

const emailPlaceholders = ["[company_name]", "[game_title]", "[opportunity_type]"] as const;

type LeadFilterOptions = {
  countries: string[];
  stages: string[];
  values: Record<string, string | undefined>;
};

export function LeadEnrichmentTable({
  emailBodyTemplate,
  filterOptions,
  leads
}: {
  emailBodyTemplate: string;
  filterOptions?: LeadFilterOptions;
  leads: LeadRow[];
}) {
  const filters = filterOptions ?? { countries: [], stages: [], values: {} };
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [emailNotice, setEmailNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [emailSubject, setEmailSubject] = useState(emailSubjectTemplate);
  const [emailBody, setEmailBody] = useState(emailBodyTemplate);
  const [attachments, setAttachments] = useState<File[]>([]);
  const emailAbortRef = useRef<AbortController | null>(null);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const emailBodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const attachmentInputId = useId();
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const selectedLeads = useMemo(() => leads.filter((lead) => selectedSet.has(lead.id)), [leads, selectedSet]);
  const selectedWithEmail = selectedLeads.filter((lead) => lead.email);
  const totalPages = Math.max(1, Math.ceil(leads.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return leads.slice(start, start + rowsPerPage);
  }, [currentPage, leads, rowsPerPage]);
  const paginatedLeadIds = useMemo(() => paginatedLeads.map((lead) => lead.id), [paginatedLeads]);
  const allVisibleSelected = paginatedLeadIds.length > 0 && paginatedLeadIds.every((id) => selectedSet.has(id));
  const exportOptions = [
    ["All leads CSV", "/api/export?format=csv"],
    ["Enriched leads CSV", "/api/export?format=csv&type=enriched"],
    ["Grade A CSV", "/api/export?format=csv&grade=A"],
    ["All leads Excel", "/api/export?format=xls"],
    ["Enriched leads Excel", "/api/export?format=xls&type=enriched"],
    ["Grade A Excel", "/api/export?format=xls&grade=A"]
  ] as const;

  useEffect(() => {
    if (!showExportMenu) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (!exportMenuRef.current?.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [showExportMenu]);

  function toggleLead(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }

  function toggleAll() {
    setSelected((current) => {
      if (allVisibleSelected) return current.filter((id) => !paginatedLeadIds.includes(id));
      return [...new Set([...current, ...paginatedLeadIds])];
    });
  }

  function changeRowsPerPage(value: string) {
    setRowsPerPage(Number(value));
    setPage(1);
  }

  async function sendSelectedEmails() {
    if (selectedWithEmail.length === 0 || sendingEmail) return;
    setEmailNotice(null);
    setSendingEmail(true);
    const controller = new AbortController();
    emailAbortRef.current = controller;
    try {
      const formData = new FormData();
      formData.append("leadIds", JSON.stringify(selectedWithEmail.map((lead) => lead.id)));
      formData.append("subject", emailSubject);
      formData.append("body", emailBody);
      attachments.forEach((file) => formData.append("attachments", file));

      const response = await fetch("/api/leads/send-email", {
        method: "POST",
        body: formData,
        signal: controller.signal
      });
      const payload = (await response.json()) as { success?: boolean; sent?: number; failed?: number; error?: string; results?: Array<{ error?: string }> };
      if (!response.ok || !payload.success) {
        const detail = payload.results?.find((result) => result.error)?.error;
        throw new Error(detail || payload.error || "Unable to send selected emails.");
      }
      const message = `Sent ${payload.sent ?? 0} email${payload.sent === 1 ? "" : "s"}${payload.failed ? `, with ${payload.failed} failure(s)` : ""}.`;
      setEmailNotice({
        kind: "success",
        text: message
      });
      showSnackbar(message);
      setShowEmailModal(false);
      setAttachments([]);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setEmailNotice({ kind: "error", text: "Email sending was canceled." });
        showSnackbar("Email sending was canceled.", "error");
      } else {
        const message = error instanceof Error ? error.message : "Unable to send selected emails.";
        setEmailNotice({ kind: "error", text: message });
        showSnackbar(message, "error");
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

  function insertEmailPlaceholder(placeholder: string) {
    const textarea = emailBodyTextareaRef.current;
    if (!textarea) {
      setEmailBody((current) => `${current}${current ? " " : ""}${placeholder}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextBody = `${emailBody.slice(0, start)}${placeholder}${emailBody.slice(end)}`;
    setEmailBody(nextBody);

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

  async function deleteSelectedLeads() {
    if (selected.length === 0 || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch("/api/leads/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected })
      });
      const payload = (await response.json()) as { success?: boolean; deleted?: number; error?: string };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to delete selected leads.");
      }
      const deleted = payload.deleted ?? selected.length;
      showSnackbar(`Deleted ${deleted} lead${deleted === 1 ? "" : "s"}.`);
      setSelected([]);
      setShowDeleteModal(false);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete selected leads.";
      setDeleteError(message);
      showSnackbar(message, "error");
    } finally {
      setDeleting(false);
    }
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
        <div className="modal-backdrop" role="presentation" onClick={() => setShowEmailModal(false)}>
          <div className="compose-modal" role="dialog" aria-modal="true" aria-labelledby="email-compose-title" onClick={(event) => event.stopPropagation()}>
            <div className="compose-modal-header">
              <div>
                <h2 id="email-compose-title">Email selected leads</h2>
                <p className="inline-muted">{selectedWithEmail.length} recipient{selectedWithEmail.length === 1 ? "" : "s"}</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setShowEmailModal(false)} aria-label="Close email modal" disabled={sendingEmail}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-scroll">
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
                  <textarea ref={emailBodyTextareaRef} value={emailBody} onChange={(event) => setEmailBody(event.target.value)} rows={10} />
                </label>
                <div className="placeholder-button-group" aria-label="Email placeholder insert buttons">
                  {emailPlaceholders.map((placeholder) => (
                    <button
                      className="button secondary compact-button"
                      key={placeholder}
                      type="button"
                      onClick={() => insertEmailPlaceholder(placeholder)}
                      disabled={sendingEmail}
                    >
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
                    disabled={sendingEmail}
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
                        <button type="button" aria-label={`Remove ${file.name}`} onClick={() => removeAttachment(index)} disabled={sendingEmail}>
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
                <button className="button secondary" type="button" onClick={() => setShowEmailModal(false)} disabled={sendingEmail}>
                   Cancel
                </button>
              </div>
              <div className="compose-modal-action-group">
                <button className="button secondary" type="button" onClick={resetEmailTemplate} disabled={sendingEmail}>
                  <RotateCcw size={16} /> Reset
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
      {showFiltersModal ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowFiltersModal(false)}>
          <div className="modal filters-modal" role="dialog" aria-modal="true" aria-labelledby="lead-filters-title" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 id="lead-filters-title">Lead filters</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setShowFiltersModal(false)} aria-label="Close lead filters">
                <X size={18} />
              </button>
            </div>
            <form method="get">
              <div className="modal-body filters-modal-body">
                <label>
                  Grade
                  <select name="grade" defaultValue={filters.values.grade ?? ""}>
                    <option value="">All grades</option>
                    <option value="A">Grade A</option>
                    <option value="B">Grade B</option>
                    <option value="C">Grade C</option>
                    <option value="D">Grade D</option>
                  </select>
                </label>
                <label>
                  Email
                  <select name="emailStatus" defaultValue={filters.values.emailStatus ?? ""}>
                    <option value="">All email statuses</option>
                    <option value="has_email">Has email</option>
                    <option value="no_email">No email</option>
                    <option value="not_found">Not found</option>
                  </select>
                </label>
                <label>
                  Country
                  <select name="country" defaultValue={filters.values.country ?? ""}>
                    <option value="">All countries</option>
                    {filters.countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Stage
                  <select name="stage" defaultValue={filters.values.stage ?? ""}>
                    <option value="">All stages</option>
                    {filters.stages.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Enrichment
                  <select name="enrichmentStatus" defaultValue={filters.values.enrichmentStatus ?? ""}>
                    <option value="">All enrichment</option>
                    <option value="not_started">Not started</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="partial">Partial</option>
                    <option value="failed">Failed</option>
                    <option value="manual_review">Manual review</option>
                  </select>
                </label>
              </div>
              <div className="modal-footer filters-modal-actions">
                <Link className="button secondary" href="/leads">
                  <RotateCcw size={16} /> Reset
                </Link>
                <button className="button" type="submit">
                  <Filter size={16} /> Apply Filters
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      <LoadingForm action="/api/leads/enrich" loadingLabel="Enriching leads">
      {leads.map((lead) => (
        <input key={lead.id} name="visibleLeadIds" type="hidden" value={lead.id} />
      ))}
      {selected.map((leadId) => (
        <input key={leadId} name="leadIds" type="hidden" value={leadId} />
      ))}
      <div className="lead-bulk-actions">
        <div className="lead-bulk-action-group">
          <button className="button" type="button" onClick={() => setShowEmailModal(true)} disabled={selectedWithEmail.length === 0 || sendingEmail}>
            <Pencil size={16} /> Compose Email
          </button>
          <button className="button secondary" type="submit" disabled={selected.length === 0} data-loading-label="Enriching selected leads">
            <SearchCheck size={16} /> Enrich Selected
          </button>
          <button className="button secondary" type="button" onClick={() => setShowDeleteModal(true)} disabled={selected.length === 0}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
        <div className="lead-toolbar-actions">
          <button className="button secondary" type="button" onClick={() => setShowFiltersModal(true)}>
            <Filter size={16} /> Show Filters
          </button>
          <div className="export-menu" ref={exportMenuRef}>
          <button
            className="button secondary"
            type="button"
            aria-expanded={showExportMenu}
            onClick={() => setShowExportMenu((current) => !current)}
          >
            Export <ChevronDown size={16} />
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
      </div>
      <div className="table-wrap">
        <div className="table-scroll lead-list-table-wrap">
          <table className="lead-list-table">
          <thead>
            <tr>
              <th
                className="lead-select-column select-cell"
                onClick={(event) => {
                  event.stopPropagation();
                  if (leads.length > 0) toggleAll();
                }}
              >
                <span className="checkbox-hit-area">
                  <Checkbox
                    aria-label="Select all visible leads"
                    checked={allVisibleSelected}
                    disabled={leads.length === 0}
                    indeterminate={paginatedLeadIds.some((id) => selectedSet.has(id)) && !allVisibleSelected}
                    size="small"
                    sx={checkboxSx}
                    onChange={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleAll();
                    }}
                    onKeyDown={(event) => {
                      event.stopPropagation();
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleAll();
                      }
                    }}
                  />
                </span>
              </th>
              <th className="lead-grade-column">Grade</th>
              <th className="lead-company-column">Company</th>
              <th className="lead-email-column">Email</th>
              <th className="lead-country-column">Country</th>
              <th className="lead-game-column">Game</th>
            </tr>
            <tr className="table-subheader-row">
              <th className="table-subheader-cell" colSpan={6}>
                {leads.length} lead{leads.length === 1 ? "" : "s"} &bull; {selected.length} selected
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedLeads.map((lead) => (
              <tr
                className={selectedSet.has(lead.id) ? "selected-row clickable-row" : "clickable-row"}
                key={lead.id}
                onClick={() => router.push(`/leads/${lead.id}`)}
              >
                <td
                  className="select-cell"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleLead(lead.id);
                  }}
                >
                  <span className="checkbox-hit-area">
                    <Checkbox
                      aria-label={`Select ${lead.company}`}
                      checked={selectedSet.has(lead.id)}
                      size="small"
                      sx={checkboxSx}
                      onChange={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleLead(lead.id);
                      }}
                      onKeyDown={(event) => {
                        event.stopPropagation();
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleLead(lead.id);
                        }
                      }}
                    />
                  </span>
                </td>
                <td><span className={`badge grade-${lead.grade.toLowerCase()}`}>{lead.grade} {lead.score}</span></td>
                <td>
                  <strong>{lead.company}</strong>
                  {lead.website ? <span className="cell-subtle">{lead.website}</span> : null}
                </td>
                <td>
                  {lead.email ? (
                    <span className="truncate-cell">{lead.email}</span>
                  ) : (
                    <span className={`contact-value-pill table-email-pill ${lead.emailChecked ? "warning" : "neutral"}`}>
                      {lead.emailChecked ? "Not found" : "Not checked"}
                    </span>
                  )}
                </td>
                <td>{lead.country}</td>
                <td>{lead.game}</td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
      <div className="table-pagination" aria-label="Leads table pagination">
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <div className="table-pagination-actions">
          <label className="table-pagination-rows">
            Rows
            <select value={rowsPerPage} onChange={(event) => changeRowsPerPage(event.target.value)}>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>
          <button className="button secondary" type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage <= 1}>
            Previous
          </button>
          <button className="button secondary" type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage >= totalPages}>
            Next
          </button>
        </div>
      </div>
      </LoadingForm>
      {showDeleteModal ? (
        <div className="modal-backdrop" role="presentation" onClick={() => (deleting ? undefined : setShowDeleteModal(false))}>
          <div className="modal confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="lead-delete-title" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 id="lead-delete-title">Delete leads</h2>
                <p className="inline-muted">
                  {selectedLeads.length} selected lead{selectedLeads.length === 1 ? "" : "s"} will be removed permanently.
                </p>
              </div>
              <button className="icon-button" type="button" onClick={() => setShowDeleteModal(false)} aria-label="Close delete confirmation" disabled={deleting}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>This deletes the lead opportunity and its outreach records. Source articles remain available in Article Review.</p>
              {deleteError ? <p className="notice warning">{deleteError}</p> : null}
            </div>
            <div className="modal-footer">
              <button className="button secondary" type="button" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                Cancel
              </button>
              <button className="button danger" type="button" onClick={deleteSelectedLeads} disabled={deleting}>
                <Trash2 size={16} /> {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
