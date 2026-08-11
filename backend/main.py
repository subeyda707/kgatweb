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
    """Real graph data -- every triple in the log, not just flagged ones."""
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

class ImportRequest(BaseModel):
    data: list

def normalize_import(data):
    normalized = []
    s_keys = ['subject','source','entity','from']
    p_keys = ['predicate','relation','relationship','type']
    o_keys = ['object','target','value','to']
    for item in data:
        if isinstance(item, list) and len(item) >= 3:
            normalized.append({"subject": str(item[0]), "predicate": str(item[1]), "object": str(item[2])})
        elif isinstance(item, dict):
            keys_lower = {k.lower(): k for k in item.keys()}
            s = next((item[keys_lower[k]] for k in s_keys if k in keys_lower), None)
            p = next((item[keys_lower[k]] for k in p_keys if k in keys_lower), None)
            o = next((item[keys_lower[k]] for k in o_keys if k in keys_lower), None)
            if s and p and o:
                normalized.append({"subject": str(s), "predicate": str(p), "object": str(o)})
    return normalized

@app.post("/import")
def import_graph(req: ImportRequest):
    triples = normalize_import(req.data)
    if not triples:
        raise HTTPException(status_code=400, detail="Could not parse any valid triples from the uploaded data.")

    import uuid
    from datetime import datetime, timezone
    from pipeline import issue_token

    imported_log = []
    agent_id = "external-import"
    for t in triples:
        imported_log.append({
            "time": datetime.now(timezone.utc).isoformat(),
            "level": "INFO", "component": "kgContent", "event_type": "added",
            "msg": f"ADDED: ({t['subject']})-[{t['predicate']}]->({t['object']})",
            "triple": t,
            "user": {"username": agent_id, "roles": ["data_writer"]},
            "request_id": str(uuid.uuid4()),
            "token": issue_token(agent_id, "kg:write"),
        })

    _cache["log"] = imported_log
    _cache["result"] = run_audit(imported_log)
    return {"status": "imported", "triples_count": len(triples), "summary": _cache["result"]["summary"]}
