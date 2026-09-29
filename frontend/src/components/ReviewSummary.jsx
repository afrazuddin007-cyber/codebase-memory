export default function ReviewSummary({ summary }) {
  if (!summary) return null;

  return (
    <div className="cm-review-summary-block">
      <span className="cm-block-eyebrow">REVIEW SUMMARY</span>
      <p className="cm-summary-paragraph">{summary}</p>
    </div>
  );
}
