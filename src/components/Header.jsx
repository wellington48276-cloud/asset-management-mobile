import React, { useState, useEffect } from 'react';
import { ShieldCheck, History } from 'lucide-react';

export default function Header({ historyCount, onOpenHistory }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header>
      <div className="header-title">
        <ShieldCheck size={20} className="header-logo-icon" />
        <div>
          <h1>GESTÃO PATRIMONIAL</h1>
          <div className="header-sub">Coleta de Bens Móveis</div>
        </div>
      </div>

      <div className="header-right">
        <span className="live-clock">{time}</span>
        <button className="history-badge-btn" onClick={onOpenHistory} title="Histórico">
          <History size={18} />
          {historyCount > 0 && <span className="history-counter">{historyCount}</span>}
        </button>
      </div>
    </header>
  );
}
