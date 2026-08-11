"""
KGAT API -- wraps the proven pipeline logic as real HTTP endpoints.
"""
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pipeline import generate_log, run_audit

app = FastAPI(title="KGAT API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_cache = {"log": None, "result": None}

def get_result():
    if _cache["result"] is None:
        _cache["log"] = generate_log()
        _cache["result"] = run_audit(_cache["log"])
    return _cache["result"]

@app.get("/")
def root():
    return {"status": "KGAT API running"}

@app.get("/summary")
def summary():
    return get_result()["summary"]

@app.get("/records")
def records():
    return get_result()["records"]

@app.get("/records/clean")
def clean_records():
    return get_result()["clean_records"]

@app.get("/conflicts")
def conflicts():
    return get_result()["conflicts"]

@app.post("/rerun")
def rerun():
    import random
    _cache["log"] = generate_log(seed=random.randint(1,10000))
    _cache["result"] = run_audit(_cache["log"])
    return get_result()["summary"]

class ChatRequest(BaseModel):
    question: str
    api_key: str

@app.post("/chat")
def chat(req: ChatRequest):
    from google import genai
    records = get_result()["records"]
    lines = ["You are answering questions about a verified audit log. ONLY reference the records below."]
    for r in records:
        lines.append(f"- [{r['request_id']}] {r['when']} | who={r['who']} ({','.join(r['roles'])}) | what={r['what']} | issues={r['issues_found']}")
    context = "\n".join(lines)
    try:
        client = genai.Client(api_key=req.api_key)
        prompt = f"{context}\n\nQuestion: {req.question}"
        response = client.models.generate_content(model="gemini-flash-latest", contents=prompt)
        return {"answer": response.text}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/graph")
def graph():
    """Real graph data -- every triple in the log, not just flagged ones,
    so the visual reflects the actual Knowledge Graph, not just problems."""
    log = _cache["log"] or generate_log()
    if _cache["log"] is None:
        _cache["log"] = log
    flagged_ids = {r["request_id"] for r in get_result()["records"]}
    nodes = set()
    edges = []
    for entry in log:
        t = entry["triple"]
        nodes.add(t["subject"]); nodes.add(t["object"])
        edges.append({
            "source": t["subject"], "target": t["object"], "label": t["predicate"],
            "flagged": entry["request_id"] in flagged_ids,
        })
    return {"nodes": list(nodes), "edges": edges}
