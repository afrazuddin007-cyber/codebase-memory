import { useState } from "react";

export default function ChangedFiles({ changedFiles, fileDiffs, sourceMode }) {
  const [expandedFile, setExpandedFile] = useState(null);

  if (!changedFiles || changedFiles.length === 0) return null;

  const isGit = sourceMode === "git";
  const sectionTitle = isGit ? "CHANGED FILES" : "SUBMITTED FILES";

  const toggleFile = (fileName) => {
    setExpandedFile((prev) => (prev === fileName ? null : fileName));
  };

  return (
    <div className="cm-changed-files-section">
      <span className="cm-block-eyebrow">{sectionTitle}</span>

      <div className="cm-changed-files-table">
        {changedFiles.map((file, idx) => {
          const hasDiff = fileDiffs && fileDiffs[file.name];
          const isExpanded = expandedFile === file.name;

          return (
            <div key={idx} className="cm-changed-file-entry">
              <div className="cm-changed-file-row">
                <span className="cm-changed-file-name cm-font-mono">
                  {file.name}
                </span>

                <div className="cm-changed-file-actions">
                  {/* Only show MODIFIED badge for Git reviews */}
                  {isGit && (
                    <span className="cm-changed-file-status">
                      {file.status || "MODIFIED"}
                    </span>
                  )}
                  {hasDiff && (
                    <button
                      type="button"
                      className="cm-btn-text"
                      onClick={() => toggleFile(file.name)}
                    >
                      {isExpanded ? "Hide diff" : "View diff"}
                    </button>
                  )}
                </div>
              </div>

              {/* Real diff view if available */}
              {isExpanded && hasDiff && (
                <div className="cm-file-diff-view cm-animate-in">
                  <pre className="cm-diff-code">{fileDiffs[file.name]}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
