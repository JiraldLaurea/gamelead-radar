"use client";

import type { CSSProperties, FormEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import { showSnackbar, storePendingSnackbar, type SnackbarType } from "@/lib/snackbar-events";

type LoadingFormProps = {
  action: string;
  children: ReactNode;
  className?: string;
  id?: string;
  loadingLabel?: string;
  method?: "post";
  style?: CSSProperties;
};

type LoadingState = {
  label: string;
  error?: string;
};

export function LoadingForm({ action, children, className, id, loadingLabel = "Working", method = "post", style }: LoadingFormProps) {
  const [loading, setLoading] = useState<LoadingState | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | HTMLInputElement | null;
    const label = submitter?.dataset.loadingLabel ?? loadingLabel;
    const formData = new FormData(form);

    if (submitter?.name && !formData.has(submitter.name)) {
      formData.append(submitter.name, submitter.value);
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading({ label });

    try {
      const response = await fetch(action, {
        method,
        body: formData,
        signal: controller.signal
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body.slice(0, 240) || `Request failed with HTTP ${response.status}`);
      }

      if (response.redirected) {
        const snackbar = snackbarForRedirect(response.url, label);
        storePendingSnackbar(snackbar.message, snackbar.type);
        window.location.assign(response.url);
        return;
      }

      storePendingSnackbar(finishedMessage(label));
      window.location.reload();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setLoading(null);
        return;
      }
      const message = error instanceof Error ? error.message : "The request failed. Please try again.";
      showSnackbar(message, "error");
      setLoading({ label, error: message });
    } finally {
      abortRef.current = null;
    }
  }

  function cancel() {
    abortRef.current?.abort();
    setLoading(null);
  }

  return (
    <>
      <form action={action} className={className} id={id} method={method} onSubmit={handleSubmit} style={style}>
        {children}
      </form>
      {loading ? (
        <div className="loading-backdrop" role="presentation">
          <div className="loading-modal" role="alertdialog" aria-modal="true" aria-label={loading.error ? "Action failed" : loading.label}>
            {loading.error ? (
              <>
                <div className="loading-modal-body">
                  <h2>Something went wrong</h2>
                  <p className="loading-error">{loading.error}</p>
                </div>
                <div className="modal-footer loading-modal-actions">
                  <button className="button" type="button" onClick={() => setLoading(null)}>
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="loading-modal-body">
                  <LoadingSpinner />
                  <h2>{loading.label}</h2>
                  <p>Please wait while the system finishes this action.</p>
                </div>
                <div className="modal-footer loading-modal-actions">
                  <button className="button secondary" type="button" onClick={cancel}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function LoadingSpinner() {
  return <span className="loading-spinner" aria-hidden="true" />;
}

function finishedMessage(label: string) {
  return `${label.replace(/\.+$/, "")} finished.`;
}

function snackbarForRedirect(url: string, label: string): { message: string; type: SnackbarType } {
  const fallback = { message: finishedMessage(label), type: "success" as const };

  try {
    const params = new URL(url).searchParams;
    const providerResult = params.get("serper") ?? params.get("serpapi") ?? params.get("googleSearch");
    if (providerResult) {
      const provider = params.has("googleSearch") ? "Google Search" : params.has("serpapi") ? "SerpAPI" : "Serper";
      if (providerResult === "success") return { message: `${provider} connection test succeeded.`, type: "success" };
      if (providerResult === "empty") return { message: `${provider} responded, but returned no results.`, type: "error" };
      if (providerResult === "missing") return { message: `${provider} API key is missing.`, type: "error" };
      if (providerResult === "failed") return { message: `${provider} test failed.`, type: "error" };
    }

    if (params.get("operations") === "saved") return { message: "Operations settings saved successfully.", type: "success" };
    if (params.get("debug") === "saved") return { message: "Debug settings saved successfully.", type: "success" };
    if (params.get("testEmail") === "started") return { message: "Test automatic email sending started.", type: "success" };
    if (params.get("testData") === "success") return { message: "Grade A test lead added.", type: "success" };
    if (params.get("testData") === "exists") return { message: "The Grade A sample lead already exists.", type: "error" };
    if (params.get("reset") === "success") return { message: "Collected data was reset successfully.", type: "success" };
    if (params.get("reset") === "invalid") return { message: "Type RESET exactly before clearing collected data.", type: "error" };
    if (params.has("enriched")) return { message: `Enrichment finished for ${params.get("enriched")} lead(s).`, type: "success" };
    if (params.has("analyzed")) {
      const failed = params.get("analysisFailed");
      if (failed && failed !== "0") return { message: `Analyzed ${params.get("analyzed")} article(s), with ${failed} failure(s).`, type: "error" };
      return { message: `Analyzed ${params.get("analyzed")} article(s).`, type: "success" };
    }
  } catch {
    return fallback;
  }

  return fallback;
}
