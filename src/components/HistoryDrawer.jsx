import React from 'react';
import { X, Download, FileSpreadsheet, Trash2, Tag, Clock, CheckCircle2 } from 'lucide-react';

export default function HistoryDrawer({ isOpen, onClose, coletas, onExportCSV, onExportJSON, onClear }) {
  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title">
            <FileSpreadsheet size={20} className="glow-icon" />
            <span>HISTÓRICO DE COLETAS ({coletas.length})</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="drawer-actions">
          <button className="btn btn-outline btn-sm" onClick={onExportCSV} disabled={coletas.length === 0}>
            <Download size={14} />
            EXPORTAR CSV
          </button>
          <button className="btn btn-outline btn-sm" onClick={onExportJSON} disabled={coletas.length === 0}>
            <FileSpreadsheet size={14} />
            EXPORTAR JSON
          </button>
          {coletas.length > 0 && (
            <button className="btn btn-outline btn-sm btn-danger" onClick={onClear}>
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <div className="drawer-body">
          {coletas.length === 0 ? (
            <div className="empty-history">
              <Tag size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p>Nenhuma chapa registrada nesta sessão.</p>
            </div>
          ) : (
            <div className="history-list">
              {coletas.map((item) => (
                <div className="history-card" key={item.id}>
                  {item.fotoBase64 ? (
                    <img src={item.fotoBase64} alt={`Chapa ${item.chapa}`} className="history-thumb" />
                  ) : (
                    <div className="history-thumb-placeholder">
                      <Tag size={24} />
                    </div>
                  )}
                  <div className="history-info">
                    <div className="history-chapa">CHAPA #{item.chapa}</div>
                    <div className="history-meta">
                      <span><Clock size={12} /> {item.dataHora}</span>
                    </div>
                    <div className="history-meta">
                      <span className="status-tag">
                        <CheckCircle2 size={12} /> {item.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
