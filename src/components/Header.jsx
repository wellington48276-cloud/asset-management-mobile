import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function Header() {
  return (
    <header>
      <div className="header-title">
        <h1>
          <ShieldCheck size={22} color="#fbc02d" />
          GESTÃO PATRIMONIAL
        </h1>
        <div className="header-sub">SISTEMA DE CONTROLE DE BENS MÓVEIS</div>
      </div>
      <div className="status-badge">
        <div className="status-dot"></div>
        <span>ONLINE</span>
      </div>
    </header>
  );
}
