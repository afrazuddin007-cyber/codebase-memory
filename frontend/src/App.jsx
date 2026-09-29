import { useState, useEffect } from "react";
import "./App.css";

import NavBar from "./components/NavBar";
import ReviewWorkspace from "./components/ReviewWorkspace";
import RepositoryWorkspace from "./components/RepositoryWorkspace";
import TeamMemoryWorkspace from "./components/TeamMemoryWorkspace";

function App() {
  const [activeTab, setActiveTab] = useState("review");

  // Review Source state
  const [sourceMode, setSourceMode] = useState("git"); // 'git' | 'upload' | 'paste'
  const [files, setFiles] = useState([]);
  const [pastedFilename, setPastedFilename] = useState("payment.py");
  const [pastedLanguage, setPastedLanguage] = useState("python");
  const [pastedCode, setPastedCode] = useState("");
  const [reviewScope, setReviewScope] = useState("changes"); // 'changes' | 'full' | 'context'
  const [useMemory, setUseMemory] = useState(true); // true = with Hindsight memory | false = generic review without memory

  // Execution state
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeStage, setActiveStage] = useState(1);

  // Animate stages 1 -> 2 -> 3 -> 4 while loading
  useEffect(() => {
    let timer;
    if (loading) {
      setActiveStage(1);
      timer = setInterval(() => {
        setActiveStage((stage) => (stage < 4 ? stage + 1 : 4));
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const runReview = async () => {
    setLoading(true);
    setReview("");
    setError("");

    try {
      let payload = null;

      if (sourceMode === "git") {
        payload = { source: "git", scope: reviewScope, use_memory: useMemory };
      } else if (sourceMode === "upload") {
        payload = { source: "upload", files, scope: reviewScope, use_memory: useMemory };
      } else if (sourceMode === "paste") {
        payload = {
          source: "paste",
          pasted_code: {
            filename: pastedFilename,
            language: pastedLanguage,
            code: pastedCode,
          },
          scope: reviewScope,
          use_memory: useMemory,
        };
      }

      const response = await fetch("http://127.0.0.1:8000/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setReview(data.output);
        setTimeout(() => {
          const resultElement = document.getElementById("review-result");
          if (resultElement) {
            resultElement.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 120);
      } else {
        setError(data.error ? data.error : "Review failed. No output generated.");
      }
    } catch (err) {
      setError(`Could not connect to the review backend.\n\n${err.message}`);
    }

    setLoading(false);
  };

  const handleReviewFileFromRepo = (file) => {
    setPastedFilename(file.name);
    setPastedCode(file.content);
    setSourceMode("paste");
    setActiveTab("review");
  };

  return (
    <div className="cm-app">
      <NavBar activeTab={activeTab} onSelectTab={setActiveTab} />

      <main className="cm-main">
        {activeTab === "review" && (
          <ReviewWorkspace
            sourceMode={sourceMode}
            setSourceMode={setSourceMode}
            files={files}
            setFiles={setFiles}
            pastedFilename={pastedFilename}
            setPastedFilename={setPastedFilename}
            pastedLanguage={pastedLanguage}
            setPastedLanguage={setPastedLanguage}
            pastedCode={pastedCode}
            setPastedCode={setPastedCode}
            reviewScope={reviewScope}
            setReviewScope={setReviewScope}
            useMemory={useMemory}
            onUseMemoryChange={setUseMemory}
            onRunReview={runReview}
            loading={loading}
            activeStage={activeStage}
            error={error}
            review={review}
            onRetry={runReview}
          />
        )}

        {activeTab === "repository" && (
          <RepositoryWorkspace onReviewFile={handleReviewFileFromRepo} />
        )}

        {activeTab === "memory" && (
          <TeamMemoryWorkspace onBackToReview={() => setActiveTab("review")} />
        )}
      </main>

      <footer className="cm-footer">
        <div className="cm-footer__inner">
          <span className="cm-footer__brand">CODEBASE MEMORY</span>
          <span className="cm-footer__tech">HINDSIGHT · OLLAMA · GIT</span>
        </div>
      </footer>
    </div>
  );
}

export default App;