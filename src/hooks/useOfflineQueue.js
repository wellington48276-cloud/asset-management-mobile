import { useCallback, useEffect, useState } from 'react';
const STORAGE_KEY = 'patrimonio_servicos_rua_v1';
const makeId = () => crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const csvSafe = (value) => {
  let text = String(value ?? '').replace(/"/g, '""');
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text}"`;
};

export function useOfflineQueue() {
  const [servicosRua, setServicosRua] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(servicosRua)); }
    catch (error) { console.warn('Armazenamento do aparelho cheio.', error); }
  }, [servicosRua]);

  const adicionarServicoRua = useCallback((item) => setServicosRua((prev) => [{
    id: makeId(), chapa: item.chapa, patrimoniador: item.patrimoniador, pasta: item.pasta,
    dataHora: new Date().toLocaleString('pt-BR'), fotoBase64: item.fotoBase64,
    link: item.link || '', status: item.synced ? 'SINCRONIZADO' : 'PENDENTE'
  }, ...prev]), []);

  const limparHistorico = useCallback(() => setServicosRua([]), []);

  const baixar = (blob, nome) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = nome; a.click(); URL.revokeObjectURL(url);
  };

  const exportarCSV = useCallback(() => {
    if (!servicosRua.length) return;
    const rows = [['ID','CHAPA','PATRIMONIADOR','PASTA','DATA_HORA','STATUS','LINK'], ...servicosRua.map((s) => [s.id,s.chapa,s.patrimoniador,s.pasta,s.dataHora,s.status,s.link])];
    baixar(new Blob(['\uFEFF' + rows.map((r) => r.map(csvSafe).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' }), `servicos_rua_${Date.now()}.csv`);
  }, [servicosRua]);

  const exportarJSON = useCallback(() => {
    if (!servicosRua.length) return;
    baixar(new Blob([JSON.stringify(servicosRua, null, 2)], { type: 'application/json' }), `servicos_rua_${Date.now()}.json`);
  }, [servicosRua]);

  return { servicosRua, adicionarServicoRua, limparHistorico, exportarCSV, exportarJSON };
}
