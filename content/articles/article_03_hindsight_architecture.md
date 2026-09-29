# Giving Code Reviews a Memory with Hindsight

Building an AI agent that generates code suggestions is relatively easy. Building an AI agent that understands why a specific codebase is structured the way it is—and refrains from suggesting suggestions that break intentional architectural invariants—is significantly harder.

The standard pattern for building AI code review tools involves taking a Git diff, stuffing it into an LLM context window with a prompt like "Review this code for bugs and best practices," and returning the generated markdown. But this stateless approach fundamentally fails in production repositories. Real codebases do not adhere to generic, textbook best practices; they adhere to project-specific constraints, historical bug workarounds, and team agreements.

To create an agent that reviews code like an experienced senior staff engineer, I needed to equip it with long-term semantic memory. In this article, I will unpack the technical architecture of **Codebase Memory**, showing how I integrated [Hindsight](https://github.com/vectorize-io/hindsight) to provide persistent, queryable team memory to a local AI code review engine.

---

## High-Level System Architecture

Codebase Memory operates on a three-tier architecture:
1. **Frontend Presentation**: A React and Vite interface that presents review output as a cohesive, high-density engineering document with syntax-highlighted diffs and real-time analysis stages.
2. **Backend API**: A FastAPI service (`backend/api.py`) exposing endpoints for repository file introspection, team memory exploration, and code review triggering.
3. **Review & Reasoning Engine**: A Python engine (`backend/review_engine.py`) that orchestrates Git diff extraction, multi-language repository scanning, Hindsight memory recall, and local LLM inference via Ollama (`qwen2.5-coder:7b`).

[IMAGE SLOT: Architecture diagram showing Git → Repository Context → Hindsight → LLM → Review]

The critical technical innovation lies in how the review engine blends **ephemeral code changes**, **static repository context**, and **persistent organizational memory**.

---

## Connecting to the Hindsight Memory Layer

The core memory layer is managed through the Hindsight Python SDK (`hindsight_client`), which connects to our dedicated memory bank. A memory bank functions as an indexed vector store tailored specifically for autonomous agent memory, as detailed in the concept of [Vectorize Agent Memory](https://vectorize.io/what-is-agent-memory).

In `backend/review_engine.py`, the client is instantiated at module load:

```python
import os
from dotenv import load_dotenv
from hindsight_client import Hindsight

load_dotenv()

HINDSIGHT_URL = os.environ["HINDSIGHT_BASE_URL"]
HINDSIGHT_API_KEY = os.environ["HINDSIGHT_API_KEY"]
BANK_ID = "codebase-memory"

hindsight = Hindsight(
    base_url=HINDSIGHT_URL,
    api_key=HINDSIGHT_API_KEY
)
```

The bank `codebase-memory` stores historical decisions, architectural decision records (ADRs), post-mortem learnings, and review precedents. Crucially, Hindsight does not just perform naive keyword matching; it performs semantic similarity search across embedded natural language assertions.

---

## Dynamic Query Formulation

A common failure mode in naive RAG (Retrieval-Augmented Generation) systems is using a generic or static query string. If you query a memory bank with `"code review"`, you retrieve diluted, low-relevance results that clutter the context window.

In Codebase Memory, I implemented dynamic query synthesis. Before searching Hindsight, the engine parses the incoming code submission to extract the exact list of modified or uploaded files. It then crafts a highly targeted query directed at that subsystem:

```python
if use_memory:
    file_hint = ", ".join(target_files) if target_files else REPOSITORY_NAME
    memory_query = (
        f"What are the team's engineering decisions, rejected recommendations, architectural "
        f"preferences, and reasoning for {file_hint} in the {REPOSITORY_NAME} repository that could affect code review?"
    )
    team_context = recall_team_context(memory_query)
```

The `recall_team_context` function invokes the Hindsight client and parses the returned objects into plain-text assertions:

```python
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
```

When reviewing changes to `payment.py`, this query automatically pulls memories concerning direct database instantiation and rejected dependency injection patterns, completely ignoring unrelated memories about frontend state management or CSS rules.

[IMAGE SLOT: Analysis Progress indicator tracking the four pipeline stages]

---

## Merging Repository Context and Memory into LLM Prompts

Once Hindsight returns the relevant memories, the engine combines them with structural repository context. In `scan_repository()`, the engine scans the project folder, filtering out ignored directories (`.git`, `node_modules`, `__pycache__`), and reads all supported files (`.py`, `.js`, `.ts`, `.go`, `.rs`, `.sql`, etc.).

The complete prompt is structured with explicit evidentiary boundaries:

```python
prompt = f"""
You are a senior AI code review agent for engineering teams.

Repository / Project:
{repo_name}

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
"""
```

The prompt enforces strict behavioral rules:
- **Accepted Patterns**: Do NOT flag or criticize an accepted pattern. It is intentional.
- **Rejected Approaches**: Do NOT recommend a pattern the team explicitly rejected.
- **Evidence-First**: Only report a finding when there is concrete, provable evidence in the code. If benign, report "No confirmed issues found."

The compiled payload is then sent to a local Ollama server running the `qwen2.5-coder:7b` model:

```python
payload = {
    "model": "qwen2.5-coder:7b",
    "prompt": prompt,
    "stream": False
}

response = requests.post(
    "http://localhost:11434/api/generate",
    json=payload,
    timeout=300
)
```

[IMAGE SLOT: Context Used section displaying deduplicated Hindsight memories]

---

## A Concrete Before and After

To measure the effectiveness of this architecture, I tested the exact same code diff under two modes: with memory active, and with memory bypassed using the `--no-memory` flag.

### Input Code (`payment.py`)
```python
def process_payment(request):
    db = Database()
    payment = db.get_payment(request.id)

    if payment is None:
        return None

    payment.status = "complete"

    return payment
```

### 1. Bypassed Memory Mode (`--no-memory`)
In bypassed mode, the prompt sets `memory_text = "No team memory available for this review (Team memory bypassed / comparison mode). Review according to generic conventions."`

The local LLM outputs:
- **Severity**: HIGH
- **Finding**: Direct instantiation of `Database()` within `process_payment`.
- **Recommendation**: Pass a database session or inject a database interface to decouple business logic from infrastructure.

### 2. Active Hindsight Memory Mode
In active mode, Hindsight retrieves:
- *"The engineering team uses direct database instantiation in the payment service within the payments-api repository because the service has a controlled connection lifecycle."*
- *"The engineering team rejected a previous code review recommendation to introduce dependency injection for the payment service."*

The local LLM outputs:
- **Review Summary**: Analyzed `payment.py` against repository definitions and team memory.
- **Findings**: `No confirmed issues found.`
- **Applied Team Decision**: *"The team's decision to use direct database instantiation was respected, and the review did not treat this as an architectural violation."*
- **Impact on Review**: *"The review strictly adhered to the team's decision to use direct database instantiation, as per the accepted pattern."*

---

## Honest Limitations and Technical Challenges

Deploying this architecture exposed two significant technical bottlenecks:

1. **Local Inference Latency on CPU**: Running a 7B parameter coding model (`qwen2.5-coder:7b`) with a combined context of repository files, Hindsight memories, and Git diffs takes between 60 to 90 seconds on standard CPU hardware. Early integration tests frequently failed with socket read timeouts. To fix this, I had to increase HTTP timeouts in `urllib.request` and `requests` to 180–300 seconds and build a dynamic stage-progress indicator in the frontend so developers know the system is actively reasoning.
2. **Context Window Contention**: In large repositories with hundreds of files, feeding the entire codebase into the prompt alongside team memories quickly exhausts local context limits. Implementing selective AST chunking or relevance-filtered repository scanning is necessary for scaling beyond compact microservices.

For more details on setting up agent memory banks, query syntax, and embedding strategies, consult the [Hindsight Documentation](https://hindsight.vectorize.io/).

---

## Conclusion

Stateless LLMs can write boilerplate, but they cannot truly collaborate with an engineering team until they understand the team's shared history.

By integrating [Hindsight](https://github.com/vectorize-io/hindsight), Codebase Memory gives autonomous review agents the institutional memory they need to evaluate code within its proper historical and architectural context. The result is a code reviewer that doesn't just inspect code—it understands the team that wrote it.

WORD COUNT: 1325
