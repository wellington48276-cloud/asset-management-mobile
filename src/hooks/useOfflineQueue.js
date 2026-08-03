import { useCallback, useEffect, useRef, useState } from 'react';
import { SYNC_INTERVAL_MS } from '../config';
import {
  deleteHistory,
  deleteQueue,
  getHistoryItems,
  getQueueItems,
  putHistory,
  putQueue
} from '../services/db';
import { salvarServicoRua } from '../services/api';
import { dataUrlToBlob } from '../utils/image';

const LEGACY_STORAGE_KEY = 'patrimonio_servicos_rua_v1';

const csvSafe = (value) => {
  let text = String(value ?? '').replace(/"/g, '""');
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text}"`;
};


async function migrateLegacyStorage() {
  const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return;

  try {
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return;

    for (const legacy of items) {
      const id = legacy.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const history = {
        id,
        serviceId: legacy.serviceId || 'legado',
        chapa: legacy.chapa || '',
        patrimoniador: legacy.patrimoniador || '',
        usuario: legacy.usuario || '',
        pasta: legacy.pasta || '',
        createdAt: Number(legacy.createdAt || Date.now()),
        updatedAt: Date.now(),
        dataHora: legacy.dataHora || new Date().toLocaleString('pt-BR'),
        status: legacy.status === 'SINCRONIZADO' ? 'SINCRONIZADO' : 'PENDENTE',
        attempts: Number(legacy.attempts || 0),
        link: legacy.link || ''
      };
      await putHistory(history);

      if (history.status === 'PENDENTE' && legacy.fotoBase64) {
        try {
          await putQueue({
            id,
            chapa: history.chapa,
            pasta: history.pasta,
            fotoBlob: dataUrlToBlob(legacy.fotoBase64),
            createdAt: history.createdAt,
            history
          });
        } catch (error) {
          console.warn('Uma foto antiga não pôde ser migrada.', error);
        }
      }
    }
  } finally {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function useOfflineQueue(session, onUnauthorized) {
  const [servicosRua, setServicosRua] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const [history, queue] = await Promise.all([getHistoryItems(), getQueueItems()]);
      if (!session?.user) {
        setServicosRua([]);
        setPendingCount(0);
        return;
      }
      const belongsToSession = (item) => !item.usuario || item.usuario === session.user;
      const queueBelongsToSession = (item) => belongsToSession(item.history || {});
      setServicosRua(history.filter(belongsToSession));
      setPendingCount(queue.filter(queueBelongsToSession).length);
    } catch (error) {
      console.warn('Não foi possível ler o histórico local.', error);
    }
  }, [session?.user]);

  const syncPending = useCallback(async () => {
    if (syncingRef.current || !session?.token || !navigator.onLine) return;
    syncingRef.current = true;
    setSyncing(true);

    try {
      const allItems = await getQueueItems();
      const items = allItems.filter((item) => !item.history?.usuario || item.history.usuario === session.user);
      for (const item of items) {
        const response = await salvarServicoRua({
          token: session.token,
          requestId: item.id,
          chapa: item.chapa,
          pasta: item.pasta,
          fotoBlob: item.fotoBlob
        });

        if (response.unauthorized) {
          onUnauthorized?.();
          break;
        }

        if (!response.success) {
          await putHistory({
            ...item.history,
            status: 'PENDENTE',
            lastError: response.error,
            attempts: (item.history.attempts || 0) + 1,
            updatedAt: Date.now()
          });
          continue;
        }

        await putHistory({
          ...item.history,
          usuario: item.history.usuario || session.user,
          patrimoniador: item.history.patrimoniador || session.name,
          status: 'SINCRONIZADO',
          lastError: '',
          attempts: (item.history.attempts || 0) + 1,
          fileId: response.fileId,
          fileName: response.fileName,
          folderId: response.folderId,
          folderName: response.folderName,
          link: response.webViewLink || '',
          size: Number(response.size || 0),
          modifiedTime: response.modifiedTime || '',
          updatedAt: Date.now()
        });
        await deleteQueue(item.id);
      }
    } finally {
      syncingRef.current = false;
      setSyncing(false);
      await refresh();
    }
  }, [onUnauthorized, refresh, session?.name, session?.token, session?.user]);

  const enqueueService = useCallback(async (service, drafts) => {
    for (const draft of drafts) {
      const id = `${service.id}:${draft.plate}`;
      const history = {
        id,
        serviceId: service.id,
        chapa: draft.plate,
        patrimoniador: session?.name || service.user,
        usuario: session?.user || '',
        pasta: service.folder,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        dataHora: new Date().toLocaleString('pt-BR'),
        status: 'PENDENTE',
        attempts: 0,
        link: ''
      };

      await putQueue({
        id,
        chapa: draft.plate,
        pasta: service.folder,
        fotoBlob: draft.blob,
        createdAt: Date.now(),
        history
      });
      await putHistory(history);
    }

    await refresh();
    syncPending();
  }, [refresh, session?.name, session?.user, syncPending]);

  const retryItem = useCallback(async (id) => {
    const items = await getQueueItems();
    const item = items.find((current) => current.id === id);
    if (item) {
      item.createdAt = Date.now() - 1;
      await putQueue(item);
    }
    await syncPending();
  }, [syncPending]);

  const limparHistorico = useCallback(async () => {
    await Promise.all(
      servicosRua
        .filter((item) => item.status === 'SINCRONIZADO')
        .map((item) => deleteHistory(item.id))
    );
    await refresh();
  }, [refresh, servicosRua]);

  const removerRegistro = useCallback(async (id) => {
    await deleteHistory(id);
    await refresh();
  }, [refresh]);

  const exportarCSV = useCallback(() => {
    if (!servicosRua.length) return;
    const rows = [
      ['ID', 'CHAPA', 'PATRIMONIADOR', 'PASTA', 'DATA_HORA', 'STATUS', 'ARQUIVO', 'TAMANHO', 'LINK'],
      ...servicosRua.map((item) => [
        item.id,
        item.chapa,
        item.patrimoniador,
        item.pasta,
        item.dataHora,
        item.status,
        item.fileName || '',
        item.size || '',
        item.link || ''
      ])
    ];
    download(new Blob(['\uFEFF' + rows.map((row) => row.map(csvSafe).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' }), `servicos_rua_${Date.now()}.csv`);
  }, [servicosRua]);

  const exportarJSON = useCallback(() => {
    if (!servicosRua.length) return;
    download(new Blob([JSON.stringify(servicosRua, null, 2)], { type: 'application/json' }), `servicos_rua_${Date.now()}.json`);
  }, [servicosRua]);

  useEffect(() => {
    migrateLegacyStorage().finally(refresh);
  }, [refresh]);

  useEffect(() => {
    const handleOnline = () => syncPending();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') syncPending();
    };
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);
    const timer = window.setInterval(syncPending, SYNC_INTERVAL_MS);
    syncPending();
    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(timer);
    };
  }, [syncPending]);

  return {
    servicosRua,
    pendingCount,
    syncing,
    enqueueService,
    syncPending,
    retryItem,
    limparHistorico,
    removerRegistro,
    exportarCSV,
    exportarJSON
  };
}
