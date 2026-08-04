import { CloudUpload, Download, ExternalLink, FolderOpen, RefreshCw, Trash2, X } from 'lucide-react';

export default function HistoryDrawer({
  isOpen,
  onClose,
  servicosRua,
  pendingCount,
  syncing,
  onRetryAll,
  onRetryItem,
  onExportCSV,
  onExportJSON,
  onClear,
  onRemove
}) {
  return (
    <>
      <div className={`drawer-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`drawer ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen} aria-label="Histórico de serviços">
        <div className="drawer-head">
          <div><span className="eyebrow">REGISTROS</span><h2>Histórico de serviços</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar histórico"><X /></button>
        </div>

        {pendingCount > 0 && (
          <button type="button" className="sync-banner" onClick={onRetryAll} disabled={syncing}>
            {syncing ? <RefreshCw className="spin" /> : <CloudUpload />}
            <span><strong>{pendingCount} envio(s) pendente(s)</strong><small>{navigator.onLine ? 'Toque para tentar novamente' : 'Aguardando conexão com a internet'}</small></span>
          </button>
        )}

        <div className="drawer-list">
          {!servicosRua.length ? (
            <div className="empty"><FolderOpen size={42} /><p>Nenhum serviço de rua registrado.</p></div>
          ) : (
            servicosRua.map((servico) => (
              <article className="history-item" key={servico.id}>
                <div className="history-item__top">
                  <strong>#{servico.chapa}</strong>
                  <small className={servico.status === 'PENDENTE' ? 'pending' : ''}>{servico.status}</small>
                </div>
                <span>Pasta: {servico.pasta}</span>
                <span>Patrimoniador: {servico.patrimoniador}</span>
                {servico.fileName && <span>Arquivo: {servico.fileName}</span>}
                <time>{servico.dataHora}</time>
                {servico.lastError && <em>{servico.lastError}</em>}
                <div className="history-item__actions">
                  {servico.status === 'PENDENTE' && <button type="button" onClick={() => onRetryItem(servico.id)}><RefreshCw size={15} /> Reenviar</button>}
                  {servico.link && <a href={servico.link} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Abrir</a>}
                  {servico.status === 'SINCRONIZADO' && <button type="button" onClick={() => onRemove(servico.id)} aria-label="Remover registro"><Trash2 size={15} /></button>}
                </div>
              </article>
            ))
          )}
        </div>

        <div className="drawer-actions">
          <button type="button" onClick={onExportCSV}><Download size={16} /> CSV</button>
          <button type="button" onClick={onExportJSON}><Download size={16} /> JSON</button>
          <button type="button" className="danger" onClick={onClear}><Trash2 size={16} /> Limpar sincronizados</button>
        </div>
      </aside>
    </>
  );
}
