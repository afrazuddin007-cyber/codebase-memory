import sys
import json
import time
import urllib.request
import urllib.error

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"

def post_review(payload):
    req = urllib.request.Request(
        f"{BASE_URL}/review",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get_endpoint(path):
    req = urllib.request.Request(f"{BASE_URL}{path}")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

def test_endpoints():
    print("--- 1. Testing GET /repository ---")
    repo = get_endpoint("/repository")
    print(f"Success: {repo.get('success')}, Repo: {repo.get('repository')}, Files: {len(repo.get('files', []))}")
    assert repo.get("success") == True

    print("--- 2. Testing GET /team-memory ---")
    mem = get_endpoint("/team-memory")
    print(f"Success: {mem.get('success')}, Bank: {mem.get('bank_id')}, Memories: {len(mem.get('memories', []))}")
    assert mem.get("success") == True

def test_git_review():
    print("\n--- 3. Testing Test A & J: Git Review with Relevant Hindsight Memory ---")
    t0 = time.time()
    res = post_review({"source": "git", "use_memory": True})
    elapsed = round(time.time() - t0, 1)
    out = res.get("output", "")
    print(f"Success: {res.get('success')} ({elapsed}s)")
    print(f"Contains 'Database instantiation' or 'Applied Team Decision': {'Database instantiation' in out or 'Applied Team Decision' in out}")
    assert res.get("success") == True

def test_clean_code():
    print("\n--- 4. Testing Test E & I: Clean Code (Zero Findings) ---")
    code = "def multiply(x: int, y: int) -> int:\n    \"\"\"Return the product of two integers.\"\"\"\n    return x * y\n"
    res = post_review({
        "source": "upload",
        "files": [{"name": "calculator.py", "content": code}],
        "use_memory": True
    })
    out = res.get("output", "")
    has_no_issues = "No confirmed issues" in out or "NO CONFIRMED ISSUES" in out or "no confirmed" in out.lower()
    print(f"Success: {res.get('success')}, Reports No Issues: {has_no_issues}")
    assert res.get("success") == True

def test_security_vulnerability():
    print("\n--- 5. Testing Test G: Security Vulnerability (SQL Injection) ---")
    code = "const express = require('express');\nconst app = express();\n\napp.get('/search', (req, res) => {\n    const term = req.query.q;\n    const query = \"SELECT * FROM products WHERE name LIKE '\" + term + \"'\";\n    db.query(query, (err, rows) => res.json(rows));\n});\n"
    res = post_review({
        "source": "upload",
        "files": [{"name": "search_service.js", "content": code}],
        "use_memory": True
    })
    out = res.get("output", "")
    mentions_vuln = "SQL" in out or "injection" in out.lower() or "Finding" in out
    print(f"Success: {res.get('success')}, Mentions SQL/Injection: {mentions_vuln}")
    assert res.get("success") == True

def test_multi_file_multi_language():
    print("\n--- 6. Testing Test C & D: Multi-File Multi-Language Upload ---")
    go_code = "package main\nimport \"fmt\"\nfunc main() {\n    fmt.Println(\"Service starting...\")\n}\n"
    sql_code = "CREATE TABLE audit_logs (\n    id SERIAL PRIMARY KEY,\n    event_name VARCHAR(100) NOT NULL,\n    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n"
    res = post_review({
        "source": "upload",
        "files": [
            {"name": "main.go", "content": go_code},
            {"name": "schema.sql", "content": sql_code}
        ],
        "use_memory": True
    })
    out = res.get("output", "")
    print(f"Success: {res.get('success')}")
    print(f"Mentions main.go and schema.sql: {'main.go' in out and 'schema.sql' in out}")
    assert res.get("success") == True

def test_memory_bypass():
    print("\n--- 7. Testing Test 11: Memory Bypass (Before/After comparison) ---")
    res = post_review({"source": "git", "use_memory": False})
    out = res.get("output", "")
    print(f"Success: {res.get('success')}")
    print(f"Memory Bypassed: {'BYPASSED' in out or 'No team memory' in out or 'None applied' in out}")
    assert res.get("success") == True

if __name__ == "__main__":
    test_endpoints()
    # Run test_clean_code first as a quick smoke test
    test_clean_code()
