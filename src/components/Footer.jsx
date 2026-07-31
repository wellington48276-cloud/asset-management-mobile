import React from 'react';
import { Cpu, ShieldCheck } from 'lucide-react';

export default function Footer({ usuarioAtual }) {
  return (
    <footer>
      <div className="footer-content">
        <div className="footer-status">
          <Cpu size={14} className="glow-icon" />
          <span>SISTEMA INTEGRADO DE BENS MÓVEIS • CONTROL-PAT PRO</span>
        </div>
        {usuarioAtual && (
          <div className="footer-user-badge">
            <ShieldCheck size={12} />
            <span>OPERADOR AUDITADO: {usuarioAtual.toUpperCase()}</span>
          </div>
        )}
      </div>
    </footer>
  );
}
