import { useCallback, useEffect, useState } from 'react';
const KEY = 'patrimonio_coletas_v2';
const makeId = () => crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const csvSafe = value => {
  let text = String(value ?? '').replace(/"/g, '""');
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text}"`;
};

export function useOfflineQueue() {
  const [coletas, setColetas] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(coletas)); } catch (e) { console.warn('Armazenamento cheio', e); } }, [coletas]);
  const adicionarColeta = useCallback(item => setColetas(prev => [{
    id: makeId(), chapa: item.chapa, operador: item.operador, dataHora: new Date().toLocaleString('pt-BR'),
    fotoBase64: item.fotoBase64, status: item.synced ? 'SINCRONIZADO' : 'PENDENTE'
  }, ...prev]), []);
  const limparHistorico = useCallback(() => setColetas([]), []);
  const exportarCSV = useCallback(() => {
    if (!coletas.length) return;
    const rows = [['ID','CHAPA','OPERADOR','DATA_HORA','STATUS'], ...coletas.map(c => [c.id,c.chapa,c.operador,c.dataHora,c.status])];
    const blob = new Blob(['\uFEFF' + rows.map(r => r.map(csvSafe).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `relatorio_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }, [coletas]);
  const exportarJSON = useCallback(() => {
    if (!coletas.length) return;
    const blob = new Blob([JSON.stringify(coletas, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `inventario_${Date.now()}.json`; a.click(); URL.revokeObjectURL(a.href);
  }, [coletas]);
  return { coletas, adicionarColeta, limparHistorico, exportarCSV, exportarJSON };
}
