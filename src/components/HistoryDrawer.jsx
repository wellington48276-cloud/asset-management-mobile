import { X, Download, Trash2 } from 'lucide-react';
export default function HistoryDrawer({ isOpen,onClose,coletas,onExportCSV,onExportJSON,onClear }) {
  return <><div className={`drawer-backdrop ${isOpen?'open':''}`} onClick={onClose}/><aside className={`drawer ${isOpen?'open':''}`}>
    <div className="drawer-head"><h2>Histórico</h2><button className="icon-button" onClick={onClose}><X/></button></div>
    <div className="drawer-list">{!coletas.length?<p className="empty">Nenhum registro ainda.</p>:coletas.map(c=><article className="history-item" key={c.id}><strong>#{c.chapa}</strong><span>{c.dataHora}</span><small className={c.status==='PENDENTE'?'pending':''}>{c.status}</small></article>)}</div>
    <div className="drawer-actions"><button onClick={onExportCSV}><Download size={16}/> CSV</button><button onClick={onExportJSON}><Download size={16}/> JSON</button><button className="danger" onClick={onClear}><Trash2 size={16}/> Limpar</button></div>
  </aside></>;
}
