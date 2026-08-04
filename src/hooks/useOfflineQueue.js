import { useCallback, useEffect, useMemo, useState } from 'react';
import { salvarServicoRua } from '../services/api';
import {
  limparServicosLocais,
  listarServicos,
  salvarServicoLocal
} from '../services/db';

const makeId = () =>
  crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const csvSafe = (value) => {
  let text = String(value ?? '').replace(/"/g, '""');
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text}"`;
};

export function useOfflineQueue() {
  const [servicosRua, setServicosRua] = useState([]);
  const [sincronizando, setSincronizando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const registros = await listarServicos();
      registros.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
      setServicosRua(registros);
    } catch (error) {
      console.error('Não foi possível carregar o histórico local.', error);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const adicionarServicoRua = useCallback(async (item) => {
    const registro = {
      id: item.id || makeId(),
      chapa: item.chapa,
      patrimoniador: item.patrimoniador,
      pasta: item.pasta,
      dataHora: item.dataHora || new Date().toLocaleString('pt-BR'),
      createdAt: item.createdAt || Date.now(),
      fotoBase64: item.fotoBase64,
      link: item.link || '',
      arquivoId: item.arquivoId || '',
      status: item.synced ? 'SINCRONIZADO' : 'PENDENTE',
      erro: item.erro || ''
    };

    await salvarServicoLocal(registro);
    await carregar();
    return registro;
  }, [carregar]);

  const reenviar = useCallback(async (registro) => {
    const enviando = { ...registro, status: 'ENVIANDO', erro: '' };
    await salvarServicoLocal(enviando);
    await carregar();

    const response = await salvarServicoRua({
      patrimoniador: registro.patrimoniador,
      chapa: registro.chapa,
      pasta: registro.pasta,
      fotoBase64: registro.fotoBase64
    });

    const atualizado = response.success
      ? {
          ...registro,
          status: 'SINCRONIZADO',
          link: response.link || registro.link || '',
          arquivoId: response.arquivoId || registro.arquivoId || '',
          erro: ''
        }
      : {
          ...registro,
          status: response.errorType === 'server' ? 'ERRO' : 'PENDENTE',
          erro: response.error || 'Falha ao reenviar.'
        };

    await salvarServicoLocal(atualizado);
    await carregar();
    return response;
  }, [carregar]);

  const reenviarPendentes = useCallback(async () => {
    if (sincronizando || !navigator.onLine) return;

    const pendentes = servicosRua.filter((item) =>
      item.status === 'PENDENTE' || item.status === 'ERRO'
    );

    if (!pendentes.length) return;

    setSincronizando(true);
    try {
      for (const item of pendentes) {
        const response = await reenviar(item);
        if (!response.success && response.errorType !== 'server') break;
      }
    } finally {
      setSincronizando(false);
    }
  }, [reenviar, servicosRua, sincronizando]);

  useEffect(() => {
    const handleOnline = () => reenviarPendentes();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [reenviarPendentes]);

  const limparHistorico = useCallback(async () => {
    await limparServicosLocais();
    setServicosRua([]);
  }, []);

  const baixar = (blob, nome) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportarCSV = useCallback(() => {
    if (!servicosRua.length) return;
    const rows = [
      ['ID', 'CHAPA', 'PATRIMONIADOR', 'PASTA', 'DATA_HORA', 'STATUS', 'LINK', 'ERRO'],
      ...servicosRua.map((s) => [
        s.id,
        s.chapa,
        s.patrimoniador,
        s.pasta,
        s.dataHora,
        s.status,
        s.link,
        s.erro
      ])
    ];

    baixar(
      new Blob(['\uFEFF' + rows.map((r) => r.map(csvSafe).join(';')).join('\n')], {
        type: 'text/csv;charset=utf-8'
      }),
      `servicos_rua_${Date.now()}.csv`
    );
  }, [servicosRua]);

  const exportarJSON = useCallback(() => {
    if (!servicosRua.length) return;
    baixar(
      new Blob([JSON.stringify(servicosRua, null, 2)], { type: 'application/json' }),
      `servicos_rua_${Date.now()}.json`
    );
  }, [servicosRua]);

  const resumo = useMemo(() => ({
    sincronizados: servicosRua.filter((item) => item.status === 'SINCRONIZADO').length,
    pendentes: servicosRua.filter((item) => item.status === 'PENDENTE' || item.status === 'ENVIANDO').length,
    erros: servicosRua.filter((item) => item.status === 'ERRO').length
  }), [servicosRua]);

  return {
    servicosRua,
    resumo,
    sincronizando,
    adicionarServicoRua,
    reenviar,
    reenviarPendentes,
    limparHistorico,
    exportarCSV,
    exportarJSON
  };
}
