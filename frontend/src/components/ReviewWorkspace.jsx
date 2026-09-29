import CodeInput from "./CodeInput";
import AnalysisProgress from "./AnalysisProgress";
import ReviewResult from "./ReviewResult";

export default function ReviewWorkspace({
  sourceMode,
  setSourceMode,
  files,
  setFiles,
  pastedFilename,
  setPastedFilename,
  pastedLanguage,
  setPastedLanguage,
  pastedCode,
  setPastedCode,
  reviewScope,
  setReviewScope,
  useMemory,
  onUseMemoryChange,
  onRunReview,
  loading,
  activeStage,
  error,
  review,
  onRetry,
}) {
  return (
    <div className="cm-workspace-container">

      {/* Compact Intro — no eyebrow, single-line tagline */}
      <div className="cm-workspace-intro">
        <h1 className="cm-intro-title">
          Code review that remembers <em>why your team builds</em> the way it does.
        </h1>
        <p className="cm-intro-sub">
          Verify proposed code against complete repository context and historical engineering decisions.
        </p>
      </div>

      {/* Code Input Workspace */}
      <CodeInput
        sourceMode={sourceMode}
        onSourceModeChange={setSourceMode}
        files={files}
        onFilesChange={setFiles}
        pastedFilename={pastedFilename}
        onPastedFilenameChange={setPastedFilename}
        pastedLanguage={pastedLanguage}
        onPastedLanguageChange={setPastedLanguage}
        pastedCode={pastedCode}
        onCodeChange={setPastedCode}
        reviewScope={reviewScope}
        onReviewScopeChange={setReviewScope}
        useMemory={useMemory}
        onUseMemoryChange={onUseMemoryChange}
        onRunReview={onRunReview}
        loading={loading}
      />

      {/* Compact Progress */}
      {loading && (
        <AnalysisProgress activeStage={activeStage} />
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="cm-error-card cm-animate-in">
          <div className="cm-error-header">
            <span className="cm-error-badge">REVIEW COULD NOT BE COMPLETED</span>
            <button
              type="button"
              className="cm-btn-secondary cm-btn-sm"
              onClick={onRetry}
            >
              TRY AGAIN
            </button>
          </div>
          <p className="cm-error-message">
            The review service could not be reached.
          </p>
          <div className="cm-error-details">
            <pre className="cm-error-pre">{error}</pre>
          </div>
        </div>
      )}

      {/* Cohesive Review Result */}
      {!loading && review && (
        <ReviewResult rawOutput={review} sourceMode={sourceMode} />
      )}

    </div>
  );
}
