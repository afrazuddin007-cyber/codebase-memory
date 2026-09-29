import ReviewSummary from "./ReviewSummary";
import Findings from "./Findings";
import ContextSummary from "./ContextSummary";
import ChangedFiles from "./ChangedFiles";
import TechnicalDetails from "./TechnicalDetails";

// ============================================================
// STRIP MARKDOWN UTILITY
// ============================================================

function stripMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/```[a-zA-Z]*\n?/g, "")
    .replace(/```/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#+\s+/gm, "")
    .trim();
}

function cleanEvidence(text) {
  if (!text) return "";
  let clean = text
    .replace(/```[a-zA-Z]*\n?/g, "")
    .replace(/```/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .trim();

  // Strip leading bullets, "Line XX in ...:\" prefixes
  clean = clean.replace(/^[-*]\s+(?:Line\s+\d+[^:]*:\s*)?/i, "");
  clean = clean.replace(/^[-*]\s+/gm, "");
  clean = clean.replace(/^`+|`+$/g, "");
  return clean.trim();
}

// ============================================================
// EMPTY PHRASE DETECTOR
// ============================================================

const EMPTY_PATTERNS = [
  /^[-*\s]*none\.?$/i,
  /^[-*\s]*n\/a$/i,
  /^[-*\s]*no additional context required\.?$/i,
  /^[-*\s]*none identified\.?$/i,
  /^[-*\s]*no issues\.?$/i,
  /^[-*\s]*no confirmed issues found\.?$/i,
  /^[-*\s]*no immediate action required\.?$/i,
];

function isEmptySection(text) {
  if (!text || !text.trim()) return true;
  const trimmed = text.trim();
  return EMPTY_PATTERNS.some((pattern) => pattern.test(trimmed));
}

// ============================================================
// SECTION PARSER
// ============================================================

function parseSections(text) {
  const sections = {};
  if (!text) return sections;

  const lines = text.split("\n");
  let currentSection = null;
  let currentLines = [];

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)/);
    if (match) {
      if (currentSection !== null) {
        sections[currentSection] = currentLines.join("\n").trim();
      }
      currentSection = match[1].trim();
      currentLines = [];
    } else if (currentSection !== null) {
      currentLines.push(line);
    }
  }

  if (currentSection !== null) {
    sections[currentSection] = currentLines.join("\n").trim();
  }

  return sections;
}

// ============================================================
// PARSE FINDINGS
// ============================================================

function parseFindings(findingsText) {
  if (!findingsText || isEmptySection(findingsText)) return [];
  if (findingsText.toLowerCase().includes("no confirmed issues found")) return [];

  const blocks = findingsText
    .split(/^###\s+Finding(?:\s+\d+)?/mi)
    .filter((b) => b.trim());

  if (blocks.length === 0) return [];

  return blocks
    .map((block) => {
      const finding = {};
      const lines = block.split("\n");
      let currentKey = null;
      let currentValue = [];

      for (const line of lines) {
        const fieldMatch = line.match(/^[-*]?\s*\**([A-Za-z\s]+)\**:\**\s*(.*)/);
        if (fieldMatch) {
          if (currentKey) {
            finding[currentKey] = currentValue.join("\n").trim();
          }
          currentKey = fieldMatch[1].replace(/\*+/g, "").trim().toLowerCase();
          const initialVal = fieldMatch[2].replace(/\*+/g, "").trim();
          currentValue = initialVal ? [initialVal] : [];
        } else if (currentKey && line.trim()) {
          currentValue.push(line.trim());
        }
      }

      if (currentKey) {
        finding[currentKey] = currentValue.join("\n").trim();
      }

      let extractedTitle = stripMarkdown(finding.title || "");
      if (!extractedTitle && lines[0] && lines[0].trim().startsWith(":")) {
        extractedTitle = stripMarkdown(lines[0].trim().replace(/^:\s*/, ""));
      }

      return {
        severity: stripMarkdown(finding.severity || "LOW"),
        classification: stripMarkdown(finding.classification || "CONFIRMED"),
        file: stripMarkdown(finding.file || ""),
        line: stripMarkdown(finding.line || finding["line number"] || ""),
        title: extractedTitle,
        evidence: cleanEvidence(finding.evidence || ""),
        explanation: stripMarkdown(finding.explanation || ""),
        whyItMatters: stripMarkdown(
          finding["why it matters"] || finding.whyitmatters || ""
        ),
        suggestedAction: stripMarkdown(
          finding["suggested action"] ||
            finding.suggestedaction ||
            finding["recommended action"] ||
            finding.recommendedaction ||
            ""
        ),
      };
    })
    .filter((f) => f.explanation || f.evidence || f.file);
}

// ============================================================
// PARSE CONTEXT APPLIED
// ============================================================

function parseContextApplied(text) {
  if (!text || isEmptySection(text)) return null;

  const repoFiles = [];
  const teamMemories = [];
  const appliedDecisions = [];
  let impactOnReview = "";
  const generalNotes = [];

  const lines = text.split("\n");
  let currentGroup = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/repository\s*files?/i.test(trimmed)) {
      currentGroup = "repo";
      continue;
    } else if (/team\s*memor(?:y|ies)/i.test(trimmed)) {
      currentGroup = "memory";
      continue;
    } else if (/applied\s*team\s*decisions?/i.test(trimmed)) {
      currentGroup = "applied";
      continue;
    } else if (/impact\s*on\s*review/i.test(trimmed)) {
      currentGroup = "impact";
      continue;
    }

    const cleaned = stripMarkdown(
      trimmed.replace(/^\d+[\.)\]]\s*/, "").replace(/^[-*]\s*/, "")
    );
    if (!cleaned) continue;

    if (/^[A-Za-z\s]+:$/.test(trimmed)) {
      currentGroup = null;
      generalNotes.push(cleaned);
      continue;
    }

    if (currentGroup === "repo") {
      if (!cleaned.toLowerCase().includes("important") && !cleaned.endsWith(":")) {
        repoFiles.push(cleaned);
      }
    } else if (currentGroup === "memory") {
      teamMemories.push(cleaned);
    } else if (currentGroup === "applied") {
      if (!cleaned.toLowerCase().includes("none applied")) {
        appliedDecisions.push(cleaned);
      }
    } else if (currentGroup === "impact") {
      impactOnReview = (impactOnReview ? impactOnReview + " " : "") + cleaned;
    } else {
      generalNotes.push(cleaned);
    }
  }

  return { repoFiles, teamMemories, appliedDecisions, impactOnReview, generalNotes };
}

