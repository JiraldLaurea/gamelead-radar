"use client";

import Checkbox from "@mui/material/Checkbox";
import { Eye, Filter, RotateCcw, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { showSnackbar } from "@/lib/snackbar-events";

export type EmailLogRow = {
  id: string;
  leadId: string;
  sentAt: string;
  company: string;
  recipientEmail: string | null;
  country: string;
  game: string;
  grade: string;
  score: number;
  status: string;
  subject: string;
  body: string;
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

type EmailLogFilterOptions = {
  companies: Array<{ id: string; name: string }>;
  statuses: string[];
  values: Record<string, string | undefined>;
};

export function EmailLogTable({ filterOptions, messages }: { filterOptions?: EmailLogFilterOptions; messages: EmailLogRow[] }) {
  const filters = filterOptions ?? { companies: [], statuses: [], values: {} };
  const router = useRouter();
  const [selectedMessage, setSelectedMessage] = useState<EmailLogRow | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const selectedMessages = useMemo(() => messages.filter((message) => selectedSet.has(message.id)), [messages, selectedSet]);
  const allVisibleSelected = messages.length > 0 && selected.length === messages.length;

  function toggleMessage(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }

  function toggleAll() {
    setSelected(allVisibleSelected ? [] : messages.map((message) => message.id));
  }

  async function deleteSelectedMessages() {
    if (selected.length === 0 || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch("/api/email-log/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected })
      });
      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to delete selected email logs.");
      }
      showSnackbar(`Deleted ${selected.length} email log${selected.length === 1 ? "" : "s"}.`);
      setSelected([]);
      setShowDeleteModal(false);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete selected email logs.";
      setDeleteError(message);
      showSnackbar(message, "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="email-log-actions">
        <button className="button secondary" type="button" onClick={() => setShowFiltersModal(true)}>
          <Filter size={16} /> Show Filters
        </button>
        <button className="button secondary" type="button" onClick={() => setShowDeleteModal(true)} disabled={selected.length === 0}>
          <Trash2 size={16} /> Delete
        </button>
      </div>
      {showFiltersModal ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowFiltersModal(false)}>
          <div className="modal filters-modal" role="dialog" aria-modal="true" aria-labelledby="email-log-filters-title" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 id="email-log-filters-title">Email log filters</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setShowFiltersModal(false)} aria-label="Close email log filters">
                <X size={18} />
              </button>
            </div>
            <form method="get">
              <div className="modal-body filters-modal-body">
                <label>
                  From
                  <input name="from" type="date" defaultValue={filters.values.from ?? ""} />
                </label>
                <label>
                  To
                  <input name="to" type="date" defaultValue={filters.values.to ?? ""} />
                </label>
                <label>
                  Company
                  <select name="companyId" defaultValue={filters.values.companyId ?? ""}>
                    <option value="">All businesses</option>
                    {filters.companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Status
                  <select name="status" defaultValue={filters.values.status ?? "sent"}>
                    <option value="">All statuses</option>
                    {filters.statuses.map((status) => (
                      <option key={status} value={status}>
                        {status.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="modal-footer filters-modal-actions">
                <Link className="button secondary" href="/email-log">
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
      <div className="table-wrap email-log-table-shell">
        <div className="table-scroll email-log-table-wrap">
          <table className="email-log-table">
            <thead>
              <tr>
                <th
                  className="email-log-select-column select-cell"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (messages.length > 0) toggleAll();
                  }}
                >
                  <span className="checkbox-hit-area">
                    <Checkbox
                      aria-label="Select all visible email logs"
                      checked={allVisibleSelected}
                      disabled={messages.length === 0}
                      indeterminate={selected.length > 0 && !allVisibleSelected}
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
                <th>Sent</th>
                <th>Company</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
              <tr className="table-subheader-row">
                <th className="table-subheader-cell" colSpan={5}>
                  {messages.length} email log{messages.length === 1 ? "" : "s"} &bull; {selected.length} selected
                </th>
              </tr>
            </thead>
            <tbody>
              {messages.map((message) => (
                <tr className={selectedSet.has(message.id) ? "selected-row clickable-row" : "clickable-row"} key={message.id} onClick={() => setSelectedMessage(message)}>
                  <td
                    className="select-cell"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleMessage(message.id);
                    }}
                  >
                    <span className="checkbox-hit-area">
                      <Checkbox
                        aria-label={`Select ${message.company} email log`}
                        checked={selectedSet.has(message.id)}
                        size="small"
                        sx={checkboxSx}
                        onChange={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleMessage(message.id);
                        }}
                        onKeyDown={(event) => {
                          event.stopPropagation();
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            toggleMessage(message.id);
                          }
                        }}
                      />
                    </span>
                  </td>
                  <td>{message.sentAt}</td>
                  <td>
                    <strong>{message.company}</strong>
                  </td>
                  <td>{message.recipientEmail ?? "No email recorded"}</td>
                  <td><span className="badge status-completed">{message.status}</span></td>
                </tr>
              ))}
              {messages.length === 0 ? (
                <tr>
                  <td className="email-log-empty-cell" colSpan={5}>No email logs yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {selectedMessage ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedMessage(null)}>
          <div className="modal email-log-modal" role="dialog" aria-modal="true" aria-labelledby="email-log-title" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header email-log-preview-header">
              <div>
                <h2 id="email-log-title">Sent Email</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setSelectedMessage(null)} aria-label="Close email log preview">
                <X size={18} />
              </button>
            </div>
            <div className="modal-scroll">
              <div className="email-log-modal-body">
                <div className="email-log-detail-list">
                  <div className="email-log-detail-row">
                    <span>Sent</span>
                    <strong>{selectedMessage.sentAt}</strong>
                  </div>
                  <div className="email-log-detail-row">
                    <span>Company</span>
                    <strong>{selectedMessage.company}</strong>
                  </div>
                  <div className="email-log-detail-row">
                    <span>Recipient email</span>
                    <strong>{selectedMessage.recipientEmail ?? "No email recorded"}</strong>
                  </div>
                  <div className="email-log-detail-row">
                    <span>Country</span>
                    <strong>{selectedMessage.country || "N/A"}</strong>
                  </div>
                  <div className="email-log-detail-row">
                    <span>Game</span>
                    <strong>{selectedMessage.game}</strong>
                  </div>
                  <div className="email-log-detail-row">
                    <span>Grade</span>
                    <strong><span className={`badge grade-${selectedMessage.grade.toLowerCase()}`}>{selectedMessage.grade} {selectedMessage.score}</span></strong>
                  </div>
                </div>
                <section className="email-log-preview-block">
                  <h3>Subject</h3>
                  <p>{selectedMessage.subject}</p>
                </section>
                <section className="email-log-preview-block">
                  <h3>Body</h3>
                  <pre>{selectedMessage.body}</pre>
                </section>
              </div>
            </div>
            <div className="modal-footer">
              <Link className="button secondary" href={`/leads/${selectedMessage.leadId}`}>
                <Eye size={16} /> Preview Lead Details
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {showDeleteModal ? (
        <div className="modal-backdrop" role="presentation" onClick={() => (deleting ? undefined : setShowDeleteModal(false))}>
          <div className="modal confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="email-log-delete-title" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 id="email-log-delete-title">Delete email logs</h2>
                <p className="inline-muted">
                  {selectedMessages.length} selected email log{selectedMessages.length === 1 ? "" : "s"} will be removed permanently.
                </p>
              </div>
              <button className="icon-button" type="button" onClick={() => setShowDeleteModal(false)} aria-label="Close delete confirmation" disabled={deleting}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>This only deletes the email log records. It will not delete the lead, company, or article data.</p>
              {deleteError ? <p className="notice warning">{deleteError}</p> : null}
            </div>
            <div className="modal-footer">
              <button className="button secondary" type="button" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                Cancel
              </button>
              <button className="button danger" type="button" onClick={deleteSelectedMessages} disabled={deleting}>
                <Trash2 size={16} /> {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
