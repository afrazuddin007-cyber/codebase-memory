import { useState, useEffect } from "react";

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  return (bytes / 1024).toFixed(1) + " KB";
}

export default function RepositoryWorkspace({ onReviewFile }) {
  const [repoData, setRepoData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/repository")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.files) {
          setRepoData(data);
          if (data.files.length > 0) {
            setSelectedFile(data.files[0]);
          }
        } else {
          setError(data.error || "Failed to load repository files");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="cm-workspace-container cm-animate-in">
      <div className="cm-workspace-intro">
        <h1 className="cm-intro-title">
          {repoData ? repoData.repository : "payments-api"}
        </h1>
        <p className="cm-intro-sub">
          Codebase files automatically analyzed during code review.
        </p>
      </div>

      {loading && (
        <div className="cm-progress-bar">
          <p className="cm-intro-sub">Loading repository files...</p>
        </div>
      )}

      {error && (
        <div className="cm-error-card">
          <span className="cm-error-badge">ERROR</span>
          <p className="cm-error-message">{error}</p>
        </div>
      )}

      {!loading && repoData && (
        <div className="cm-repo-explorer">
          {/* File sidebar */}
          <div className="cm-repo-sidebar">
            <div className="cm-repo-sidebar__header">
              FILES ({repoData.files.length})
            </div>
            <div className="cm-repo-sidebar__list">
              {repoData.files.map((file, i) => (
                <button
                  key={i}
                  type="button"
                  className={`cm-repo-file-item ${
                    selectedFile?.name === file.name ? "cm-repo-file-item--active" : ""
                  } ${i % 2 === 1 ? "cm-repo-file-item--alt" : ""}`}
                  onClick={() => setSelectedFile(file)}
                >
                  <span className="cm-repo-file-name cm-font-mono">{file.name}</span>
                  <span className="cm-repo-file-meta">
                    {formatBytes(file.size)} · {file.lines}L
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Code viewer */}
          <div className="cm-repo-viewer">
            {selectedFile ? (
              <>
                <div className="cm-repo-viewer__header">
                  <div className="cm-repo-viewer__info">
                    <span className="cm-repo-viewer__path cm-font-mono">
                      {selectedFile.path}
                    </span>
                    <span className="cm-repo-viewer__badge">
                      {selectedFile.lines} lines · {formatBytes(selectedFile.size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="cm-btn-secondary cm-btn-sm"
                    onClick={() => onReviewFile(selectedFile)}
                  >
                    Review This File
                  </button>
                </div>

                <div className="cm-repo-viewer__code">
                  <pre className="cm-code-display">
                    {selectedFile.content.split("\n").map((line, idx) => (
                      <div key={idx} className="cm-code-line">
                        <span className="cm-code-line-num">{idx + 1}</span>
                        <span className="cm-code-line-text">{line || " "}</span>
                      </div>
                    ))}
                  </pre>
                </div>
              </>
            ) : (
              <div className="cm-repo-viewer__empty">
                Select a file to inspect its source code.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
