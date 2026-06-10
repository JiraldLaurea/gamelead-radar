"use client";

import { Eye } from "lucide-react";

export function AutomationStatusPreviewButton() {
  return (
    <button
      className="button secondary"
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("gamelead-preview-automation-status"))}
    >
      <Eye size={16} /> Test top bar
    </button>
  );
}
