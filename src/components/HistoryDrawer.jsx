import { X, Download, Trash2 } from 'lucide-react';
export default function HistoryDrawer({ isOpen, onClose, servicosRua, onExportCSV, onExportJSON, onClear }) {
  return <><div className={`drawer-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose}/><aside className={`drawer ${isOpen ? 'open' : ''}`}>
    <div className="drawer-head"><h2>Histórico de serviços de rua</h2><button className="icon-button" onClick={onClose}><X/></button></div>
    <div className="drawer-list">{!servicosRua.length ? <p className="empty">Nenhum serviço de rua registrado.</p> : servicosRua.map((s) => <article className="history-item" key={s.id}><strong>#{s.chapa}</strong><span>{s.pasta}</span><span>Patrimoniador: {s.patrimoniador}</span><span>{s.dataHora}</span><small className={s.status === 'PENDENTE' ? 'pending' : ''}>{s.status}</small></article>)}</div>
    <div className="drawer-actions"><button onClick={onExportCSV}><Download size={16}/> CSV</button><button onClick={onExportJSON}><Download size={16}/> JSON</button><button className="danger" onClick={onClear}><Trash2 size={16}/> Limpar</button></div>
  </aside></>;
}
