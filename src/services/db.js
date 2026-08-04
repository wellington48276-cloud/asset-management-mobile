const DB_NAME = 'patrimonio-bens-moveis';
const DB_VERSION = 2;
const STORES = {
  queue: 'queue',
  history: 'history',
  drafts: 'drafts'
};

let databasePromise;

function openDatabase() {
  if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB indisponível.'));
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORES.queue)) {
        const queue = database.createObjectStore(STORES.queue, { keyPath: 'id' });
        queue.createIndex('createdAt', 'createdAt');
      }

      if (!database.objectStoreNames.contains(STORES.history)) {
        const history = database.createObjectStore(STORES.history, { keyPath: 'id' });
        history.createIndex('createdAt', 'createdAt');
      }

      if (!database.objectStoreNames.contains(STORES.drafts)) {
        const drafts = database.createObjectStore(STORES.drafts, { keyPath: 'key' });
        drafts.createIndex('serviceId', 'serviceId');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Falha ao abrir armazenamento local.'));
  });

  return databasePromise;
}

async function transact(storeName, mode, operation) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    let request;

    try {
      request = operation(store);
    } catch (error) {
      reject(error);
      return;
    }

    transaction.oncomplete = () => resolve(request?.result);
    transaction.onerror = () => reject(transaction.error || request?.error || new Error('Falha no armazenamento local.'));
    transaction.onabort = () => reject(transaction.error || new Error('Operação local cancelada.'));
  });
}

function getAll(storeName) {
  return transact(storeName, 'readonly', (store) => store.getAll()).then((items) => items || []);
}

export function putQueue(item) {
  return transact(STORES.queue, 'readwrite', (store) => store.put(item));
}

export function deleteQueue(id) {
  return transact(STORES.queue, 'readwrite', (store) => store.delete(id));
}

export function getQueueItems() {
  return getAll(STORES.queue).then((items) => items.sort((a, b) => a.createdAt - b.createdAt));
}

export function putHistory(item) {
  return transact(STORES.history, 'readwrite', (store) => store.put(item));
}

export function deleteHistory(id) {
  return transact(STORES.history, 'readwrite', (store) => store.delete(id));
}

export function getHistoryItems() {
  return getAll(STORES.history).then((items) => items.sort((a, b) => b.createdAt - a.createdAt));
}

export async function clearSyncedHistory() {
  const items = await getHistoryItems();
  await Promise.all(items.filter((item) => item.status === 'SINCRONIZADO').map((item) => deleteHistory(item.id)));
}

export function draftKey(serviceId, plate) {
  return `${serviceId}:${plate}`;
}

export function putDraft({ serviceId, plate, blob }) {
  return transact(STORES.drafts, 'readwrite', (store) => store.put({
    key: draftKey(serviceId, plate),
    serviceId,
    plate,
    blob,
    updatedAt: Date.now()
  }));
}

export function getDraft(serviceId, plate) {
  return transact(STORES.drafts, 'readonly', (store) => store.get(draftKey(serviceId, plate)));
}

export function deleteDraft(serviceId, plate) {
  return transact(STORES.drafts, 'readwrite', (store) => store.delete(draftKey(serviceId, plate)));
}

export async function renameDraft(serviceId, oldPlate, newPlate) {
  const current = await getDraft(serviceId, oldPlate);
  if (!current) return;
  await putDraft({ serviceId, plate: newPlate, blob: current.blob });
  await deleteDraft(serviceId, oldPlate);
}

export async function getDraftsForService(serviceId) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.drafts, 'readonly');
    const index = transaction.objectStore(STORES.drafts).index('serviceId');
    const request = index.getAll(IDBKeyRange.only(serviceId));
    request.onsuccess = () => resolve((request.result || []).sort((a, b) => a.updatedAt - b.updatedAt));
    request.onerror = () => reject(request.error || new Error('Falha ao carregar fotos temporárias.'));
  });
}

export async function deleteDraftsForService(serviceId) {
  const drafts = await getDraftsForService(serviceId);
  await Promise.all(drafts.map((draft) => deleteDraft(serviceId, draft.plate)));
}
