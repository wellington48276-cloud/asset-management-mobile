import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  Grid3X3,
  RefreshCw,
  ShieldCheck,
  SwitchCamera,
  X
} from 'lucide-react';
import { salvarColetaData } from '../services/api';
import PhotoEditor from './PhotoEditor';

export default function CameraScreen({ listaChapas, usuarioAtual, onFinish, playSound, onColetaRegistrada }) {
  const [indexAtual, setIndexAtual] = useState(0);
  const [rawImage, setRawImage] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment');
  const [showGrid, setShowGrid] = useState(true);
  const [permissionAsked, setPermissionAsked] = useState(false);
  const [ready, setReady] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const total = listaChapas.length;
  const chapaAtual = listaChapas[indexAtual] || '';
  const pct = total ? Math.round(((indexAtual + (capturedImage ? 1 : 0)) / total) * 100) : 0;

  const stop = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setReady(false);
  };

  useEffect(() => () => stop(), []);

  const requestCamera = async () => {
    setPermissionAsked(true);
    setCameraError('');
    stop();

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Este navegador não oferece acesso à câmera. Abra o sistema no Chrome ou Safari usando HTTPS.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 4096 },
          height: { ideal: 3072 },
          frameRate: { ideal: 30 }
        }
      });

      streamRef.current = stream;
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setReady(true);
    } catch (error) {
      const message = error.name === 'NotAllowedError'
        ? 'Permissão negada. Toque no cadeado do navegador, permita a câmera e tente novamente.'
        : error.name === 'NotFoundError'
          ? 'Nenhuma câmera foi encontrada neste aparelho.'
          : 'Não foi possível abrir a câmera. Feche outros aplicativos que estejam usando a câmera e tente novamente.';
      setCameraError(message);
    }
  };

  useEffect(() => {
    if (permissionAsked) requestCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!ready || !video?.videoWidth || !canvas) return;

    playSound?.playCameraShutter();

    const maxWidth = 3264;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);

    const context = canvas.getContext('2d', { alpha: false });
    if (facingMode === 'user') {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    setRawImage(canvas.toDataURL('image/jpeg', 0.98));
  };

  const save = async () => {
    setEnviando(true);
    const response = await salvarColetaData(usuarioAtual, chapaAtual, capturedImage);

    onColetaRegistrada?.({
      chapa: chapaAtual,
      operador: usuarioAtual,
      fotoBase64: capturedImage,
      synced: Boolean(response.success)
    });

    setEnviando(false);
    const next = indexAtual + 1;

    if (next < total) {
      setIndexAtual(next);
      setCapturedImage(null);
      setRawImage(null);
    } else {
      stop();
      playSound?.playSuccessSound();
      onFinish();
    }
  };

  if (!total) {
    return <section className="panel compact"><div className="alert error">Nenhuma chapa foi informada.</div></section>;
  }

  if (!permissionAsked) {
    return (
      <section className="panel compact permission-card">
        <ShieldCheck size={48} />
        <h2>Permitir câmera do celular</h2>
        <p>A câmera será aberta em tela cheia. Depois da foto, você poderá recortar, ampliar, reposicionar e rotacionar a imagem.</p>
        <button className="primary-button" onClick={requestCamera}>
          <Camera size={20} /> PERMITIR E ABRIR CÂMERA
        </button>
      </section>
    );
  }

  return (
    <div className="camera-fullscreen" role="dialog" aria-label="Câmera para coleta patrimonial">
      <div className="camera-fullscreen-top">
        <div>
          <span>BEM ATUAL</span>
          <strong>#{chapaAtual}</strong>
        </div>
        <div className="camera-fullscreen-progress">{indexAtual + 1} de {total}</div>
      </div>

      <div className="camera-fullscreen-track"><i style={{ width: `${pct}%` }} /></div>

      <div className="camera-fullscreen-view">
        {cameraError ? (
          <div className="camera-error fullscreen-error">
            <AlertTriangle size={42} />
            <p>{cameraError}</p>
            <button className="secondary-button" onClick={requestCamera}>Tentar novamente</button>
          </div>
        ) : (
          <>
            <video ref={videoRef} playsInline autoPlay muted className={capturedImage ? 'hidden' : ''} />
            {capturedImage && <img src={capturedImage} alt="Foto ajustada" />}
            {showGrid && !capturedImage && <div className="camera-grid" />}
            {!capturedImage && <div className="focus-frame" />}
          </>
        )}
        <canvas ref={canvasRef} hidden />
      </div>

      <div className="camera-fullscreen-bottom">
        {!capturedImage ? (
          <>
            <button type="button" className={`round-tool ${showGrid ? 'active' : ''}`} onClick={() => setShowGrid((value) => !value)}>
              <Grid3X3 />
              <span>Grade</span>
            </button>

            <button className="shutter-button" onClick={capture} disabled={!ready || Boolean(cameraError)} aria-label="Tirar foto">
              <span />
            </button>

            <button type="button" className="round-tool" onClick={() => setFacingMode((value) => value === 'environment' ? 'user' : 'environment')}>
              <SwitchCamera />
              <span>Inverter</span>
            </button>
          </>
        ) : (
          <div className="fullscreen-confirm-row">
            <button className="secondary-button" onClick={() => setCapturedImage(null)} disabled={enviando}>
              <RefreshCw /> Refazer
            </button>
            <button className="primary-button" onClick={save} disabled={enviando}>
              <CheckCircle /> {enviando ? 'SALVANDO...' : 'CONFIRMAR'}
            </button>
          </div>
        )}
      </div>

      {rawImage && (
        <PhotoEditor
          image={rawImage}
          onCancel={() => setRawImage(null)}
          onConfirm={(image) => {
            setCapturedImage(image);
            setRawImage(null);
            playSound?.playScanBeep();
          }}
        />
      )}
    </div>
  );
}
