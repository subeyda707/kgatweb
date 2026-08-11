import React, { useState, useEffect, useMemo } from 'react';
import { getGraph } from '../api';

export default function KnowledgeGraph() {
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [live, setLive] = useState(false);
  const [hovered, setHovered] = useState(null);

  useEffect(() => { getGraph().then(r => { setGraph(r.data); setLive(r.live); }); }, []);

  const layout = useMemo(() => {
    const degree = {};
    graph.edges.forEach(e => {
      degree[e.source] = (degree[e.source]||0) + 1;
      degree[e.target] = (degree[e.target]||0) + 1;
    });
    const nodes = [...graph.nodes].sort((a,b) => (degree[b]||0) - (degree[a]||0));
    const cx = 480, cy = 280, R = Math.min(220, 90 + nodes.length * 8);
    const pos = {};
    nodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / nodes.length;
      pos[n] = [cx + R * Math.cos(angle), cy + R * Math.sin(angle)];
    });
    return { pos, degree };
  }, [graph]);

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
        <h1>Knowledge Graph</h1>
        <span className={`pill ${live ? 'live' : ''}`}>{live ? 'live backend' : 'sample data'}</span>
      </div>
      <p className="subtitle">Every entity and relationship in the audited graph, colored by verification status.</p>

      <div className="legend">
        <span><span className="legend-dot" style={{background:'var(--success)'}}></span>Clean</span>
        <span><span className="legend-dot" style={{background:'var(--danger)'}}></span>Flagged</span>
      </div>

      {graph.nodes.length === 0 ? (
        <div className="empty">No graph data yet.</div>
      ) : (
        <svg className="graph-canvas" viewBox="0 0 960 560" style={{height: 560}}>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10" fill="none" stroke="context-stroke" strokeWidth="1.5" />
            </marker>
          </defs>
          {graph.edges.map((e, i) => {
            const [x1,y1] = layout.pos[e.source] || [0,0];
            const [x2,y2] = layout.pos[e.target] || [0,0];
            const color = e.flagged ? '#f87171' : '#34d399';
            const dimmed = hovered && hovered !== e.source && hovered !== e.target;
            const mx = (x1+x2)/2, my = (y1+y2)/2;
            return (
              <g key={i} opacity={dimmed ? 0.15 : 1}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.5" markerEnd="url(#arrow)" opacity="0.75" />
                <text x={mx} y={my} fontSize="9.5" fill={color} textAnchor="middle" fontFamily="JetBrains Mono, monospace">{e.label}</text>
              </g>
            );
          })}
          {graph.nodes.map((n) => {
            const [x,y] = layout.pos[n] || [0,0];
            const r = 20 + Math.min(16, (layout.degree[n]||0) * 3);
            const dimmed = hovered && hovered !== n;
            return (
              <g key={n} opacity={dimmed ? 0.25 : 1} style={{cursor:'pointer'}}
                 onMouseEnter={()=>setHovered(n)} onMouseLeave={()=>setHovered(null)}>
                <circle cx={x} cy={y} r={r} fill="#14151c" stroke="#8b7bff" strokeWidth="1.5" />
                <text x={x} y={y} fontSize="10.5" fill="#f7f7fa" textAnchor="middle" dominantBaseline="central" fontWeight="600">
                  {n.length > 11 ? n.slice(0,10)+'…' : n}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
