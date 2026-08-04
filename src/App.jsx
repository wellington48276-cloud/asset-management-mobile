import { useMemo, useState } from 'react';
import { CheckCircle2, FileSpreadsheet, RotateCcw } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginScreen from './components/LoginScreen';
import BatchScreen from './components/BatchScreen';
import CameraScreen from './components/CameraScreen';
import HistoryDrawer from './components/HistoryDrawer';
import { useAudioEffect } from './hooks/useAudioEffect';
import { useOfflineQueue } from './hooks/useOfflineQueue';

export default function App() {
  const [screen, setScreen] = useState('login');
  const [patrimoniadorAtual, setPatrimoniadorAtual] = useState('');
  const [listaChapas, setListaChapas] = useState([]);
  const [nomePasta, setNomePasta] = useState('');
  const [drawer, setDrawer] = useState(false);
  const audio = useAudioEffect();
  const queue = useOfflineQueue();

  const resumoPasta = useMemo(() => {
    const itens = queue.servicosRua.filter((item) => item.pasta === nomePasta);
    return {
      sincronizados: itens.filter((item) => item.status === 'SINCRONIZADO').length,
      pendentes: itens.filter((item) => item.status === 'PENDENTE' || item.status === 'ENVIANDO').length,
      erros: itens.filter((item) => item.status === 'ERRO').length
    };
  }, [nomePasta, queue.servicosRua]);

  const iniciarServicoRua = (chapas) => {
    if (!Array.isArray(chapas) || !chapas.length) return;
    setListaChapas(chapas);
    setNomePasta(chapas.length === 1 ? chapas[0] : `${chapas[0]} a ${chapas[chapas.length - 1]}`);
    setScreen('camera');
  };

  return (
    <div className={`app-shell app-shell--${screen}`}>
      <div className="ambient-bg" />
      <Header historyCount={queue.servicosRua.length} onOpenHistory={() => setDrawer(true)} />

      <main className="app-main">
        {screen === 'login' && (
          <LoginScreen
            playSound={audio}
            onLoginSuccess={(nome) => {
              setPatrimoniadorAtual(nome);
              setScreen('batch');
            }}
          />
        )}

        {screen === 'batch' && (
          <BatchScreen
            usuarioAtual={patrimoniadorAtual}
            playSound={audio}
            onStartBatch={iniciarServicoRua}
          />
        )}

        {screen === 'camera' && (
          <CameraScreen
            listaChapas={listaChapas}
            nomePasta={nomePasta}
            patrimoniadorAtual={patrimoniadorAtual}
            playSound={audio}
            onServicoRegistrado={queue.adicionarServicoRua}
            onBack={() => setScreen('batch')}
            onFinish={() => setScreen('complete')}
          />
        )}

        {screen === 'complete' && (
          <section className="panel compact complete">
            <CheckCircle2 size={58} />
            <h2>Serviço finalizado</h2>
            <p>Pasta: <strong>{nomePasta}</strong></p>
            <div className="complete-summary">
              <span><strong>{resumoPasta.sincronizados}</strong> sincronizadas</span>
              <span><strong>{resumoPasta.pendentes}</strong> pendentes</span>
              <span><strong>{resumoPasta.erros}</strong> com erro</span>
            </div>
            <button className="secondary-button" onClick={queue.exportarCSV}>
              <FileSpreadsheet /> Baixar relatório CSV
            </button>
            <button
              className="primary-button"
              onClick={() => {
                setListaChapas([]);
                setNomePasta('');
                setScreen('batch');
              }}
            >
              <RotateCcw /> Iniciar novo serviço de rua
            </button>
          </section>
        )}
      </main>

      <Footer usuarioAtual={patrimoniadorAtual} />
      <HistoryDrawer
        isOpen={drawer}
        onClose={() => setDrawer(false)}
        servicosRua={queue.servicosRua}
        onExportCSV={queue.exportarCSV}
        onExportJSON={queue.exportarJSON}
        onClear={queue.limparHistorico}
        onRetry={queue.reenviar}
        onRetryAll={queue.reenviarPendentes}
        sincronizando={queue.sincronizando}
      />
    </div>
  );
}
