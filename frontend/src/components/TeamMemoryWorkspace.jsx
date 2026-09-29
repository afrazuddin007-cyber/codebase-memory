import { useState, useEffect } from "react";

function deduplicateMemories(memories) {
  const seen = new Set();
  return memories.filter((mem) => {
    const key = (mem.title || "").toLowerCase().trim() + "|" + (mem.type || "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function TeamMemoryWorkspace({ onBackToReview }) {
  const [memoryData, setMemoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/team-memory")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.memories) {
          setMemoryData(data);
        } else {
          setError(data.error || "Failed to load team memories");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const allMemories = memoryData ? memoryData.memories : [];
  const uniqueMemories = deduplicateMemories(allMemories);

  return (
    <div className="cm-workspace-container cm-animate-in">
      <div className="cm-workspace-intro">
        <div className="cm-workspace-intro__top">
          <div>
            <h1 className="cm-intro-title">
              {memoryData ? memoryData.bank_id : "codebase-memory"}
            </h1>
            <p className="cm-intro-sub">
              Historical engineering decisions from Hindsight.
              {uniqueMemories.length > 0 && (
                <span>
                  {" "}{uniqueMemories.length} unique decision{uniqueMemories.length > 1 ? "s" : ""}
                  {allMemories.length > uniqueMemories.length && (
                    <span> ({allMemories.length} total, deduplicated)</span>
                  )}
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            className="cm-btn-secondary cm-btn-sm"
            onClick={onBackToReview}
          >
            Back to Review
          </button>
        </div>
      </div>

      {loading && (
        <div className="cm-progress-bar">
          <p className="cm-intro-sub">Connecting to Hindsight memory bank...</p>
        </div>
      )}

      {error && (
        <div className="cm-error-card">
          <span className="cm-error-badge">ERROR</span>
          <p className="cm-error-message">{error}</p>
        </div>
      )}

      {!loading && memoryData && (
        <div className="cm-memory-grid">
          {uniqueMemories.map((mem) => {
            const isAccepted = mem.type === "accepted";
            return (
              <div
                key={mem.id}
                className={`cm-memory-card ${
                  isAccepted ? "cm-memory-card--accepted" : "cm-memory-card--rejected"
                }`}
              >
                <div className="cm-memory-card__header">
                  <span
                    className={`cm-memory-card__badge ${
                      isAccepted
                        ? "cm-memory-card__badge--accepted"
                        : "cm-memory-card__badge--rejected"
                    }`}
                  >
                    {isAccepted ? "ACCEPTED PATTERN" : "REJECTED APPROACH"}
                  </span>
                  <span className="cm-memory-card__repo cm-font-mono">
                    {memoryData.repository}
                  </span>
                </div>

                <h3 className="cm-memory-card__title">{mem.title}</h3>
                <p className="cm-memory-card__text">{mem.text}</p>

                <div className="cm-memory-card__footer">
                  <span className="cm-memory-card__rule">
                    {isAccepted
                      ? "Review Rule: Do not flag direct database instantiation as an anti-pattern."
                      : "Review Rule: Do not recommend dependency injection frameworks for this service."}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
