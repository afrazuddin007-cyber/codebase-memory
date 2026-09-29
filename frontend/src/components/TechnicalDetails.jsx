import { useState } from "react";

export default function TechnicalDetails({ rawOutput }) {
  const [open, setOpen] = useState(false);

  if (!rawOutput) return null;

  return (
    <div className="cm-technical-details-section">
      <div className="cm-technical-details-card">
        <button
          type="button"
          className="cm-technical-details-toggle"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
        >
          <span>TECHNICAL DETAILS</span>
          <span className={`cm-technical-chevron ${open ? "cm-technical-chevron--open" : ""}`}>
            ▾
          </span>
        </button>

        {open && (
          <div className="cm-technical-details-body cm-animate-in">
            <pre className="cm-technical-details-code">{rawOutput}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
