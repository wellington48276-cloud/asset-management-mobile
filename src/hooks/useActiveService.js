import { useCallback, useState } from 'react';
import { ACTIVE_SERVICE_KEY } from '../config';
import { folderFromPlates } from '../utils/plates';

function readStoredService() {
  try {
    const service = JSON.parse(localStorage.getItem(ACTIVE_SERVICE_KEY) || 'null');
    if (!service?.id || !Array.isArray(service?.plates) || !service.plates.length) return null;
    return service;
  } catch {
    return null;
  }
}

function persist(service) {
  if (service) localStorage.setItem(ACTIVE_SERVICE_KEY, JSON.stringify(service));
  else localStorage.removeItem(ACTIVE_SERVICE_KEY);
}

export function useActiveService() {
  const [activeService, setActiveService] = useState(readStoredService);

  const update = useCallback((updater) => {
    setActiveService((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      const normalized = next ? { ...next, updatedAt: Date.now() } : null;
      persist(normalized);
      return normalized;
    });
  }, []);

  const start = useCallback((plates, session) => {
    const service = {
      id: crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      plates,
      folder: folderFromPlates(plates),
      user: session.name,
      ownerUser: session.user,
      currentIndex: 0,
      skipped: [],
      completed: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    persist(service);
    setActiveService(service);
    return service;
  }, []);

  const clear = useCallback(() => {
    persist(null);
    setActiveService(null);
  }, []);

  return { activeService, start, update, clear };
}
