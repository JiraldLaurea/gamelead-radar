"use client";

import { useCallback, useEffect, useState } from "react";
import { pendingSnackbarStorageKey, snackbarEventName, type SnackbarPayload } from "@/lib/snackbar-events";
import { Snackbar } from "./snackbar";

export function SnackbarHost() {
  const [snackbar, setSnackbar] = useState<SnackbarPayload | null>(null);

  const dismiss = useCallback(() => setSnackbar(null), []);

  useEffect(() => {
    const pending = window.sessionStorage.getItem(pendingSnackbarStorageKey);
    if (pending) {
      window.sessionStorage.removeItem(pendingSnackbarStorageKey);
      try {
        const payload = JSON.parse(pending) as SnackbarPayload;
        if (payload.message) setSnackbar({ message: payload.message, type: payload.type ?? "success" });
      } catch {
        // Ignore malformed session data; snackbars are helpful, not critical.
      }
    }

    function onSnackbar(event: Event) {
      const payload = (event as CustomEvent<SnackbarPayload>).detail;
      if (payload?.message) setSnackbar({ message: payload.message, type: payload.type ?? "success" });
    }

    window.addEventListener(snackbarEventName, onSnackbar);
    return () => window.removeEventListener(snackbarEventName, onSnackbar);
  }, []);

  return snackbar ? <Snackbar message={snackbar.message} type={snackbar.type} onDismiss={dismiss} /> : null;
}
