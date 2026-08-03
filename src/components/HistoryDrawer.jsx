import { Download, FolderOpen, Trash2, X } from 'lucide-react';

export default function HistoryDrawer({ isOpen, onClose, servicosRua, onExportCSV, onExportJSON, onClear }) {
  return (
    <>
      <div className={`drawer-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <aside className={`drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-head">
          <div><span className="eyebrow">REGISTROS</span><h2>Histórico de serviços</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar histórico"><X /></button>
        </div>

        <div className="drawer-list">
          {!servicosRua.length ? (
            <div className="empty"><FolderOpen size={42} /><p>Nenhum serviço de rua registrado.</p></div>
          ) : servicosRua.map((servico) => (
            <article className="history-item" key={servico.id}>
              <div className="history-item__top"><strong>#{servico.chapa}</strong><small className={servico.status === 'PENDENTE' ? 'pending' : ''}>{servico.status}</small></div>
              <span>{servico.pasta}</span>
              <span>Patrimoniador: {servico.patrimoniador}</span>
              <time>{servico.dataHora}</time>
            </article>
          ))}
        </div>

        <div className="drawer-actions">
          <button onClick={onExportCSV}><Download size={16} /> CSV</button>
          <button onClick={onExportJSON}><Download size={16} /> JSON</button>
          <button className="danger" onClick={onClear}><Trash2 size={16} /> Limpar histórico</button>
        </div>
      </aside>
    </>
  );
}
