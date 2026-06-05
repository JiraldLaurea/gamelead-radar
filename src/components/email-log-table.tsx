"use client";

import { X } from "lucide-react";
import { useState } from "react";

export type EmailLogRow = {
  id: string;
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

export function EmailLogTable({ messages }: { messages: EmailLogRow[] }) {
  const [selectedMessage, setSelectedMessage] = useState<EmailLogRow | null>(null);

  return (
    <>
      <div className="table-wrap email-log-table-shell">
        <div className="table-scroll email-log-table-wrap">
          <table className="email-log-table">
            <thead>
              <tr>
                <th>Sent</th>
                <th>Company</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((message) => (
                <tr className="clickable-row" key={message.id} onClick={() => setSelectedMessage(message)}>
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
                  <td className="email-log-empty-cell" colSpan={4}>No email logs yet.</td>
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
          </div>
        </div>
      ) : null}
    </>
  );
}
