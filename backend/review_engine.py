import sys
import os
import subprocess
import requests
import difflib
import json

# Fix Windows console encoding for emoji output
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

if sys.stderr.encoding and sys.stderr.encoding.lower() != "utf-8":
    sys.stderr.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
from hindsight_client import Hindsight


# ============================================================
# CONFIGURATION
# ============================================================

load_dotenv()

HINDSIGHT_URL = os.environ["HINDSIGHT_BASE_URL"]
HINDSIGHT_API_KEY = os.environ["HINDSIGHT_API_KEY"]

BANK_ID = "codebase-memory"

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "qwen2.5-coder:7b"

PROJECT_FOLDER = "test_project"
REPOSITORY_NAME = "payments-api"

IGNORED_DIRECTORIES = {
    ".git",
    ".venv",
    "venv",
    "__pycache__",
    "node_modules",
}

ALLOWED_EXTENSIONS = {
    ".py",
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".java",
    ".c",
    ".cpp",
    ".cc",
    ".h",
    ".hpp",
    ".go",
    ".rs",
    ".sql",
    ".rb",
    ".php",
    ".cs",
}

LANGUAGE_MAP = {
    ".py": "Python",
    ".js": "JavaScript",
    ".jsx": "JavaScript (React)",
    ".ts": "TypeScript",
    ".tsx": "TypeScript (React)",
    ".java": "Java",
    ".c": "C",
    ".cpp": "C++",
    ".cc": "C++",
    ".h": "C/C++ Header",
    ".hpp": "C++ Header",
    ".go": "Go",
    ".rs": "Rust",
    ".sql": "SQL",
    ".rb": "Ruby",
    ".php": "PHP",
    ".cs": "C#",
}


# ============================================================
# CONNECT TO HINDSIGHT
# ============================================================

hindsight = Hindsight(
    base_url=HINDSIGHT_URL,
    api_key=HINDSIGHT_API_KEY
)


# ============================================================
# GET GIT DIFF
# ============================================================

def get_git_diff():

    print("🔀 Reading Git diff...")

    result = subprocess.run(
        ["git", "diff", "HEAD"],
        cwd=PROJECT_FOLDER,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="ignore"
    )

    if result.returncode != 0:
        raise RuntimeError(
            "Git diff failed:\n" + result.stderr
        )

    return result.stdout


# ============================================================
# GET UPLOADED CODE (GENUINE SUBMITTED SOURCE, NO FAKE DIFF)
# ============================================================

def get_uploaded_code(files, scope="changes"):

    print(f"📁 Processing {len(files)} uploaded file(s)...")

    sections = []

    for f in files:
        name = f.get("name") or f.get("filename", "uploaded_file.py")
        content = f.get("content", "")
        sections.append(
            f"FILE: {name}\n"
            + "=" * 60
            + "\n"
            + content
            + "\n"
            + "=" * 60
        )

    return "\n\n".join(sections)


# ============================================================
# GET PASTED DIFF
# ============================================================

def get_pasted_diff(pasted_code, scope="changes"):

    name = pasted_code.get("filename", "payment.py")
    code = pasted_code.get("code", "")

    print(f"📋 Processing pasted code for {name}...")

    repo_file_path = os.path.join(PROJECT_FOLDER, name)

    if scope == "full" or not os.path.exists(repo_file_path):

        lines = code.splitlines(keepends=True)

        diff = "".join(
            difflib.unified_diff(
                [],
                lines,
                fromfile=f"a/{name} (none)",
                tofile=f"b/{name}"
            )
        )

    else:

        with open(
            repo_file_path,
            "r",
            encoding="utf-8",
            errors="ignore"
        ) as rf:
            old_content = rf.read()

        diff = "".join(
            difflib.unified_diff(
                old_content.splitlines(keepends=True),
                code.splitlines(keepends=True),
                fromfile=f"a/{name} (repository)",
                tofile=f"b/{name} (pasted)"
            )
        )

    if not diff.strip():
        diff = f"diff --git a/{name} b/{name}\n# {name}: identical to repository version."

    return diff


# ============================================================
# SCAN REPOSITORY
# ============================================================

def scan_repository():

    print("📂 Scanning repository context...")

    files = []

    for root, directories, filenames in os.walk(PROJECT_FOLDER):

        directories[:] = [
            directory
            for directory in directories
            if directory not in IGNORED_DIRECTORIES
        ]

        for filename in filenames:

            extension = os.path.splitext(filename)[1].lower()

            if extension in ALLOWED_EXTENSIONS:

                files.append(
                    os.path.join(root, filename)
                )

    return files


# ============================================================
# READ FILE
# ============================================================

def read_file(file_path):

    try:

        with open(
            file_path,
            "r",
            encoding="utf-8",
            errors="ignore"
        ) as file:

            return file.read()

    except Exception as error:

        print(
            f"⚠️ Could not read {file_path}: {error}"
        )

        return ""


# ============================================================
# BUILD REPOSITORY CONTEXT
# ============================================================

