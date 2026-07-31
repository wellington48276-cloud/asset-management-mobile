import React, { useState } from 'react';
import Header from './components/Header';
import LoginScreen from './components/LoginScreen';
import BatchScreen from './components/BatchScreen';
import CameraScreen from './components/CameraScreen';
import Footer from './components/Footer';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [screen, setScreen] = useState('login'); // 'login' | 'batch' | 'camera' | 'complete'
  const [usuarioAtual, setUsuarioAtual] = useState('');
  const [listaChapas, setListaChapas] = useState([]);

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
    setScreen('batch');
    setListaChapas([]);
  };

  return (
    <>
      <div className="bg-image"></div>
      <Header />

      <main className="app-container">
        {screen === 'login' && (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        )}

        {screen === 'batch' && (
          <BatchScreen usuarioAtual={usuarioAtual} onStartBatch={handleStartBatch} />
        )}

        {screen === 'camera' && (
          <CameraScreen
            listaChapas={listaChapas}
            usuarioAtual={usuarioAtual}
            onFinish={handleFinishBatch}
          />
        )}

        {screen === 'complete' && (
          <div className="system-card" style={{ textAlign: 'center' }}>
            <CheckCircle2 size={64} color="#15803d" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ color: 'var(--primary-blue)', marginBottom: '8px' }}>
              PROCESSO CONCLUÍDO!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
              Todos os registros foram validados e sincronizados na planilha de controle patrimonial.
            </p>
            <button className="btn btn-tech-start" onClick={handleRestart}>
              INICIAR NOVO LOTE
            </button>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
