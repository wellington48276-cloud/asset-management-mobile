import React, { useState, useEffect } from 'react';
import { ShieldCheck, History, Radio } from 'lucide-react';

export default function Header({ historyCount, onOpenHistory }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString('pt-BR'));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('pt-BR'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header>
      <div className="header-title">
        <h1>
          <ShieldCheck size={22} className="header-logo-icon" />
          GESTÃO PATRIMONIAL
        </h1>
        <div className="header-sub">SISTEMA INTELIGENTE DE BENS MÓVEIS</div>
      </div>

      <div className="header-right">
        <div className="live-clock">
          <Radio size={12} className="pulse-icon" />
          <span>{time}</span>
        </div>

        <button className="history-badge-btn" onClick={onOpenHistory} title="Ver Histórico de Coletas">
          <History size={18} />
          {historyCount > 0 && <span className="history-counter">{historyCount}</span>}
        </button>

        <div className="status-badge">
          <div className="status-dot"></div>
          <span>ONLINE</span>
        </div>
      </div>
    </header>
  );
}
