import { Cloud, LogOut, MoreVertical } from 'lucide-react';
import logoPatrimonio from '../assets/logo-patrimonio.png';

export default function Header({ historyCount, pendingCount, userName, onOpenHistory, onLogout }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand__icon">
          <img src={logoPatrimonio} alt="Logotipo do Patrimônio" className="brand__logo" />
        </div>
        <div className="brand__text">
          <h1>Patrimônio Bens Móveis</h1>
          <span>Serviço de rua e registro fotográfico</span>
        </div>
      </div>

      {userName && (
        <div className="topbar__actions">
          {pendingCount > 0 && (
            <span className="sync-chip" title={`${pendingCount} foto(s) aguardando envio`}>
              <Cloud size={15} />
              {pendingCount}
            </span>
          )}

          <button type="button" className="icon-button topbar__logout" onClick={onLogout} aria-label="Sair do sistema" title="Sair">
            <LogOut size={19} />
          </button>

          <button type="button" className="icon-button history-menu-button" onClick={onOpenHistory} aria-label="Abrir histórico de serviços" title="Histórico">
            <MoreVertical size={22} />
            {historyCount > 0 && <b>{historyCount > 99 ? '99+' : historyCount}</b>}
          </button>
        </div>
      )}
    </header>
  );
}
