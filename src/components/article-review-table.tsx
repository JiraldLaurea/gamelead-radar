"use client";

import Checkbox from "@mui/material/Checkbox";
import { Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { showSnackbar } from "@/lib/snackbar-events";

type ArticleReviewRow = {
  id: string;
  title: string;
  source: string;
  published: string;
  processed: string;
  result: string;
  url: string;
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

export function ArticleReviewTable({ articles }: { articles: ArticleReviewRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const selectedArticles = useMemo(() => articles.filter((article) => selectedSet.has(article.id)), [articles, selectedSet]);
  const allVisibleSelected = articles.length > 0 && selected.length === articles.length;

  function toggleArticle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }

  function toggleAll() {
    setSelected(allVisibleSelected ? [] : articles.map((article) => article.id));
  }

  async function deleteSelectedArticles() {
    if (selected.length === 0 || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch("/api/articles/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected })
      });
      const payload = (await response.json()) as { success?: boolean; deleted?: number; error?: string };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to delete selected articles.");
      }
      const deleted = payload.deleted ?? selected.length;
      showSnackbar(`Deleted ${deleted} article${deleted === 1 ? "" : "s"}.`);
      setSelected([]);
      setShowDeleteModal(false);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete selected articles.";
      setDeleteError(message);
      showSnackbar(message, "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="email-log-actions article-review-actions">
        <button className="button secondary" type="button" onClick={() => setShowDeleteModal(true)} disabled={selected.length === 0}>
          <Trash2 size={16} /> Delete
        </button>
      </div>
      <div className="table-wrap article-review-table-shell">
        <div className="table-scroll article-review-table-wrap">
          <table className="article-review-table">
          <thead>
            <tr>
              <th
                className="article-select-column select-cell"
                onClick={(event) => {
                  event.stopPropagation();
                  if (articles.length > 0) toggleAll();
                }}
              >
                <span className="checkbox-hit-area">
                  <Checkbox
                    aria-label="Select all visible articles"
                    checked={allVisibleSelected}
                    disabled={articles.length === 0}
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
              <th className="article-title-column">Title</th>
              <th className="article-source-column">Source</th>
              <th className="article-published-column">Published</th>
              <th className="article-processed-column">Processed</th>
              <th className="article-result-column">Result</th>
            </tr>
            <tr className="table-subheader-row">
              <th className="table-subheader-cell" colSpan={6}>
                {articles.length} article{articles.length === 1 ? "" : "s"} &bull; {selected.length} selected
              </th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr
                className={selectedSet.has(article.id) ? "selected-row clickable-row" : "clickable-row"}
                key={article.id}
                onClick={() => window.open(article.url, "_blank", "noopener,noreferrer")}
              >
                <td
                  className="select-cell"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleArticle(article.id);
                  }}
                >
                  <span className="checkbox-hit-area">
                    <Checkbox
                      aria-label={`Select ${article.title}`}
                      checked={selectedSet.has(article.id)}
                      size="small"
                      sx={checkboxSx}
                      onChange={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleArticle(article.id);
                      }}
                      onKeyDown={(event) => {
                        event.stopPropagation();
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleArticle(article.id);
                        }
                      }}
                    />
                  </span>
                </td>
                <td>{article.title}</td>
                <td>{article.source}</td>
                <td>{article.published}</td>
                <td>{article.processed}</td>
                <td>{article.result}</td>
              </tr>
            ))}
            {articles.length === 0 ? (
              <tr>
                <td colSpan={6}>No articles collected yet.</td>
              </tr>
            ) : null}
          </tbody>
          </table>
        </div>
      </div>

      {showDeleteModal ? (
        <div className="modal-backdrop" role="presentation" onClick={() => (deleting ? undefined : setShowDeleteModal(false))}>
          <div className="modal confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="article-delete-title" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 id="article-delete-title">Delete articles</h2>
                <p className="inline-muted">
                  {selectedArticles.length} selected article{selectedArticles.length === 1 ? "" : "s"} will be removed permanently.
                </p>
              </div>
              <button className="icon-button" type="button" onClick={() => setShowDeleteModal(false)} aria-label="Close delete confirmation" disabled={deleting}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>Deleting articles also removes any leads and outreach records created from those articles.</p>
              {deleteError ? <p className="notice warning">{deleteError}</p> : null}
            </div>
            <div className="modal-footer">
              <button className="button secondary" type="button" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                Cancel
              </button>
              <button className="button danger" type="button" onClick={deleteSelectedArticles} disabled={deleting}>
                <Trash2 size={16} /> {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
