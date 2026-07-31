import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'patrimonio_coletas_v1';

export function useOfflineQueue() {
  const [coletas, setColetas] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(coletas));
    } catch (e) {
      console.warn("Storage quota limit reached", e);
    }
  }, [coletas]);

  const adicionarColeta = useCallback((item) => {
    const novaColeta = {
      id: Date.now().toString(),
      chapa: item.chapa,
      operador: item.operador || item.vistoriador,
      dataHora: new Date().toLocaleString('pt-BR'),
      fotoBase64: item.fotoBase64,
      status: item.synced ? 'SINCRONIZADO' : 'PENDENTE'
    };
    setColetas(prev => [novaColeta, ...prev]);
    return novaColeta;
  }, []);

  const limparHistorico = useCallback(() => {
    setColetas([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const exportarCSV = useCallback(() => {
    if (coletas.length === 0) return;
    const header = "ID;CHAPA;OPERADOR;DATA_HORA;STATUS\n";
    const rows = coletas.map(c => `${c.id};"${c.chapa}";"${c.operador || c.vistoriador || ''}";"${c.dataHora}";"${c.status}"`).join("\n");
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(header + rows);
    
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `relatorio_patrimonio_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [coletas]);

  const exportarJSON = useCallback(() => {
    if (coletas.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(coletas, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `inventario_patrimonial_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [coletas]);

  return {
    coletas,
    adicionarColeta,
    limparHistorico,
    exportarCSV,
    exportarJSON
  };
}
