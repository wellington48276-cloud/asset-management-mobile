import { Boxes, History } from 'lucide-react';
export default function Header({ historyCount, onOpenHistory }) {
  return <header className="topbar">
    <div className="brand"><Boxes size={25}/><div><h1>Patrimônio Bens Móveis</h1><span>Patrimônio Bens Móveis</span></div></div>
    <button className="icon-button" onClick={onOpenHistory} aria-label="Abrir histórico"><History size={21}/>{historyCount > 0 && <b>{historyCount}</b>}</button>
  </header>;
}
