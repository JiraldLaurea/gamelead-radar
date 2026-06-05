"use client";

import { AlertTriangle, CheckCircle2, FileText, MailCheck, Target } from "lucide-react";
import { useEffect, useState } from "react";

const dismissedStatusStorageKey = "gamelead-dismissed-automation-status";

type AutomationStatus = {
  running: boolean;
  phase: string;
  message: string;
  startedAt: string | null;
  updatedAt: string | null;
  sentToday: number;
  target: number;
  iteration: number;
  crawled: number;
  analyzed: number;
  emailsSent: number;
  emailFailed: number;
  analysisFailed: number;
};

export function AutomationStatusBar() {
  const [status, setStatus] = useState<AutomationStatus | null>(null);
  const [dismissedStatusKey, setDismissedStatusKey] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    setDismissedStatusKey(window.localStorage.getItem(dismissedStatusStorageKey));
  }, []);

  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const response = await fetch("/api/automation/status", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as AutomationStatus;
        if (active) {
          setStatus(payload);
          if (!payload.running) setCanceling(false);
        }
      } catch {
        // The status bar is informational; avoid distracting users if polling fails.
      }
    }

    refresh();
    const interval = window.setInterval(refresh, 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  if (!status || status.phase === "idle" || status.phase === "disabled") return null;

  const isTestRun = status.message.toLowerCase().includes("test automation") || status.message.toLowerCase().includes("test automatic");
  const sentCount = isTestRun ? status.emailsSent : status.sentToday;
  const canDismiss = !status.running;
  const statusKey = `${status.startedAt ?? "no-start"}:${status.phase}:${status.message}:${status.iteration}:${sentCount}:${status.target}`;
  if (canDismiss && dismissedStatusKey === statusKey) return null;

  const statusLabel = status.running ? "Automation running" : status.phase === "done" ? "Automation done" : "Automation paused";

  async function cancelAutomation() {
    setCanceling(true);
    try {
      const response = await fetch("/api/automation/cancel", { method: "POST" });
      if (!response.ok) return;
      setStatus((await response.json()) as AutomationStatus);
    } finally {
      setCanceling(false);
    }
  }

  function dismissStatus() {
    window.localStorage.setItem(dismissedStatusStorageKey, statusKey);
    setDismissedStatusKey(statusKey);
  }

  const finishedSummary = !status.running ? (
    <div className="modal-backdrop automation-summary-backdrop" role="presentation" onClick={dismissStatus}>
      <div className="modal automation-summary-modal" role="dialog" aria-modal="true" aria-labelledby="automation-summary-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header automation-summary-header">
          <span className={`automation-summary-success-icon status-${status.phase}`} aria-hidden="true">
            {status.phase === "done" ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
          </span>
          <div>
            <h2 id="automation-summary-title">{statusLabel}</h2>
            <p>{status.message}</p>
          </div>
        </div>
        <div className="automation-summary-body">
          <AutomationSummaryCard icon={MailCheck} label="Emails sent" value={sentCount} />
          <AutomationSummaryCard icon={Target} label="Target Email" value={status.target} />
          <AutomationSummaryCard icon={FileText} label="Articles crawled" value={status.crawled} />
          <AutomationSummaryCard icon={FileText} label="Articles analyzed" value={status.analyzed} />
        </div>
        <div className="automation-summary-actions">
          <a className="button secondary" href="/email-log" onClick={dismissStatus}>
            Email logs
          </a>
          <button className="button" type="button" onClick={dismissStatus}>
            OK
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {status.running ? (
        <div className={`automation-status-bar status-${status.phase}`} role="status">
          <span className="automation-status-dot" aria-hidden="true" />
          <span className="automation-status-main">{statusLabel}</span>
          <span>{status.message}</span>
          <span className="automation-status-metrics">
            Sent {sentCount}/{status.target}{isTestRun ? "" : " today"} - Cycle {status.iteration}
          </span>
        <button className="automation-status-ok" type="button" onClick={cancelAutomation} disabled={canceling}>
          {canceling ? "Canceling..." : "Cancel automation"}
        </button>
        </div>
      ) : null}
      {finishedSummary}
    </>
  );
}

function AutomationSummaryCard({ icon: Icon, label, value }: { icon: typeof MailCheck; label: string; value: number }) {
  return (
    <div className="automation-summary-card">
      <span className="automation-summary-card-icon" aria-hidden="true">
        <Icon size={20} />
      </span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
