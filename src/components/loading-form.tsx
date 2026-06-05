"use client";

import type { CSSProperties, FormEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import { X } from "lucide-react";

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
        window.location.assign(response.url);
        return;
      }

      window.location.reload();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setLoading(null);
        return;
      }
      const message = error instanceof Error ? error.message : "The request failed. Please try again.";
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
            <div className="loading-modal-header">
              <h2>{loading.error ? "Something went wrong" : loading.label}</h2>
              <button className="icon-button" type="button" onClick={cancel} aria-label="Cancel request">
                <X size={18} />
              </button>
            </div>
            {loading.error ? (
              <>
                <p className="loading-error">{loading.error}</p>
                <button className="button" type="button" onClick={() => setLoading(null)}>
                  Close
                </button>
              </>
            ) : (
              <>
                <div className="loading-spinner" aria-hidden="true" />
                <p>Please wait while the system finishes this action.</p>
                <div className="loading-modal-actions">
                  <button className="button secondary" type="button" onClick={cancel}>
                    <X size={16} /> Cancel
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
