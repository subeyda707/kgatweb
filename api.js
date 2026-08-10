import { API_BASE_URL } from './config';

const SAMPLE_RECORDS = [
  {who:"analyst_readonly", roles:["reader"], what:"ADDED: (Aspirin)-[treats]->(Cancer)", when:"2024-04-16T08:33:14Z", issues_found:["User roles ['reader'] do not authorize a graph content change, but this event was recorded."], request_id:"07022e1d-0124-41ed-85e1-c87b150d6379"},
  {who:"kg_curator_2", roles:["data_writer"], what:"ADDED: (Ibuprofen)-[treats]->(Fever)", when:"2022-12-05T19:09:13Z", issues_found:["This claim conflicts with another agent's independent claim about the same fact."], request_id:"d1c50a04-0c11-494f-aeac-8d08fa03fd00"},
  {who:"kg_curator_1", roles:["data_writer"], what:"ADDED: (Ibuprofen)-[treats]->(Headache)", when:"2022-11-19T14:50:52Z", issues_found:["This claim conflicts with another agent's independent claim about the same fact."], request_id:"b43534c4-700d-4310-9d6f-a3d163ba90c4"},
  {who:"admin_lead", roles:["admin"], what:"ADDED: (Ibuprofen)-[treats]->(HighCholesterol)", when:"2022-11-08T17:21:09Z", issues_found:["This claim conflicts with another agent's independent claim about the same fact."], request_id:"6ed27c5a-216d-4af9-8349-3a592fb390f3"},
  {who:"kg_curator_1", roles:["data_writer"], what:"ADDED: (Metformin)-[treats]->(Diabetes)", when:"2025-08-02T10:07:42Z", issues_found:["Duplicate request_id.", "This claim conflicts with another agent's independent claim about the same fact."], request_id:"3c2b5479-01fa-4192-ba3b-c52c60bc7250"},
];
const SAMPLE_SUMMARY = { routine: 21, priority: 5, conflicts: 1, total: 26 };
const SAMPLE_CONFLICTS = [{subject:"Ibuprofen", predicate:"treats", claims:[["kg_curator_2","Fever"],["kg_curator_1","Headache"],["admin_lead","HighCholesterol"]]}];

async function tryFetch(path, options) {
  if (!API_BASE_URL) return null;
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { ...options, signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function getSummary() {
  const live = await tryFetch('/summary');
  return live ? { data: live, live: true } : { data: SAMPLE_SUMMARY, live: false };
}
export async function getRecords() {
  const live = await tryFetch('/records');
  return live ? { data: live, live: true } : { data: SAMPLE_RECORDS, live: false };
}
export async function getConflicts() {
  const live = await tryFetch('/conflicts');
  return live ? { data: live, live: true } : { data: SAMPLE_CONFLICTS, live: false };
}
export async function askChat(question, apiKey) {
  const live = await tryFetch('/chat', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ question, api_key: apiKey }),
  });
  if (live) return { answer: live.answer, live: true };
  return { answer: "No live backend connected -- set API_BASE_URL in src/config.js to enable real Gemini answers. This is sample mode.", live: false };
}
