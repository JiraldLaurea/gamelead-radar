"use client";

import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import { LoadingForm } from "@/components/loading-form";

type AutomationStatus = {
  running: boolean;
  phase: string;
};

export function AutomationTestEmailForm() {
  const [status, setStatus] = useState<AutomationStatus | null>(null);

  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const response = await fetch("/api/automation/status", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as AutomationStatus;
        if (active) setStatus(payload);
      } catch {
        // Keep the button usable if status polling fails.
      }
    }

    refresh();
    const interval = window.setInterval(refresh, 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const disabled = Boolean(status?.running);

  return (
    <LoadingForm action="/api/automation/test-email" loadingLabel="Testing email automation">
      <button className="button secondary" type="submit" disabled={disabled} title={disabled ? "Automation is already running." : undefined}>
        <Send size={16} /> Test automatic email sending
      </button>
    </LoadingForm>
  );
}
