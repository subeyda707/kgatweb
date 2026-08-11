import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecords, getCleanRecords } from '../api';

function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit'});
}

export default function AuditTrail() {
  const [flagged, setFlagged] = useState([]);
  const [clean, setClean] = useState([]);
  const [filter, setFilter] = useState('flagged');
  const [live, setLive] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getRecords().then(r => { setFlagged(r.data); setLive(r.live); });
    getCleanRecords().then(r => setClean(r.data));
  }, []);

  const conflicts = flagged.filter(r => r.issues_found.some(i => i.toLowerCase().includes('conflict')));
  const view = filter === 'flagged' ? flagged : filter === 'clean' ? clean : filter === 'conflicts' ? conflicts : [...flagged, ...clean];

  const askAbout = (record) => {
    navigate('/chat', { state: { prefill: `Tell me about this event: ${record.what} (recorded by ${record.who})` } });
  };

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
        <h1>Audit Trail</h1>
        <span className={`pill ${live ? 'live' : ''}`}>{live ? 'live backend' : 'sample data'}</span>
      </div>
      <p className="subtitle">Who, what, when, and why — for every event. Click the chat icon to ask about any record.</p>

      <div className="tabs">
        <button className={`tab-btn ${filter==='flagged'?'active':''}`} onClick={()=>setFilter('flagged')}>Flagged ({flagged.length})</button>
        <button className={`tab-btn ${filter==='clean'?'active':''}`} onClick={()=>setFilter('clean')}>Clean ({clean.length})</button>
        <button className={`tab-btn ${filter==='conflicts'?'active':''}`} onClick={()=>setFilter('conflicts')}>Conflicts ({conflicts.length})</button>
        <button className={`tab-btn ${filter==='all'?'active':''}`} onClick={()=>setFilter('all')}>All</button>
      </div>

      {view.length === 0 ? (
        <div className="empty">No records match this filter.</div>
      ) : view.map(r => {
        const isFlagged = r.issues_found && r.issues_found.length > 0;
        return (
          <div key={r.request_id} className={`record-row ${isFlagged ? 'flagged' : ''}`}>
            <div className="record-main">
              <div className="record-top">
                <p className="record-what">{r.what}</p>
                <span className={`badge ${isFlagged ? 'bad' : 'ok'}`}>{isFlagged ? 'flagged' : 'clean'}</span>
              </div>
              <div className="record-meta">
                <span>who: {r.who} ({r.roles.join(',')})</span>
                <span>when: {fmtTime(r.when)}</span>
              </div>
              {isFlagged && r.issues_found.map((issue, i) => <p key={i} className="issue-line">{issue}</p>)}
            </div>
            <div className="ask-icon" title="Ask about this record" onClick={() => askAbout(r)}>💬</div>
          </div>
        );
      })}
    </div>
  );
}
