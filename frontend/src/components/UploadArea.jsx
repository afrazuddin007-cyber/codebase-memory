import { useRef } from "react";

const ALLOWED_EXTENSIONS = [
  ".py", ".js", ".jsx", ".ts", ".tsx",
  ".java", ".cpp", ".c", ".cc", ".h", ".hpp",
  ".go", ".rs", ".sql", ".rb", ".php", ".cs"
];

const EXT_TO_LANG = {
  ".py": "Python",
  ".js": "JavaScript",
  ".jsx": "React JSX",
  ".ts": "TypeScript",
  ".tsx": "React TSX",
  ".java": "Java",
  ".cpp": "C++",
  ".c": "C",
  ".cc": "C++",
  ".h": "C/C++ Header",
  ".hpp": "C++ Header",
  ".go": "Go",
  ".rs": "Rust",
  ".sql": "SQL",
  ".rb": "Ruby",
  ".php": "PHP",
  ".cs": "C#"
};

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  return (bytes / 1024).toFixed(1) + " KB";
}

export default function UploadArea({ files, onFilesChange }) {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    addFiles(selected);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addFiles = (newFiles) => {
    const valid = newFiles.filter((f) => {
      const ext = "." + f.name.split(".").pop().toLowerCase();
      return ALLOWED_EXTENSIONS.includes(ext);
    });

    const filePromises = valid.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const ext = "." + file.name.split(".").pop().toLowerCase();
          resolve({
            name: file.name,
            size: file.size,
            lines: (e.target.result.match(/\n/g) || []).length + 1,
            content: e.target.result,
            lang: EXT_TO_LANG[ext] || "",
          });
        };
        reader.readAsText(file);
      });
    });

    Promise.all(filePromises).then((loaded) => {
      // Avoid duplicate filenames
      const existingNames = new Set(files.map((f) => f.name));
      const filtered = loaded.filter((f) => !existingNames.has(f.name));
      onFilesChange([...files, ...filtered]);
    });
  };

  const handleRemove = (index) => {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files || []);
    addFiles(dropped);
  };

  return (
    <div className="cm-upload-section">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ALLOWED_EXTENSIONS.join(",")}
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />

      {/* Drag & Drop Area */}
      <div
        className="cm-upload-dropzone"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="cm-upload-dropzone__content">
          <span className="cm-upload-dropzone__label">
            Click to upload or drag and drop source files
          </span>
          <span className="cm-upload-dropzone__hint">
            Supported: .py, .js, .jsx, .ts, .tsx, .java, .cpp, .c, .go, .rs, .sql
          </span>
        </div>
      </div>

      {/* Selected Files List */}
      {files.length > 0 && (
        <div className="cm-upload-selected">
          <div className="cm-upload-selected__header">
            <span>SELECTED FILES ({files.length})</span>
            <button
              type="button"
              className="cm-btn-text"
              onClick={() => onFilesChange([])}
            >
              Clear all
            </button>
          </div>

          <div className="cm-upload-selected__list">
            {files.map((file, i) => (
              <div key={i} className="cm-upload-file-row">
                <div className="cm-upload-file-info">
                  <span className="cm-upload-file-name">{file.name}</span>
                  <span className="cm-upload-file-meta">
                    {file.lang ? `${file.lang} · ` : ""}{formatBytes(file.size)} · {file.lines} lines
                  </span>
                </div>
                <button
                  type="button"
                  className="cm-upload-file-remove"
                  onClick={() => handleRemove(i)}
                  title="Remove file"
                  aria-label={`Remove ${file.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
