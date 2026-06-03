"use client";

import { HelpCircle, X } from "lucide-react";
import { useState } from "react";

type HelpItem = {
  label: string;
  description: string;
};

export function HelpModal({
  title,
  items,
  buttonLabel = "Help"
}: {
  title: string;
  items: HelpItem[];
  buttonLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="button secondary help-button" type="button" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <HelpCircle size={16} /> {buttonLabel}
      </button>
      {open ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>{title}</h2>
              <button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="Close help">
                <X size={18} />
              </button>
            </div>
            <div className="help-list">
              {items.map((item) => (
                <div className="help-row" key={item.label}>
                  <strong>{item.label}</strong>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