def build_repository_context(files):

    print(
        f"📚 Reading {len(files)} repository file(s)..."
    )

    context_parts = []

    for file_path in files:

        code = read_file(file_path)

        if not code.strip():
            continue

        relative_path = os.path.relpath(
            file_path,
            PROJECT_FOLDER
        )

        block = (
            "FILE: "
            + relative_path
            + "\n"
            + "=" * 60
            + "\n"
            + code
            + "\n"
            + "=" * 60
        )

        context_parts.append(block)

    return "\n\n".join(context_parts)


# ============================================================
# RETRIEVE TEAM MEMORY
# ============================================================

def recall_team_context(query):

    print("🧠 Searching team memory...")

    result = hindsight.recall(
        bank_id=BANK_ID,
        query=query
    )

    memories = []

    for memory in result.results:

        memories.append(memory.text)

    return memories


# ============================================================
# REVIEW CHANGE
# ============================================================

def review_change(
    git_diff,
    repository_context,
    team_context,
    source_mode="git",
    target_files=None,
    repo_name=REPOSITORY_NAME,
    use_memory=True
):

    print(
        "🤖 Sending code + repository context + team memory to reviewer..."
    )

    if not use_memory:
        memory_text = "No team memory available for this review (Team memory bypassed / comparison mode). Review according to generic conventions."
    elif team_context:
        memory_text = "\n".join("- " + memory for memory in team_context)
    else:
        memory_text = "No relevant team memory retrieved for this change."

    files_list_str = "\n".join(f"- {f}" for f in target_files) if target_files else "- (files from diff)"
    target_section_title = "Submitted Files" if source_mode == "upload" else "Changed Files"

    prompt = f"""
You are a senior AI code review agent for engineering teams.

Repository / Project:
{repo_name}

Review Mode:
{"Uploaded Source Files Review" if source_mode == "upload" else "Git Changes Diff Review"}

Target Files:
{files_list_str}

You have THREE sources of evidence:
SOURCE 1: Target Code / Diff (the primary code under review)
SOURCE 2: Repository Code (existing codebase context for cross-file consistency)
SOURCE 3: Team Memory (historical engineering decisions and accepted patterns from Hindsight)

============================================================
TEAM MEMORY (HISTORICAL ENGINEERING DECISIONS)
============================================================

{memory_text}

============================================================
REPOSITORY CONTEXT (EXISTING CODEBASE)
============================================================

{repository_context if repository_context.strip() else "(No additional repository context needed)"}

============================================================
PRIMARY CODE UNDER REVIEW
============================================================

{git_diff}

============================================================
CRITICAL REVIEW GUIDELINES
============================================================

1. ARBITRARY LANGUAGE SUPPORT:
   Review the ACTUAL code provided above. Identify its programming language (Python, JavaScript, TypeScript, Java, Go, Rust, C/C++, SQL, etc.) and review it according to that language's idioms and security standards.

2. EVIDENCE-FIRST RULE:
   - Only report a finding when there is CONCRETE, PROVABLE EVIDENCE in the code.
   - For real security flaws (e.g. SQL injection `query = "SELECT * FROM users WHERE id = " + user_id`, unescaped HTML, insecure deserialization, hardcoded secrets), flag as HIGH severity SECURITY finding with exact line of evidence and a parameterized/secure fix.
   - For real correctness or reliability bugs (e.g. unhandled null pointer dereference, syntax error, logic error, resource leak), report with exact line of evidence and fix.
   - NEVER invent or manufacture issues: If the code is simple, benign, or correct (e.g. `print("hello")` or `def add(a, b): return a + b`), report "No confirmed issues found."
   - Do NOT manufacture line numbers or claims not present in the code.

3. TEAM MEMORY APPLICATION:
   - Team memories record intentional engineering decisions made by the team.
   - Only apply a team memory if it is GENUINELY RELEVANT to the code being reviewed. If the code is about an unrelated subsystem, do NOT force or mention unrelated memories.
   - If a memory IS relevant (e.g. team accepted direct database instantiation in payment service, or rejected dependency injection):
     * ACCEPTED PATTERNS: Do NOT flag or criticize an accepted pattern. It is intentional.
     * REJECTED APPROACHES: Do NOT recommend a pattern the team explicitly rejected.
     * State clearly in Context Applied what was applied and how it impacted the review.

============================================================
OUTPUT FORMAT (USE THESE EXACT HEADINGS)
============================================================

## Repository

{repo_name}

## {target_section_title}

{files_list_str}

## Review Summary

2-3 concise sentences summarizing what was analyzed, key context verified, and the review conclusion based strictly on evidence.

## Findings

No confirmed issues found.

(OR, if and only if there is a genuine, evidence-backed issue):

### Finding 1

- Severity: HIGH | MEDIUM | LOW
- Classification: CONFIRMED | POTENTIAL
- File: <exact filename>
- Line: <line number only if known from code>
- Title: <short descriptive title>
- Evidence: <the exact line or snippet of code from source, without markdown backticks or fences>
- Explanation: <technical explanation grounded in the code>
- Why It Matters: <security, correctness, or reliability impact>
- Recommended Action: <concrete code fix or guidance>

## Context Applied

Repository Files:
{files_list_str}

Team Memory:
{memory_text}

Applied Team Decisions:
<State the exact team decision applied, or "None applied (no relevant team decisions for this specific code).">

Impact on Review:
<State how team memory shaped this review, e.g. "Direct database instantiation was respected as an intentional team pattern and was not treated as an architectural violation.", or "Standard engineering review applied without domain-specific exceptions.">

## Suggested Actions

<Action items if findings exist, or "No immediate action required.">
"""

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False
    }

    response = requests.post(
        OLLAMA_URL,
        json=payload,
        timeout=300
    )

    response.raise_for_status()
    result = response.json()
    return result["response"]


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    try:

        input_data = None
        if "--file" in sys.argv:
            idx = sys.argv.index("--file")
            if idx + 1 < len(sys.argv):
                with open(sys.argv[idx + 1], "r", encoding="utf-8") as f:
                    input_data = json.load(f)
        elif "--json" in sys.argv:
            idx = sys.argv.index("--json")
            if idx + 1 < len(sys.argv):
                input_data = json.loads(sys.argv[idx + 1])

        use_memory = True
        if input_data and input_data.get("use_memory") is False:
            use_memory = False
        if "--no-memory" in sys.argv:
            use_memory = False

        source_mode = (input_data.get("source") or input_data.get("mode", "git")) if input_data else "git"
        target_files = []

        # ----------------------------------------------------
        # 1. GET CODE / DIFF
        # ----------------------------------------------------

        if input_data and source_mode == "upload":
            raw_files = input_data.get("files") or input_data.get("uploaded_files", [])
            normalized_files = []
            for rf in raw_files:
                fn = rf.get("name") or rf.get("filename", "uploaded_file.py")
                normalized_files.append({
                    "name": fn,
                    "filename": fn,
                    "content": rf.get("content", "")
                })
            git_diff = get_uploaded_code(
                normalized_files,
                input_data.get("scope", "changes")
            )
            target_files = [f["name"] for f in normalized_files]
            print(f"\n📄 Submitted file(s):\n")
            for tf in target_files:
                print(f"- {tf}")
            print("\n" + "=" * 60)
        elif input_data and source_mode == "paste":
            git_diff = get_pasted_diff(
                input_data.get("pasted_code", {}),
                input_data.get("scope", "changes")
            )
            fn = input_data.get("pasted_code", {}).get("filename", "pasted.py")
            target_files = [fn]
            print(f"\n📋 Pasted code:\n{git_diff}\n")
            print("=" * 60)
        else:
            git_diff = get_git_diff()
            if not git_diff.strip():
                print("\nℹ️ No changes detected.")
                raise SystemExit
            for line in git_diff.splitlines():
                if line.startswith("diff --git a/"):
                    parts = line.split()
                    if len(parts) >= 4:
                        target_files.append(parts[3].replace("b/", ""))
            if not target_files:
                target_files = ["payment.py"]
            print("\n📋 Git diff detected:\n")
            print(git_diff)
            print("\n" + "=" * 60)

        # ----------------------------------------------------
        # 2. SCAN REPOSITORY
        # ----------------------------------------------------

        repository_files = scan_repository()

        print(
            f"\n📄 Repository contains "
            f"{len(repository_files)} supported file(s)."
        )

        # ----------------------------------------------------
        # 3. BUILD REPOSITORY CONTEXT
        # ----------------------------------------------------

        repository_context = build_repository_context(
            repository_files
        )

        print("\n" + "=" * 60)

        # ----------------------------------------------------
        # 4. RETRIEVE TEAM MEMORY (DYNAMIC PER TARGET)
        # ----------------------------------------------------

        if use_memory:
            file_hint = ", ".join(target_files) if target_files else REPOSITORY_NAME
            memory_query = (
                f"What are the team's engineering decisions, rejected recommendations, architectural "
                f"preferences, and reasoning for {file_hint} in the {REPOSITORY_NAME} repository that could affect code review?"
            )
            team_context = recall_team_context(memory_query)
            print("\n📚 Relevant team memories:")
            if team_context:
                for memory in team_context:
                    print(f"\n- {memory}")
            else:
                print("\nNo relevant team memories found.")
        else:
            team_context = []
            print("\n🧠 Team memory: BYPASSED (Reviewing without historical team memory)")

        print("\n" + "=" * 60)

        # ----------------------------------------------------
        # 5. REVIEW
        # ----------------------------------------------------

        review = review_change(
            git_diff,
            repository_context,
            team_context,
            source_mode=source_mode,
            target_files=target_files,
            repo_name=REPOSITORY_NAME,
            use_memory=use_memory
        )

        print("\n🔎 CODE REVIEW")
        print("=" * 60)

        print(review)

    finally:

        # ----------------------------------------------------
        # CLOSE HINDSIGHT
        # ----------------------------------------------------

        hindsight.close()