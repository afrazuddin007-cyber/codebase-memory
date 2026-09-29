import UploadArea from "./UploadArea";
import PasteCode from "./PasteCode";

export default function CodeInput({
  sourceMode,
  onSourceModeChange,
  files,
  onFilesChange,
  pastedFilename,
  onPastedFilenameChange,
  pastedLanguage,
  onPastedLanguageChange,
  pastedCode,
  onPastedCodeChange,
  reviewScope,
  onReviewScopeChange,
  useMemory,
  onUseMemoryChange,
  onRunReview,
  loading,
}) {
  const isSubmitDisabled =
    loading ||
    (sourceMode === "upload" && files.length === 0) ||
    (sourceMode === "paste" && !pastedCode.trim());

  return (
    <div className="cm-workspace-card">
      {/* Toolbar: source mode toggle + submit button on one row */}
      <div className="cm-workspace-card__toolbar">
        <div className="cm-segmented-control" role="tablist">
          <button
            type="button"
            className={`cm-segmented-btn ${sourceMode === "git" ? "cm-segmented-btn--active" : ""}`}
            onClick={() => onSourceModeChange("git")}
            role="tab"
            aria-selected={sourceMode === "git"}
          >
            Git Changes
          </button>
          <button
            type="button"
            className={`cm-segmented-btn ${sourceMode === "upload" ? "cm-segmented-btn--active" : ""}`}
            onClick={() => onSourceModeChange("upload")}
            role="tab"
            aria-selected={sourceMode === "upload"}
          >
            Upload Files
          </button>
          <button
            type="button"
            className={`cm-segmented-btn ${sourceMode === "paste" ? "cm-segmented-btn--active" : ""}`}
            onClick={() => onSourceModeChange("paste")}
            role="tab"
            aria-selected={sourceMode === "paste"}
          >
            Paste Code
          </button>
        </div>

        <button
          type="button"
          className="cm-btn-primary"
          onClick={onRunReview}
          disabled={isSubmitDisabled}
        >
          {loading ? "RUNNING..." : "RUN CODE REVIEW"}
        </button>
      </div>

      {/* Source-specific body */}
      <div className="cm-workspace-card__body">
        {/* Source: Git */}
        {sourceMode === "git" && (
          <div className="cm-git-chip-strip">
            <span className="cm-chip">
              <span className="cm-chip__label">REPOSITORY</span>
              <span className="cm-chip__value">payments-api</span>
            </span>
            <span className="cm-chip">
              <span className="cm-chip__label">TARGET</span>
              <span className="cm-chip__value">Working Directory (Git Diff HEAD)</span>
            </span>
            <span className="cm-chip">
              <span className="cm-chip__label">BASE</span>
              <span className="cm-chip__value">main</span>
            </span>
          </div>
        )}

        {/* Source: Upload */}
        {sourceMode === "upload" && (
          <UploadArea files={files} onFilesChange={onFilesChange} />
        )}

        {/* Source: Paste */}
        {sourceMode === "paste" && (
          <PasteCode
            filename={pastedFilename}
            onFilenameChange={onPastedFilenameChange}
            language={pastedLanguage}
            onLanguageChange={onPastedLanguageChange}
            code={pastedCode}
            onCodeChange={onPastedCodeChange}
          />
        )}
      </div>

      {/* Footer: scope pills */}
      <div className="cm-workspace-card__footer">
        <div className="cm-scope-pills">
          <span className="cm-scope-label">REVIEW SCOPE</span>
          {[
            { value: "changes", label: "Current changes" },
            { value: "full", label: "Full file" },
            { value: "context", label: "Repository context" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`cm-scope-pill ${reviewScope === opt.value ? "cm-scope-pill--active" : ""}`}
              onClick={() => onReviewScopeChange(opt.value)}
              aria-pressed={reviewScope === opt.value}
            >
              {opt.label}
            </button>
          ))}

          <span className="cm-scope-divider">|</span>

          <span className="cm-scope-label">TEAM MEMORY</span>
          <button
            type="button"
            className={`cm-memory-toggle-pill ${useMemory ? "cm-memory-toggle-pill--active" : "cm-memory-toggle-pill--bypassed"}`}
            onClick={() => onUseMemoryChange(!useMemory)}
            title={useMemory ? "Hindsight team memory is active. Review respects historical engineering decisions." : "Hindsight team memory is bypassed. Generates standard generic review without team history."}
            aria-pressed={useMemory}
          >
            {useMemory ? "● Memory: Active" : "○ Memory: Bypassed"}
          </button>
        </div>
      </div>
    </div>
  );
}
