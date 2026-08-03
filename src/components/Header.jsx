import { History } from 'lucide-react';
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
        className="icon-button"
        onClick={onOpenHistory}
        aria-label="Abrir histórico"
      >
        <History size={20} />
        {historyCount > 0 && <b>{historyCount}</b>}
      </button>
    </header>
  );
}
