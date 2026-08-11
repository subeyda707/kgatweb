"""
Core pipeline logic -- ported directly from the proven, tested Colab notebook.
Same functions, same behavior, now as an importable module for a real API.
"""
import random, json, uuid, hmac, hashlib, time
from datetime import datetime, timedelta
from collections import defaultdict

_SECRET = b"kgat-demo-secret-key"

def issue_token(agent_id, scope):
    expiry = int(time.time())+3600*24*365*5
    payload = f"{agent_id}:{scope}:{expiry}"
    sig = hmac.new(_SECRET, payload.encode(), hashlib.sha256).hexdigest()
    return {"agent_id":agent_id,"scope":scope,"expiry":expiry,"signature":sig}

def verify_token(token):
    if not token: return False
    payload = f"{token['agent_id']}:{token['scope']}:{token['expiry']}"
    expected = hmac.new(_SECRET, payload.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, token.get("signature",""))

DRUGS = ['Aspirin','Ibuprofen','Paracetamol','Metformin','Atorvastatin']
CONDITIONS = ['Headache','Fever','Diabetes','HighCholesterol','MildPain']
SIDE_EFFECTS = ['StomachIrritation','Nausea','Drowsiness']
USERS = [{"username":"kg_curator_1","roles":["data_writer"]},{"username":"kg_curator_2","roles":["data_writer"]},
    {"username":"admin_lead","roles":["admin"]},{"username":"analyst_readonly","roles":["reader"]}]

def rand_time(start_year=2022, end_year=2026):
    start = datetime(start_year,1,1); end = datetime(end_year,6,1)
    return start + timedelta(seconds=random.randint(0, int((end-start).total_seconds())))

def generate_log(seed=11):
    random.seed(seed)
    log = []; request_ids_used = set()
    def new_request_id():
        rid = str(uuid.uuid4()); request_ids_used.add(rid); return rid

    for i in range(35):
        user = random.choice(USERS)
        is_authorized = "data_writer" in user["roles"] or "admin" in user["roles"]
        if not is_authorized: continue
        event_type = random.choice(["added","remapped","removed"])
        subject = random.choice(DRUGS); predicate = random.choice(["treats","hasSideEffect"])
        obj = random.choice(CONDITIONS if predicate=="treats" else SIDE_EFFECTS)
        token = issue_token(user["username"], "kg:write")
        log.append({"time": rand_time().isoformat()+"Z","level":"INFO","component":"kgContent",
                    "event_type":event_type,"msg":f"{event_type.upper()}: ({subject})-[{predicate}]->({obj})",
                    "triple":{"subject":subject,"predicate":predicate,"object":obj},"user":user,
                    "request_id": new_request_id(), "token": token})

    log.append({"time": rand_time().isoformat()+"Z","level":"INFO","component":"kgContent","event_type":"added",
                "msg":"ADDED: (Aspirin)-[treats]->(Cancer)","triple":{"subject":"Aspirin","predicate":"treats","object":"Cancer"},
                "user":{"username":"analyst_readonly","roles":["reader"]}, "request_id": new_request_id(),
                "token": issue_token("analyst_readonly","kg:write")})

    dup_id = list(request_ids_used)[0]
    log.append({"time": rand_time().isoformat()+"Z","level":"INFO","component":"kgContent","event_type":"added",
                "msg":"ADDED: (Metformin)-[treats]->(Diabetes)","triple":{"subject":"Metformin","predicate":"treats","object":"Diabetes"},
                "user": random.choice(USERS), "request_id": dup_id, "token": issue_token("kg_curator_1","kg:write")})

    log.append({"time": rand_time().isoformat()+"Z","level":"INFO","component":"kgContent","event_type":"added",
                "msg":"ADDED: (Ibuprofen)-[treats]->(Headache)","triple":{"subject":"Ibuprofen","predicate":"treats","object":"Headache"},
                "user":{"username":"kg_curator_1","roles":["data_writer"]}, "request_id": new_request_id(),
                "token": issue_token("kg_curator_1","kg:write")})
    log.append({"time": rand_time().isoformat()+"Z","level":"INFO","component":"kgContent","event_type":"added",
                "msg":"ADDED: (Ibuprofen)-[treats]->(Fever)","triple":{"subject":"Ibuprofen","predicate":"treats","object":"Fever"},
                "user":{"username":"kg_curator_2","roles":["data_writer"]}, "request_id": new_request_id(),
                "token": issue_token("kg_curator_2","kg:write")})

    random.shuffle(log)
    return log


def detect_conflicts(log):
    by_sp = defaultdict(list)
    for entry in log:
        if entry.get("event_type") != "added": continue
        t = entry["triple"]
        by_sp[(t["subject"], t["predicate"])].append((entry["user"]["username"], t["object"], entry["request_id"]))
    conflicts = []
    for (s,p), claims in by_sp.items():
        objects = set(o for _,o,_ in claims)
        if len(objects) > 1:
            conflicts.append({"subject":s, "predicate":p, "claims":claims})
    return conflicts


def check_uniqueness(entry, seen_ids):
    rid = entry["request_id"]
    if rid in seen_ids: return False, f"Duplicate request_id: {rid} has already appeared."
    seen_ids.add(rid); return True, None

def check_role_action_consistency(entry):
    roles = entry.get("user",{}).get("roles",[])
    is_authorized = "data_writer" in roles or "admin" in roles
    if entry.get("event_type") in ("added","remapped","removed") and not is_authorized:
        return False, f"User roles {roles} do not authorize a graph content change, but this event was recorded."
    return True, None

def check_token(entry):
    if not verify_token(entry.get("token")):
        return False, "Cryptographic authorization token failed verification."
    return True, None

def run_audit(log):
    conflicts = detect_conflicts(log)
    conflict_request_ids = set(rid for c in conflicts for _,_,rid in c["claims"])

    def check_conflict(entry):
        if entry["request_id"] in conflict_request_ids:
            return False, "This claim conflicts with another agent's independent claim about the same fact."
        return True, None

    seen_ids = set(); audit_results = []
    for entry in log:
        issues = []
        for check in (check_uniqueness, check_role_action_consistency, check_token, check_conflict):
            ok, msg = check(entry, seen_ids) if check is check_uniqueness else check(entry)
            if not ok: issues.append(msg)
        is_priority = entry.get("level") in ("WARN","ERROR") or len(issues) > 0
        audit_results.append({"entry":entry, "classification": "priority" if is_priority else "routine", "issues":issues})

    final_records = []
    clean_records = []
    for r in audit_results:
        e = r["entry"]
        record = {"who":e["user"]["username"], "roles":e["user"]["roles"], "what":e["msg"],
                  "when":e["time"], "issues_found":r["issues"], "request_id":e["request_id"],
                  "trusted": r["classification"] == "routine"}
        if r["classification"] == "priority":
            final_records.append(record)
        else:
            clean_records.append(record)

    routine_count = sum(1 for r in audit_results if r["classification"]=="routine")
    priority_count = sum(1 for r in audit_results if r["classification"]=="priority")

    return {
        "summary": {"routine": routine_count, "priority": priority_count, "conflicts": len(conflicts), "total": len(log)},
        "records": final_records,
        "clean_records": clean_records,
        "conflicts": conflicts,
    }
