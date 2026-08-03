import { MoreVertical } from 'lucide-react';
import logoPatrimonio from '../assets/logo-patrimonio.png';

export default function Header({ historyCount, onOpenHistory }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand__icon brand__icon--image">
          <img
            src={logoPatrimonio}
            alt="Logotipo do Patrimônio"
            className="brand__logo"
          />
        </div>

        <div className="brand__text">
          <h1>Patrimônio Bens Móveis</h1>
          <span>Serviço de rua e registro fotográfico</span>
        </div>
      </div>

      <button
        type="button"
        className="icon-button history-menu-button"
        onClick={onOpenHistory}
        aria-label="Abrir histórico de serviços"
        title="Histórico"
      >
        <MoreVertical size={22} />
        {historyCount > 0 && <b>{historyCount}</b>}
      </button>
    </header>
  );
}
