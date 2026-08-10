import React from 'react';
import { API_BASE_URL } from '../config';

export default function DataSource() {
  return (
    <div>
      <h1>Data Source</h1>
      <p className="subtitle">Where this audit trail's data comes from.</p>

      <div className="card">
        <h3>Backend connection</h3>
        <p className="hint">
          {API_BASE_URL
            ? `Connected to: ${API_BASE_URL}`
            : "No backend connected — showing realistic sample data. Set API_BASE_URL in src/config.js to connect a real backend (Colab, Render, or any server running the KGAT pipeline)."}
        </p>
      </div>

      <div className="card">
        <h3>What the pipeline accepts</h3>
        <p className="hint" style={{marginBottom:0}}>
          Any Knowledge Graph data — a live Neo4j database, an uploaded JSON file in almost any shape,
          or generated synthetic data. The audit logic doesn't care which source it came from; every
          event goes through the same structural checks either way.
        </p>
      </div>
    </div>
  );
}
