import { useState } from "react";

function deduplicateMemories(memories) {
  const seen = [];
  return memories.filter((mem) => {
    const clean = mem
      .toLowerCase()
      .replace(/^[-*•\d\.\)]\s*/, "")
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!clean) return false;
    const isDuplicate = seen.some((prev) => {
      return prev === clean || prev.includes(clean.slice(0, 45)) || clean.includes(prev.slice(0, 45));
    });
    if (isDuplicate) return false;
    seen.push(clean);
    return true;
  });
}

export default function ContextSummary({ contextData }) {
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  if (!contextData) return null;

  const repoFiles = contextData.repoFiles || [];
  const rawMemories = contextData.teamMemories || [];
  const teamMemories = deduplicateMemories(rawMemories);
  const appliedDecisions = contextData.appliedDecisions || [];
  const impactOnReview = contextData.impactOnReview || "";

  if (repoFiles.length === 0 && teamMemories.length === 0) return null;

  const hasMemoryImpact = appliedDecisions.length > 0 || (impactOnReview && !impactOnReview.toLowerCase().includes("none applied"));

  return (
    <div className="cm-context-section">
      <div className="cm-context-header">
        <span className="cm-block-eyebrow">CONTEXT USED</span>
        {(teamMemories.length > 0 || repoFiles.length > 3) && (
          <button
            type="button"
            className="cm-btn-text"
            onClick={() => setDetailsExpanded((prev) => !prev)}
            aria-expanded={detailsExpanded}
          >
            {detailsExpanded ? "Hide details" : "View details"}
          </button>
        )}
      </div>

      <div className="cm-context-summary-grid">
        {/* Repository Context */}
        {repoFiles.length > 0 && (
          <div className="cm-context-summary-card">
            <div className="cm-context-summary-top">
              <span className="cm-context-summary-title">Repository Files</span>
              <span className="cm-context-summary-count">
                {repoFiles.length}
              </span>
            </div>
            <div className="cm-context-file-tags">
              {repoFiles.slice(0, detailsExpanded ? repoFiles.length : 4).map((file, i) => (
                <span key={i} className="cm-context-file-tag cm-font-mono">
                  {file}
                </span>
              ))}
              {!detailsExpanded && repoFiles.length > 4 && (
                <span className="cm-context-file-tag cm-context-file-tag--more">
                  +{repoFiles.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Team Memory Context */}
        {teamMemories.length > 0 && (
          <div className="cm-context-summary-card">
            <div className="cm-context-summary-top">
              <span className="cm-context-summary-title">Hindsight Memory Used</span>
              <span className="cm-context-summary-count">
                {rawMemories.length} relevant memor{rawMemories.length === 1 ? "y" : "ies"} · {teamMemories.length} unique decision{teamMemories.length === 1 ? "" : "s"}
              </span>
            </div>
            <p className="cm-context-memory-preview">
              {teamMemories[0].length > 120
                ? teamMemories[0].slice(0, 120) + "..."
                : teamMemories[0]}
            </p>
          </div>
        )}
      </div>

      {/* Applied Team Decision & Impact on Review (Hindsight Highlight) */}
      {hasMemoryImpact && (
        <div className="cm-memory-impact-card cm-animate-in">
          <div className="cm-memory-impact-header">
            <span className="cm-memory-impact-tag">HINDSIGHT MEMORY APPLIED</span>
            <span className="cm-memory-impact-desc">Context-Aware AI Review</span>
          </div>
          {appliedDecisions.length > 0 && (
            <div className="cm-memory-impact-row">
              <span className="cm-memory-impact-label">APPLIED TEAM DECISION</span>
              <p className="cm-memory-impact-text">{appliedDecisions[0]}</p>
            </div>
          )}
          {impactOnReview && (
            <div className="cm-memory-impact-row">
              <span className="cm-memory-impact-label">IMPACT ON REVIEW</span>
              <p className="cm-memory-impact-text cm-memory-impact-text--highlight">
                {impactOnReview}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Expanded Details */}
      {detailsExpanded && (
        <div className="cm-context-details cm-animate-in">
          {teamMemories.length > 0 && (
            <div className="cm-context-details-group">
              <span className="cm-context-details-subtitle">Applied Team Decisions</span>
              <ul className="cm-context-memory-list">
                {teamMemories.map((mem, idx) => (
                  <li key={idx}>{mem}</li>
                ))}
              </ul>
            </div>
          )}

          {contextData.generalNotes && contextData.generalNotes.length > 0 && (
            <div className="cm-context-details-group">
              <span className="cm-context-details-subtitle">Context Notes</span>
              {contextData.generalNotes.map((note, idx) => (
                <p key={idx} className="cm-context-note">
                  {note}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
