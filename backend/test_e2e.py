import sys
import json
import time
import urllib.request

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"

def post_review(payload):
    req = urllib.request.Request(
        f"{BASE_URL}/review",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode("utf-8"))

def test_git_with_memory():
    print("=== TEST 1: GIT REVIEW WITH TEAM MEMORY (Active) ===")
    t0 = time.time()
    res = post_review({"source": "git", "use_memory": True})
    elapsed = round(time.time() - t0, 1)
    out = res.get("output", "")
    print(f"Success: {res.get('success')} ({elapsed}s)")
    print(f"Memory Applied Mentioned: {'Database instantiation' in out or 'Applied Team Decision' in out}")
    return res

def test_git_without_memory():
    print("\n=== TEST 2: GIT REVIEW WITHOUT TEAM MEMORY (Bypassed) ===")
    t0 = time.time()
    res = post_review({"source": "git", "use_memory": False})
    elapsed = round(time.time() - t0, 1)
    out = res.get("output", "")
    print(f"Success: {res.get('success')} ({elapsed}s)")
    print(f"Generic Review Executed: {'No team memory' in out or 'BYPASSED' in out or 'None applied' in out}")
    return res

def test_clean_upload():
    print("\n=== TEST 3: UPLOAD CLEAN PYTHON UTILITY (Zero Findings Expected) ===")
    code = "def add(a: int, b: int) -> int:\n    return a + b\n"
    res = post_review({
        "source": "upload",
        "files": [{"name": "math_utils.py", "content": code}],
        "use_memory": True
    })
    out = res.get("output", "")
    print(f"Success: {res.get('success')}")
    print(f"Reports No Issues: {'No confirmed issues' in out or 'NO CONFIRMED ISSUES' in out or 'no confirmed' in out.lower()}")
    return res

def test_vulnerable_upload():
    print("\n=== TEST 4: UPLOAD VULNERABLE JAVASCRIPT (SQL Injection Expected) ===")
    code = "app.get('/user', (req, res) => {\n    const id = req.query.id;\n    const sql = 'SELECT * FROM users WHERE id = ' + id;\n    db.query(sql, (err, row) => res.json(row));\n});\n"
    res = post_review({
        "source": "upload",
        "files": [{"name": "api.js", "content": code}],
        "use_memory": True
    })
    out = res.get("output", "")
    print(f"Success: {res.get('success')}")
    print(f"Mentions SQL Injection / Vulnerability: {'SQL' in out or 'injection' in out.lower()}")
    return res

if __name__ == "__main__":
    test_clean_upload()
