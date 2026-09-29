const SAMPLE_PAYMENT_CODE = `def process_payment(request):
    db = Database()
    payment = db.get_payment(request.id)

    if payment is None:
        return None

    payment.status = "complete"

    return payment`;

const LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "go", label: "Go" },
  { value: "java", label: "Java" },
  { value: "rust", label: "Rust" },
  { value: "cpp", label: "C++" },
  { value: "sql", label: "SQL" },
];

export default function PasteCode({
  filename,
  onFilenameChange,
  language,
  onLanguageChange,
  code,
  onCodeChange,
}) {
  const lineCount = code ? code.split("\n").length : 0;
  const charCount = code.length;

  const handleLoadSample = () => {
    onFilenameChange("payment.py");
    onLanguageChange("python");
    onCodeChange(SAMPLE_PAYMENT_CODE);
  };

  return (
    <div className="cm-paste-section">
      <div className="cm-paste-header">
        <div className="cm-paste-field">
          <label className="cm-paste-label">FILE NAME</label>
          <input
            type="text"
            className="cm-input"
            value={filename}
            onChange={(e) => onFilenameChange(e.target.value)}
            placeholder="e.g. payment.py"
          />
        </div>

        <div className="cm-paste-field">
          <label className="cm-paste-label">LANGUAGE</label>
          <select
            className="cm-select"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div className="cm-paste-actions">
          <button
            type="button"
            className="cm-btn-secondary cm-btn-sm"
            onClick={handleLoadSample}
          >
            Load Sample (payment.py)
          </button>
        </div>
      </div>

      <div className="cm-paste-editor">
        <textarea
          className="cm-textarea-code"
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          placeholder="// Paste source code to review here..."
          rows={12}
          spellCheck="false"
        />
        <div className="cm-paste-footer">
          <span>{lineCount} lines</span>
          <span>{charCount} characters</span>
        </div>
      </div>
    </div>
  );
}
