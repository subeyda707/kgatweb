import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 8}}>
        <div>
          <p style={{fontFamily:"'JetBrains Mono', monospace", fontSize:12, color:'var(--violet)', letterSpacing:2, marginBottom:10}}>KNOWLEDGE GRAPH AUDIT TRAIL</p>
          <h1 style={{fontSize:42, lineHeight:1.1, maxWidth:640}}>Every fact, verified.<br/>Every change, explained.</h1>
        </div>
        <span className={`pill ${live ? 'live' : ''}`}>{live ? 'live backend' : 'sample data'}</span>
      </div>
      <p className="subtitle" style={{fontSize:16, maxWidth:600}}>Deterministic checks catch what shouldn't be trusted. An AI explains only what's already been verified.</p>

      <div className="metric-grid">
        <div className="metric-card">
          <p className="metric-label">Total events</p>
          <p className="metric-value">{summary.total}</p>
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

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:18}}>
        <Link to="/graph" className="card" style={{textDecoration:'none', display:'block'}}>
          <h3>Explore the Knowledge Graph →</h3>
          <p className="hint" style={{marginBottom:0}}>See every entity and relationship, colored by verification status.</p>
        </Link>
        <Link to="/audit" className="card" style={{textDecoration:'none', display:'block'}}>
          <h3>Review the Audit Trail →</h3>
          <p className="hint" style={{marginBottom:0}}>Filter flagged, clean, and conflicting events. Ask the AI about any record.</p>
        </Link>
      </div>

      {conflicts.length > 0 && (
        <div className="card">
          <h3>Active conflicts</h3>
          <p className="hint">Multiple agents disagree about the same fact — routed to review, never silently resolved.</p>
          {conflicts.map((c, i) => (
            <p key={i} style={{fontSize:13, fontFamily:"'JetBrains Mono', monospace", color:'var(--text-2)'}}>
              {c.subject} {c.predicate}: {c.claims.map(cl => `${cl[0]}=${cl[1]}`).join(', ')}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
