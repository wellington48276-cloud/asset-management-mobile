import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Cloud, FileSpreadsheet, RotateCcw } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginScreen from './components/LoginScreen';
import BatchScreen from './components/BatchScreen';
import CameraScreen from './components/CameraScreen';
import HistoryDrawer from './components/HistoryDrawer';
import { useAudioEffect } from './hooks/useAudioEffect';
import { useActiveService } from './hooks/useActiveService';
import { useOfflineQueue } from './hooks/useOfflineQueue';
import { logoutUsuario, validarSessao } from './services/api';
import { deleteDraftsForService } from './services/db';
import { clearSession, loadSession, saveSession } from './services/session';

export default function App() {
  const [session, setSession] = useState(loadSession);
  const [screen, setScreen] = useState(() => (loadSession() ? 'batch' : 'login'));
  const [drawer, setDrawer] = useState(false);
  const [lastService, setLastService] = useState(null);
  const audio = useAudioEffect();
  const active = useActiveService();

  const handleUnauthorized = useCallback(() => {
    clearSession();
    setSession(null);
    setScreen('login');
    setDrawer(false);
  }, []);

  const queue = useOfflineQueue(session, handleUnauthorized);
  const ownedActiveService = active.activeService && (!active.activeService.ownerUser || active.activeService.ownerUser === session?.user)
    ? active.activeService
    : null;

  useEffect(() => {
    if (!session?.token || !navigator.onLine) return;
    validarSessao(session.token).then((result) => {
      if (result.unauthorized) handleUnauthorized();
    });
  }, [handleUnauthorized, session?.token]);

  const handleLogin = (nextSession) => {
    saveSession(nextSession);
    setSession(nextSession);
    setScreen('batch');
  };

  const handleLogout = async () => {
    await logoutUsuario(session?.token);
    handleUnauthorized();
  };

  const startService = (plates) => {
    if (!Array.isArray(plates) || !plates.length || !session) return;
    active.start(plates, session);
    setScreen('camera');
  };

  const cancelActiveService = async () => {
    if (!ownedActiveService) return;
    if (!window.confirm('Cancelar o serviço em andamento e remover as fotos temporárias?')) return;
    await deleteDraftsForService(ownedActiveService.id);
    active.clear();
    setScreen('batch');
  };

  const finalizeService = async (drafts) => {
    const service = ownedActiveService;
    if (!service) return;
    await queue.enqueueService(service, drafts);
    await deleteDraftsForService(service.id);
    setLastService({ folder: service.folder, total: drafts.length });
    active.clear();
    audio.playSuccessSound();
    setScreen('complete');
  };

  return (
    <div className={`app-shell app-shell--${screen}`}>
      <div className="ambient-bg" />
      <Header
        historyCount={queue.servicosRua.length}
        pendingCount={queue.pendingCount}
        userName={session?.name}
        onOpenHistory={() => setDrawer(true)}
        onLogout={handleLogout}
      />

      <main className="app-main">
        {screen === 'login' && <LoginScreen playSound={audio} onLoginSuccess={handleLogin} />}

        {screen === 'batch' && session && (
          <BatchScreen
            usuarioAtual={session.name}
            activeService={ownedActiveService}
            pendingCount={queue.pendingCount}
            playSound={audio}
            onStartBatch={startService}
            onResume={() => setScreen('camera')}
            onCancelActive={cancelActiveService}
          />
        )}

        {screen === 'camera' && ownedActiveService && (
          <CameraScreen
            service={ownedActiveService}
            onUpdateService={active.update}
            onCancel={() => { active.clear(); setScreen('batch'); }}
            onFinalize={finalizeService}
            playSound={audio}
          />
        )}

        {screen === 'complete' && (
          <section className="panel compact complete">
            <CheckCircle2 size={58} />
            <h2>Serviço de rua concluído</h2>
            <p>{lastService?.total || 0} foto(s) foram preparadas para a pasta <strong>{lastService?.folder}</strong>.</p>
            {queue.pendingCount > 0 ? (
              <div className="alert info"><Cloud size={18} /> {queue.pendingCount} foto(s) aguardam envio e serão sincronizadas automaticamente.</div>
            ) : (
              <div className="alert success">Todas as fotos foram confirmadas no Drive.</div>
            )}
            <button className="secondary-button" onClick={queue.exportarCSV}><FileSpreadsheet /> Baixar relatório CSV</button>
            <button className="primary-button" onClick={() => { setLastService(null); setScreen('batch'); }}><RotateCcw /> Iniciar novo serviço de rua</button>
          </section>
        )}
      </main>

      <Footer />

      <HistoryDrawer
        isOpen={drawer}
        onClose={() => setDrawer(false)}
        servicosRua={queue.servicosRua}
        pendingCount={queue.pendingCount}
        syncing={queue.syncing}
        onRetryAll={queue.syncPending}
        onRetryItem={queue.retryItem}
        onExportCSV={queue.exportarCSV}
        onExportJSON={queue.exportarJSON}
        onClear={queue.limparHistorico}
        onRemove={queue.removerRegistro}
      />
    </div>
  );
}
