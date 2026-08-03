import { Boxes, History } from 'lucide-react';

export default function Header({ historyCount, onOpenHistory }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand__icon"><Boxes size={22} /></div>
        <div>
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
