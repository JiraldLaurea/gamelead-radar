"use client";

export type SnackbarType = "success" | "error";

export type SnackbarPayload = {
  message: string;
  type?: SnackbarType;
};

export const pendingSnackbarStorageKey = "gamelead-pending-snackbar";
export const snackbarEventName = "gamelead-snackbar";
export const automationDisabledEventName = "gamelead-automation-disabled";

export function showSnackbar(message: string, type: SnackbarType = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<SnackbarPayload>(snackbarEventName, { detail: { message, type } }));
}

export function storePendingSnackbar(message: string, type: SnackbarType = "success") {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(pendingSnackbarStorageKey, JSON.stringify({ message, type }));
}
