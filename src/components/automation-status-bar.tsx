"use client";

import { AlertTriangle, Check, FileText, MailCheck, Target, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { automationDisabledEventName, showSnackbar } from "@/lib/snackbar-events";

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

export function AutomationStatusBar({ initialStatus = null }: { initialStatus?: AutomationStatus | null }) {
  const [status, setStatus] = useState<AutomationStatus | null>(initialStatus);
  const [previewStatus, setPreviewStatus] = useState<AutomationStatus | null>(null);
  const [dismissedStatusKey, setDismissedStatusKey] = useState<string | null | undefined>(undefined);
  const [forcedSummaryKey, setForcedSummaryKey] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const lastRunningStartedAtRef = useRef<string | null>(initialStatus?.running ? initialStatus.startedAt : null);

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

  useEffect(() => {
    function showPreviewStatus() {
      setPreviewStatus({
        running: true,
        phase: "running",
        message: "Preview: crawling, analyzing, and preparing Grade A outreach.",
        startedAt: "preview",
        updatedAt: new Date().toISOString(),
        sentToday: 2,
        target: 5,
        iteration: 1,
        crawled: 100,
        analyzed: 10,
        emailsSent: 2,
        emailFailed: 0,
        analysisFailed: 0
      });
    }

    window.addEventListener("gamelead-preview-automation-status", showPreviewStatus);
    return () => window.removeEventListener("gamelead-preview-automation-status", showPreviewStatus);
  }, []);

  useEffect(() => {
    if (!status || previewStatus) return;
    if (status.running && status.startedAt) {
      lastRunningStartedAtRef.current = status.startedAt;
      return;
    }
    if (!status.running && ["done", "error"].includes(status.phase) && status.startedAt === lastRunningStartedAtRef.current) {
      setForcedSummaryKey(getAutomationStatusKey(status));
      lastRunningStartedAtRef.current = null;
    }
  }, [previewStatus, status]);

  const activeStatus = previewStatus ?? status;

  if (!activeStatus || activeStatus.phase === "idle" || activeStatus.phase === "disabled") return null;

  const isPreview = Boolean(previewStatus);
  const isTestRun = activeStatus.message.toLowerCase().includes("test automation") || activeStatus.message.toLowerCase().includes("test automatic");
  const sentCount = getStatusSentCount(activeStatus);
  const statusKey = getAutomationStatusKey(activeStatus);
  const forceSummary = forcedSummaryKey === statusKey;
  const dismissedStatusLoaded = dismissedStatusKey !== undefined;
  const summaryDismissed = !forceSummary && !isPreview && dismissedStatusLoaded && dismissedStatusKey === statusKey;
  const shouldShowPausedAfterSummary =
    !activeStatus.running &&
    activeStatus.phase === "done" &&
    (activeStatus.message.toLowerCase().includes("scheduled email sending window ended") ||
      activeStatus.message.toLowerCase().includes("daily automated email sending limit reached"));
  if (summaryDismissed && !shouldShowPausedAfterSummary) return null;
  if (!forceSummary && !isPreview && !dismissedStatusLoaded && !activeStatus.running && activeStatus.phase !== "blocked") return null;

  const showPausedTopBar = !activeStatus.running && (activeStatus.phase === "blocked" || (summaryDismissed && shouldShowPausedAfterSummary));
  const statusLabel = activeStatus.running ? "Automation running" : showPausedTopBar ? "Automation paused" : activeStatus.phase === "done" ? "Automation done" : "Automation paused";

  async function cancelAutomation() {
    setCanceling(true);
    try {
      const response = await fetch("/api/automation/cancel", { method: "POST" });
      if (!response.ok) {
        showSnackbar("Unable to cancel automation.", "error");
        return;
      }
      const payload = (await response.json()) as AutomationStatus;
      setStatus({ ...payload, running: false, phase: "disabled", message: "Automatic email sending is disabled." });
      setForcedSummaryKey(null);
      lastRunningStartedAtRef.current = null;
      window.dispatchEvent(new Event(automationDisabledEventName));
      window.requestAnimationFrame(() => {
        showSnackbar("Automation canceled. Automatic email sending is now disabled.");
      });
    } finally {
      setCanceling(false);
    }
  }

  function dismissStatus() {
    if (isPreview) {
      setPreviewStatus(null);
      return;
    }
    setForcedSummaryKey(null);
    window.localStorage.setItem(dismissedStatusStorageKey, statusKey);
    setDismissedStatusKey(statusKey);
  }

  const finishedSummary = !activeStatus.running && activeStatus.phase !== "blocked" && !summaryDismissed ? (
    <div className="modal-backdrop automation-summary-backdrop" role="presentation" onClick={dismissStatus}>
      <div className="modal automation-summary-modal" role="dialog" aria-modal="true" aria-labelledby="automation-summary-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header automation-summary-header">
          <span className={`automation-summary-success-icon status-${activeStatus.phase}`} aria-hidden="true">
            {activeStatus.phase === "done" ? <Check size={30} /> : <AlertTriangle size={30} />}
          </span>
          <div>
            <h2 id="automation-summary-title">{statusLabel}</h2>
            <p>{activeStatus.message}</p>
          </div>
        </div>
        <div className="automation-summary-body">
          <AutomationSummaryCard icon={MailCheck} label="Emails sent" value={sentCount} />
          <AutomationSummaryCard icon={Target} label="Target Email" value={activeStatus.target} />
          <AutomationSummaryCard icon={FileText} label="Articles crawled" value={activeStatus.crawled} />
          <AutomationSummaryCard icon={FileText} label="Articles analyzed" value={activeStatus.analyzed} />
        </div>
        <div className="modal-footer automation-summary-actions">
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
      {activeStatus.running || showPausedTopBar ? (
        <div className={`automation-status-bar status-${showPausedTopBar ? "blocked" : activeStatus.phase}`} role="status">
          <span className="automation-status-dot" aria-hidden="true" />
          <span className="automation-status-main">{statusLabel}</span>
          <span className="automation-status-message">{activeStatus.message}</span>
          <span className="automation-status-metrics">
            Sent {sentCount}/{activeStatus.target}{isTestRun ? "" : " today"} - Cycle {activeStatus.iteration}
          </span>
          {!isPreview && activeStatus.running ? (
            <button className="automation-status-ok" type="button" onClick={cancelAutomation} disabled={canceling}>
              {canceling ? "Canceling..." : "Cancel automation"}
            </button>
          ) : null}
          {!showPausedTopBar ? (
            <button className="automation-status-close" type="button" onClick={dismissStatus} aria-label="Close automation status bar">
              <X size={16} />
            </button>
          ) : null}
        </div>
      ) : null}
      {finishedSummary}
    </>
  );
}

function getStatusSentCount(status: AutomationStatus) {
  const isTestRun = status.message.toLowerCase().includes("test automation") || status.message.toLowerCase().includes("test automatic");
  return isTestRun ? status.emailsSent : status.sentToday;
}

function getAutomationStatusKey(status: AutomationStatus) {
  return `${status.startedAt ?? "no-start"}:${status.phase}:${status.message}:${status.iteration}:${getStatusSentCount(status)}:${status.target}`;
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
