from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import sys
import os
import json
import tempfile
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Codebase Memory API",
    description="Context-aware AI code review",
    version="1.0"
)

# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# ROOT & HEALTH
# ============================================================

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Codebase Memory"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }

# ============================================================
# REPOSITORY FILES
# ============================================================

@app.get("/repository")
def get_repository():
    try:
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        project_folder = os.path.join(backend_dir, "test_project")
        files = []

        for root_dir, dirs, filenames in os.walk(project_folder):
            if ".git" in dirs:
                dirs.remove(".git")
            for fn in filenames:
                ext = os.path.splitext(fn)[1].lower()
                if ext in {".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".cpp", ".c", ".go", ".rs", ".sql"}:
                    full_path = os.path.join(root_dir, fn)
                    rel_path = os.path.relpath(full_path, project_folder)
                    size = os.path.getsize(full_path)
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                    lines = len(content.splitlines())
                    files.append({
                        "name": fn,
                        "path": rel_path.replace("\\", "/"),
                        "size": size,
                        "lines": lines,
                        "content": content
                    })

        return {
            "success": True,
            "repository": "payments-api",
            "files": files
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "repository": "payments-api",
            "files": []
        }

# ============================================================
# TEAM MEMORY
# ============================================================

@app.get("/team-memory")
def get_team_memory():
    fallback_memories = [
        {
            "id": 1,
            "title": "Direct Database Instantiation",
            "type": "accepted",
            "text": "The engineering team uses direct database instantiation in the payment service within the payments-api repository because the service has a controlled connection lifecycle."
        },
        {
            "id": 2,
            "title": "Dependency Injection in Payment Service",
            "type": "rejected",
            "text": "The engineering team rejected a previous code review recommendation to introduce dependency injection for the payment service to preserve an explicit connection lifecycle."
        }
    ]

    try:
        from hindsight_client import Hindsight
        hindsight = Hindsight(
            base_url=os.environ.get("HINDSIGHT_BASE_URL", "https://api.hindsight.vectorize.io"),
            api_key=os.environ.get("HINDSIGHT_API_KEY", "")
        )
        res = hindsight.recall(
            bank_id="codebase-memory",
            query="engineering decisions preferences payment service"
        )
        memories = []
        for i, m in enumerate(res.results):
            text = m.text
            mem_type = "accepted" if "uses direct" in text or "accepted" in text.lower() else "rejected"
            title = "Direct Database Instantiation" if "direct database" in text.lower() else "Dependency Injection Decision"
            memories.append({
                "id": i + 1,
                "title": title,
                "type": mem_type,
                "text": text
            })
        hindsight.close()

        return {
            "success": True,
            "bank_id": "codebase-memory",
            "repository": "payments-api",
            "memories": memories if memories else fallback_memories
        }
    except Exception:
        return {
            "success": True,
            "bank_id": "codebase-memory",
            "repository": "payments-api",
            "memories": fallback_memories
        }

# ============================================================
# RUN CODE REVIEW
# Supports:
# 1. Default Git changes (no body or source='git')
# 2. Uploaded files (source='upload', files=[...])
# 3. Pasted code (source='paste', pasted_code={...})
# ============================================================

@app.post("/review")
async def run_review(request: Request = None):
    temp_file = None
    try:
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        payload = None

        if request:
            try:
                body = await request.body()
                if body:
                    payload = json.loads(body)
            except Exception:
                payload = None

        cmd = [
            sys.executable,
            os.path.join(backend_dir, "review_engine.py")
        ]

        source = None
        if payload:
            source = payload.get("source") or payload.get("mode")

        if payload and source in ("upload", "paste"):
            normalized_payload = dict(payload)
            normalized_payload["source"] = source
            if "uploaded_files" in normalized_payload and not normalized_payload.get("files"):
                normalized_payload["files"] = normalized_payload["uploaded_files"]
            fd, temp_path = tempfile.mkstemp(suffix=".json")
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(normalized_payload, f)
            cmd.extend(["--file", temp_path])
            temp_file = temp_path

        if payload and payload.get("use_memory") is False:
            cmd.append("--no-memory")

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="ignore",
            cwd=backend_dir
        )

        return {
            "success": result.returncode == 0,
            "output": result.stdout,
            "error": result.stderr
        }

    except Exception as error:
        return {
            "success": False,
            "output": "",
            "error": str(error)
        }
    finally:
        if temp_file and os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except OSError:
                pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)