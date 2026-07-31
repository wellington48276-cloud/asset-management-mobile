import React, { useState } from 'react';
import Header from './components/Header';
import LoginScreen from './components/LoginScreen';
import BatchScreen from './components/BatchScreen';
import CameraScreen from './components/CameraScreen';
import HistoryDrawer from './components/HistoryDrawer';
import Footer from './components/Footer';
import { useAudioEffect } from './hooks/useAudioEffect';
import { useOfflineQueue } from './hooks/useOfflineQueue';
import { CheckCircle2, RotateCcw, FileSpreadsheet } from 'lucide-react';

export default function App() {
  const [screen, setScreen] = useState('login'); // 'login' | 'batch' | 'camera' | 'complete'
  const [usuarioAtual, setUsuarioAtual] = useState('');
  const [listaChapas, setListaChapas] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const audioEffect = useAudioEffect();
  const offlineQueue = useOfflineQueue();

  const handleLoginSuccess = (user) => {
    setUsuarioAtual(user);
    setScreen('batch');
  };

  const handleStartBatch = (chapas) => {
    setListaChapas(chapas);
    setScreen('camera');
  };

  const handleFinishBatch = () => {
    setScreen('complete');
  };

  const handleRestart = () => {
    if (audioEffect) audioEffect.playButtonClick();
    setScreen('batch');
    setListaChapas([]);
  };

  const handleColetaRegistrada = (data) => {
    offlineQueue.adicionarColeta(data);
  };

  return (
    <>
      <div className="bg-image"></div>

      <Header
        historyCount={offlineQueue.coletas.length}
        onOpenHistory={() => {
          if (audioEffect) audioEffect.playButtonClick();
          setIsDrawerOpen(true);
        }}
      />

      <main className="app-container">
        {screen === 'login' && (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            playSound={audioEffect}
          />
        )}

        {screen === 'batch' && (
          <BatchScreen
            usuarioAtual={usuarioAtual}
            onStartBatch={handleStartBatch}
            playSound={audioEffect}
          />
        )}

        {screen === 'camera' && (
          <CameraScreen
            listaChapas={listaChapas}
            usuarioAtual={usuarioAtual}
            onFinish={handleFinishBatch}
            playSound={audioEffect}
            onColetaRegistrada={handleColetaRegistrada}
          />
        )}

        {screen === 'complete' && (
          <div className="system-card glass-cyber" style={{ textAlign: 'center' }}>
            <CheckCircle2 size={64} color="#00f2fe" style={{ margin: '0 auto 16px', filter: 'drop-shadow(0 0 10px #00f2fe)' }} />
            <h2 style={{ color: 'var(--cyber-cyan)', marginBottom: '8px' }}>
              VISTORIA CONCLUÍDA!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
              Todos os registros foram auditados, salvos e adicionados ao seu relatório patrimonial.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                className="btn btn-outline"
                onClick={() => {
                  if (audioEffect) audioEffect.playButtonClick();
                  offlineQueue.exportarCSV();
                }}
              >
                <FileSpreadsheet size={18} />
                BAIXAR RELATÓRIO CSV
              </button>

              <button className="btn btn-tech-start" onClick={handleRestart}>
                <RotateCcw size={18} />
                INICIAR NOVO LOTE
              </button>
            </div>
          </div>
        )}
      </main>

      <HistoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        coletas={offlineQueue.coletas}
        onExportCSV={offlineQueue.exportarCSV}
        onExportJSON={offlineQueue.exportarJSON}
        onClear={offlineQueue.limparHistorico}
      />

      <Footer usuarioAtual={usuarioAtual} />
    </>
  );
}
