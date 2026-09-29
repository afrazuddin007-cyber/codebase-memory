function getSeverityClass(severity) {
  if (!severity) return "low";
  const s = severity.toUpperCase();
  if (s.includes("HIGH") || s.includes("CRITICAL")) return "high";
  if (s.includes("MED")) return "medium";
  return "low";
}

export default function Findings({ findings, noConfirmedIssues }) {
  // Zero-findings: compact single-line banner
  if (noConfirmedIssues || findings.length === 0) {
    return (
      <div className="cm-findings-section">
        <div className="cm-findings-header">
          <span className="cm-block-eyebrow cm-block-eyebrow--success">
            ✓ NO CONFIRMED ISSUES
          </span>
        </div>
        <p className="cm-no-issues-line">
          The submitted change was reviewed against available repository context and team memory.
        </p>
      </div>
    );
  }

  return (
    <div className="cm-findings-section">
      <div className="cm-findings-header">
        <span className="cm-block-eyebrow cm-block-eyebrow--warning">
          ⚠ {findings.length} FINDING{findings.length > 1 ? "S" : ""}
        </span>
      </div>

      <div className="cm-findings-list">
        {findings.map((f, idx) => {
          const sev = getSeverityClass(f.severity);

          return (
            <div key={idx} className={`cm-finding-card cm-finding-card--${sev}`}>
              {/* Meta row: index, severity, classification, file */}
              <div className="cm-finding-card__meta">
                <span className="cm-finding-card__index">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className={`cm-finding-badge cm-finding-badge--${sev}`}>
                  {f.severity || "LOW"}
                </span>
                {f.classification && (
                  <span className="cm-finding-badge cm-finding-badge--class">
                    {f.classification}
                  </span>
                )}
                {f.file && (
                  <span className="cm-finding-card__file cm-font-mono">
                    {f.file}{f.line ? ` · line ${f.line}` : ""}
                  </span>
                )}
              </div>

              {/* Title if present */}
              {f.title && (
                <h4 className="cm-finding-card__title">{f.title}</h4>
              )}

              {/* Explanation — primary content, always visible */}
              {f.explanation && (
                <p className="cm-finding-card__explanation">{f.explanation}</p>
              )}

              {/* Evidence — visible when present */}
              {f.evidence && (
                <div className="cm-finding-card__block">
                  <span className="cm-finding-card__label">EVIDENCE</span>
                  <pre className="cm-finding-card__code">{f.evidence}</pre>
                </div>
              )}

              {/* Why It Matters — visible when present */}
              {f.whyItMatters && (
                <div className="cm-finding-card__block">
                  <span className="cm-finding-card__label">WHY IT MATTERS</span>
                  <p className="cm-finding-card__text">{f.whyItMatters}</p>
                </div>
              )}

              {/* Recommended Action — visible when present */}
              {f.suggestedAction && (
                <div className="cm-finding-card__block">
                  <span className="cm-finding-card__label">RECOMMENDED ACTION</span>
                  <p className="cm-finding-card__text cm-finding-card__text--action">
                    {f.suggestedAction}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
