export default function NavBar({ activeTab, onSelectTab }) {
  const handleBrandKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelectTab("review");
    }
  };

  return (
    <nav className="cm-nav">
      <div className="cm-nav__inner">

        {/* Brand + Status */}
        <div className="cm-nav__brand-group">
          <div
            className="cm-nav__brand"
            onClick={() => onSelectTab("review")}
            onKeyDown={handleBrandKey}
            role="button"
            tabIndex={0}
            aria-label="Go to Review workspace"
          >
            <span className="cm-nav__logo">
              CODEBASE <span>MEMORY</span>
            </span>
            <span className="cm-nav__sep">·</span>
            <span className="cm-nav__descriptor">ENGINEERING INTELLIGENCE</span>
          </div>
          <span className="cm-nav__status-dot" title="Backend connected" />
        </div>

        {/* Navigation Tabs */}
        <div className="cm-nav__links" role="tablist">
          <button
            className={`cm-nav__tab ${activeTab === "review" ? "cm-nav__tab--active" : ""}`}
            onClick={() => onSelectTab("review")}
            role="tab"
            aria-selected={activeTab === "review"}
          >
            REVIEW
          </button>
          <button
            className={`cm-nav__tab ${activeTab === "repository" ? "cm-nav__tab--active" : ""}`}
            onClick={() => onSelectTab("repository")}
            role="tab"
            aria-selected={activeTab === "repository"}
          >
            REPOSITORY
          </button>
          <button
            className={`cm-nav__tab ${activeTab === "memory" ? "cm-nav__tab--active" : ""}`}
            onClick={() => onSelectTab("memory")}
            role="tab"
            aria-selected={activeTab === "memory"}
          >
            TEAM MEMORY
          </button>
        </div>

      </div>
    </nav>
  );
}
