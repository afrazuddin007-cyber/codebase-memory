const STAGES = [
  { id: 1, num: "01", label: "Source Changes" },
  { id: 2, num: "02", label: "Repository Context" },
  { id: 3, num: "03", label: "Hindsight Memory" },
  { id: 4, num: "04", label: "AI Review" },
];

export default function AnalysisProgress({ activeStage }) {
  const isAllComplete = activeStage > 4;

  if (isAllComplete) {
    return (
      <div className="cm-progress-bar cm-progress-bar--complete cm-animate-in">
        <span className="cm-progress-complete-badge">✓ REVIEW COMPLETE</span>
      </div>
    );
  }

  return (
    <div className="cm-progress-bar cm-animate-in">
      <div className="cm-progress-bar__track">
        {STAGES.map((s, idx) => {
          const isDone = s.id < activeStage;
          const isCurrent = s.id === activeStage;

          return (
            <div key={s.id} className="cm-progress-step">
              {idx > 0 && (
                <div
                  className={`cm-progress-connector ${
                    isDone ? "cm-progress-connector--filled" : ""
                  }`}
                />
              )}
              <div
                className={`cm-progress-dot ${
                  isDone
                    ? "cm-progress-dot--done"
                    : isCurrent
                    ? "cm-progress-dot--current"
                    : "cm-progress-dot--pending"
                }`}
              >
                {isDone ? "✓" : isCurrent ? "●" : "○"}
              </div>
              <span
                className={`cm-progress-label ${
                  isDone
                    ? "cm-progress-label--done"
                    : isCurrent
                    ? "cm-progress-label--current"
                    : ""
                }`}
              >
                {s.num} {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