// ============================================================
// PARSE CHANGED FILES
// ============================================================

function parseChangedFiles(text) {
  if (!text || isEmptySection(text)) return [];
  return text
    .split("\n")
    .map((line) => stripMarkdown(line.replace(/^[-*\d\.)\]]\s*/, "")))
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((filename) => ({
      name: filename,
      status: "MODIFIED",
    }));
}

// ============================================================
// EXTRACT DIFFS PER FILE FROM RAW OUTPUT
// ============================================================

function extractDiffsFromRaw(rawOutput) {
  if (!rawOutput) return {};
  const diffs = {};
  const diffMatches = rawOutput.split(/diff --git\s+/g).slice(1);

  for (const match of diffMatches) {
    const headerMatch = match.match(/^a\/([^\s]+)\s+b\/([^\s]+)/);
    if (headerMatch) {
      const fileName = headerMatch[2];
      const diffContent = "diff --git a/" + match.trim();
      diffs[fileName] = diffContent;
    }
  }

  return diffs;
}

// ============================================================
// PARSE SUGGESTED ACTIONS
// ============================================================

function parseSuggestedActions(text) {
  if (!text || isEmptySection(text)) return [];
  return text
    .split("\n")
    .map((line) => stripMarkdown(line.replace(/^[\d]+[.)]\s*|^[-*]\s*/, "")))
    .filter((line) => line.length > 0 && !isEmptySection(line));
}

// ============================================================
// REVIEW RESULT COMPONENT
// ============================================================

export default function ReviewResult({ rawOutput, sourceMode }) {
  if (!rawOutput) return null;

  const sections = parseSections(rawOutput);

  const repository = stripMarkdown(sections["Repository"] || "payments-api");
  const changedFiles = parseChangedFiles(
    sections["Changed Files"] || sections["Submitted Files"]
  );
  const findings = parseFindings(sections["Findings"]);
  const contextData = parseContextApplied(sections["Context Applied"]);
  const suggestedActions = parseSuggestedActions(sections["Suggested Actions"]);
  const fileDiffs = extractDiffsFromRaw(rawOutput);

  // Review Summary — only from backend data
  let reviewSummary = "";
  if (sections["Review Summary"] && !isEmptySection(sections["Review Summary"])) {
    reviewSummary = stripMarkdown(sections["Review Summary"]);
  } else if (findings.length === 0) {
    reviewSummary =
      "The change was reviewed against repository context and team memory. No confirmed repository-level issue was identified.";
  } else {
    reviewSummary = `The review identified ${findings.length} finding${
      findings.length > 1 ? "s" : ""
    } requiring engineering attention before merging.`;
  }

  const noConfirmedIssues =
    findings.length === 0 ||
    (sections["Findings"] &&
      sections["Findings"].toLowerCase().includes("no confirmed issues"));

  const fileNamesString =
    changedFiles.length > 0
      ? changedFiles.map((f) => f.name).join(" · ")
      : "";

  return (
    <div className="cm-review-result cm-animate-in" id="review-result">

      {/* Compact header row */}
      <div className="cm-result-header">
        <span className="cm-result-header__label">CODE REVIEW</span>
        <span className="cm-result-header__sep">·</span>
        <span className="cm-result-header__repo">{repository}</span>
        {fileNamesString && (
          <>
            <span className="cm-result-header__sep">·</span>
            <span className="cm-result-header__files cm-font-mono">{fileNamesString}</span>
          </>
        )}
      </div>

      {/* Summary */}
      <ReviewSummary summary={reviewSummary} />

      {/* Findings (with merged status) */}
      <Findings findings={findings} noConfirmedIssues={noConfirmedIssues} />

      {/* Changed/Submitted Files */}
      <ChangedFiles
        changedFiles={changedFiles}
        fileDiffs={fileDiffs}
        sourceMode={sourceMode || "git"}
      />

      {/* Context Used */}
      <ContextSummary contextData={contextData} />

      {/* Technical Details (collapsed, complete raw output) */}
      <TechnicalDetails rawOutput={rawOutput} />

    </div>
  );
}
