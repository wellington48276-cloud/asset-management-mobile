const DB_NAME = 'patrimonio-mobile';
const DB_VERSION = 1;
const STORE = 'servicos';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('pasta', 'pasta', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Falha ao abrir o armazenamento local.'));
  });
}

function run(mode, action) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const request = action(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Falha no armazenamento local.'));
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error('Falha na transação local.'));
    };
  }));
}

export function listarServicos() {
  return run('readonly', (store) => store.getAll());
}

export function salvarServicoLocal(servico) {
  return run('readwrite', (store) => store.put(servico));
}

export function removerServicoLocal(id) {
  return run('readwrite', (store) => store.delete(id));
}

export function limparServicosLocais() {
  return run('readwrite', (store) => store.clear());
}
