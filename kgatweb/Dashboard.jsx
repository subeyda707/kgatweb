import React, { useState, useEffect } from 'react';
import { getSummary, getConflicts } from '../api';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [live, setLive] = useState(false);

  useEffect(() => {
    getSummary().then(r => { setSummary(r.data); setLive(r.live); });
    getConflicts().then(r => setConflicts(r.data));
  }, []);

  if (!summary) return null;

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
        <h1>Dashboard</h1>
        <span className={`pill ${live ? 'live' : ''}`}>{live ? 'live backend' : 'sample data'}</span>
      </div>
      <p className="subtitle">Every event checked. Only what needs attention gets explained.</p>

      <div className="metric-grid">
        <div className="metric-card">
          <p className="metric-label">Total events</p>
          <p className="metric-value pulse-ring">{summary.total}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Routine</p>
          <p className="metric-value">{summary.routine}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Flagged</p>
          <p className="metric-value danger">{summary.priority}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Conflicts</p>
          <p className="metric-value danger">{summary.conflicts}</p>
        </div>
      </div>

      <div className="card">
        <h3>How this works</h3>
        <p className="hint" style={{marginBottom:0}}>
          Every Knowledge Graph event is checked against deterministic rules — duplicate IDs, unauthorized
          actions, forged authorization tokens, and multi-agent conflicts. The AI only explains what's
          already been verified; it never judges its own output.
        </p>
      </div>

      {conflicts.length > 0 && (
        <div className="card">
          <h3>Active conflicts</h3>
          <p className="hint">Multiple agents disagree about the same fact.</p>
          {conflicts.map((c, i) => (
            <p key={i} style={{fontSize:13, fontFamily:'var(--font-mono)', color:'var(--text-2)'}}>
              {c.subject} {c.predicate}: {c.claims.map(cl => `${cl[0]}=${cl[1]}`).join(', ')}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
