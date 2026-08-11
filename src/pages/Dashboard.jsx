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
      <div className="hero">
        <p className="hero-kicker">KNOWLEDGE GRAPH AUDIT TRAIL</p>
        <h1 className="hero-title">Every fact, <span className="accent">verified</span>.</h1>
        {!live && <span className="pill sample" style={{marginTop:14, display:'inline-block'}}>sample data</span>}
      </div>

      <div className="metric-grid">
        <div className="metric-card glass">
          <p className="metric-label">Total events</p>
          <p className="metric-value huge">{summary.total}</p>
        </div>
        <div className="metric-card glass">
          <p className="metric-label">Routine</p>
          <p className="metric-value huge">{summary.routine}</p>
        </div>
        <div className="metric-card glass">
          <p className="metric-label">Flagged</p>
          <p className="metric-value huge danger">{summary.priority}</p>
        </div>
        <div className="metric-card glass">
          <p className="metric-label">Conflicts</p>
          <p className="metric-value huge danger">{summary.conflicts}</p>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14}}>
        <Link to="/graph" className="nav-card">
          <h3>Knowledge Graph →</h3>
          <p>Every entity and relationship, live.</p>
        </Link>
        <Link to="/audit" className="nav-card">
          <h3>Audit Trail →</h3>
          <p>Filter, review, and ask about any event.</p>
        </Link>
      </div>

      {conflicts.length > 0 && (
        <div className="card">
          <h3>Active conflicts</h3>
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
