import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { importGraph } from '../api';

export default function DataSource() {
  const [status, setStatus] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef(null);
  const navigate = useNavigate();

  const handleFile = async (file) => {
    setStatus({ loading: true });
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = await importGraph(parsed);
      if (result.success) {
        setStatus({ loading: false, success: true, count: result.triples_count });
        setTimeout(() => navigate('/'), 1200);
      } else {
        setStatus({ loading: false, success: false, error: result.error });
      }
    } catch (e) {
      setStatus({ loading: false, success: false, error: 'Could not parse this file as JSON.' });
    }
  };

  return (
    <div>
      <h1>Import</h1>
      <p className="subtitle">Drop in any Knowledge Graph JSON — triples, or objects with flexible field names.</p>

      <div
        className="upload-zone"
        style={{ borderColor: dragging ? 'var(--violet)' : undefined }}
        onClick={() => fileInput.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
      >
        <div className="upload-icon">⬆</div>
        <p style={{fontSize:15, fontWeight:600, marginBottom:6}}>Drop a JSON file, or click to browse</p>
        <p style={{fontSize:12.5, color:'var(--text-2)'}}>Accepts [subject, predicate, object] lists or flexible-key objects</p>
      </div>
      <input ref={fileInput} type="file" accept=".json" style={{display:'none'}}
             onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />

      {status?.loading && <p style={{marginTop:16, color:'var(--text-2)', fontSize:13.5}}>Importing…</p>}
      {status?.success && <p style={{marginTop:16, color:'var(--success)', fontSize:13.5}}>Imported {status.count} relationships — redirecting to Dashboard…</p>}
      {status?.success === false && <p style={{marginTop:16, color:'var(--danger)', fontSize:13.5}}>{status.error}</p>}
    </div>
  );
}
