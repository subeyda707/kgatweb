import React, { useState, useEffect } from 'react';
import { getRecords } from '../api';

function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit'});
}

export default function AuditTrail() {
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState('all');
  const [live, setLive] = useState(false);

  useEffect(() => { getRecords().then(r => { setRecords(r.data); setLive(r.live); }); }, []);

  const filtered = filter === 'conflicts'
    ? records.filter(r => r.issues_found.some(i => i.toLowerCase().includes('conflict')))
    : records;

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
        <h1>Audit Trail</h1>
        <span className={`pill ${live ? 'live' : ''}`}>{live ? 'live backend' : 'sample data'}</span>
      </div>
      <p className="subtitle">Who, what, when, and why — for every flagged event.</p>

      <div className="tabs">
        <button className={`tab-btn ${filter==='all'?'active':''}`} onClick={()=>setFilter('all')}>All flagged</button>
        <button className={`tab-btn ${filter==='conflicts'?'active':''}`} onClick={()=>setFilter('conflicts')}>Conflicts only</button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">No records match this filter.</div>
      ) : filtered.map(r => (
        <div key={r.request_id} className="record-row flagged">
          <div className="record-top">
            <p className="record-what">{r.what}</p>
            <span className="badge bad">flagged</span>
          </div>
          <div className="record-meta">
            <span>who: {r.who} ({r.roles.join(',')})</span>
            <span>when: {fmtTime(r.when)}</span>
          </div>
          {r.issues_found.map((issue, i) => <p key={i} className="issue-line">{issue}</p>)}
        </div>
      ))}
    </div>
  );
}
