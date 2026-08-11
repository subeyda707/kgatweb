import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { askChat } from '../api';

export default function Chat() {
  const location = useLocation();
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Ask me anything about the audit log — I'll only answer from verified records." }
  ]);
  const [input, setInput] = useState(location.state?.prefill || '');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({behavior:'smooth'}); }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const question = input;
    setMessages(m => [...m, {role:'user', text: question}]);
    setInput('');
    setLoading(true);
    const result = await askChat(question, apiKey);
    setMessages(m => [...m, {role:'assistant', text: result.answer}]);
    setLoading(false);
  };

  return (
    <div>
      <h1>Chat</h1>
      <p className="subtitle">Grounded in verified records only — never invents what it doesn't know.</p>

      <details style={{marginBottom:18}}>
        <summary style={{fontSize:12.5, color:'var(--text-2)', cursor:'pointer'}}>Advanced — Gemini API key</summary>
        <div style={{marginTop:10}}>
          <input type="password" placeholder="paste your key here" value={apiKey} onChange={e=>setApiKey(e.target.value)} />
        </div>
      </details>

      <div className="chat-shell">
        <div className="chat-messages">
          {messages.map((m, i) => <div key={i} className={`msg ${m.role}`}>{m.text}</div>)}
          {loading && <div className="msg assistant">Thinking…</div>}
          <div ref={endRef} />
        </div>
        <div className="chat-input-row">
          <input
            placeholder="Ask a question…"
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==='Enter' && send()}
          />
          <button className="send" onClick={send}>Send</button>
        </div>
      </div>
    </div>
  );
}
