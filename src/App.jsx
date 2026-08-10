import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AuditTrail from './pages/AuditTrail';
import Chat from './pages/Chat';
import DataSource from './pages/DataSource';

export default function App() {
  return (
    <div className="app-shell">
      <nav className="sidebar">
        <div className="brand"><span className="brand-dot"></span>KGAT</div>
        <NavLink to="/" end className={({isActive}) => "nav-link" + (isActive ? " active" : "")}>
          <span className="nav-icon">◈</span> Dashboard
        </NavLink>
        <NavLink to="/audit" className={({isActive}) => "nav-link" + (isActive ? " active" : "")}>
          <span className="nav-icon">≡</span> Audit Trail
        </NavLink>
        <NavLink to="/chat" className={({isActive}) => "nav-link" + (isActive ? " active" : "")}>
          <span className="nav-icon">✦</span> Chat
        </NavLink>
        <NavLink to="/source" className={({isActive}) => "nav-link" + (isActive ? " active" : "")}>
          <span className="nav-icon">⬡</span> Data Source
        </NavLink>
      </nav>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/audit" element={<AuditTrail />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/source" element={<DataSource />} />
        </Routes>
      </main>
    </div>
  );
}
