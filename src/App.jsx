import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import KnowledgeGraph from './pages/KnowledgeGraph';
import AuditTrail from './pages/AuditTrail';
import Chat from './pages/Chat';
import DataSource from './pages/DataSource';

export default function App() {
  return (
    <div>
      <nav className="topnav">
        <div className="brand"><span className="brand-dot"></span>KGAT</div>
        <div className="nav-links">
          <NavLink to="/" end className={({isActive}) => "nav-link" + (isActive ? " active" : "")}>Dashboard</NavLink>
          <NavLink to="/graph" className={({isActive}) => "nav-link" + (isActive ? " active" : "")}>Knowledge Graph</NavLink>
          <NavLink to="/audit" className={({isActive}) => "nav-link" + (isActive ? " active" : "")}>Audit Trail</NavLink>
          <NavLink to="/chat" className={({isActive}) => "nav-link" + (isActive ? " active" : "")}>Chat</NavLink>
          <NavLink to="/source" className={({isActive}) => "nav-link" + (isActive ? " active" : "")}>Import</NavLink>
        </div>
      </nav>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/graph" element={<KnowledgeGraph />} />
          <Route path="/audit" element={<AuditTrail />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/source" element={<DataSource />} />
        </Routes>
      </main>
    </div>
  );
}
