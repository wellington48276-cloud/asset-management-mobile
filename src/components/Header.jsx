import { Boxes, History } from 'lucide-react';
export default function Header({ historyCount, onOpenHistory }) {
  return <header className="topbar">
    <div className="brand"><Boxes size={25}/><div><h1>INTEGRAÇÃO E TRATAMENTO DE PATRIMÔNIO</h1><span>Monitoramento inteligente de ativos</span></div></div>
    <button className="icon-button" onClick={onOpenHistory} aria-label="Abrir histórico"><History size={21}/>{historyCount > 0 && <b>{historyCount}</b>}</button>
  </header>;
}
