import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle,
  RefreshCw,
  ShieldCheck,
  SwitchCamera
} from 'lucide-react';
import { salvarServicoRua } from '../services/api';
import PhotoEditor from './PhotoEditor';
import './editor-clean.css';

const CAMERA_SESSION_KEY = 'patrimonio_camera_autorizada';

export default function CameraScreen({
  listaChapas,
  nomePasta,
  patrimoniadorAtual,
  onFinish,
  onBack,
  playSound,
  onServicoRegistrado
}) {
  const [indexAtual, setIndexAtual] = useState(0);
  const [rawImage, setRawImage] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment');
  const [permissionState, setPermissionState] = useState('checking');
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const total = listaChapas.length;
  const chapaAtual = listaChapas[indexAtual] || '';
  const progress = total ? Math.round((indexAtual / total) * 100) : 0;

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setReady(false);
  }, []);

  const requestCamera = useCallback(async ({ forceRestart = false } = {}) => {
    setCameraError('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionState('denied');
      setCameraError('Abra o sistema pelo Chrome ou Safari usando uma conexão HTTPS.');
      return;
    }

    if (streamRef.current && !forceRestart) {
      setReady(true);
      return;
    }

    if (forceRestart) stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 2560 },
          height: { ideal: 1440 }
        }
      });

      streamRef.current = stream;
      sessionStorage.setItem(CAMERA_SESSION_KEY, 'true');
      setPermissionState('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setReady(true);
    } catch (error) {
      setPermissionState(error.name === 'NotAllowedError' ? 'denied' : 'prompt');
      if (error.name === 'NotAllowedError') {
        setCameraError('Permissão negada. Libere a câmera nas configurações do navegador e tente novamente.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('Nenhuma câmera foi encontrada neste aparelho.');
      } else {
        setCameraError('Não foi possível abrir a câmera. Feche outros aplicativos que estejam usando a câmera.');
      }
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    let active = true;

    const checkPermission = async () => {
      try {
        if (navigator.permissions?.query) {
          const status = await navigator.permissions.query({ name: 'camera' });
          if (!active) return;

          if (status.state === 'granted') {
            setPermissionState('granted');
            return;
          }

          if (status.state === 'denied') {
            setPermissionState('denied');
            return;
          }
        }
      } catch {
        // Safari e alguns navegadores não expõem camera na Permissions API.
      }

      if (sessionStorage.getItem(CAMERA_SESSION_KEY) === 'true') {
        setPermissionState('granted');
      } else {
        setPermissionState('prompt');
      }
    };

    checkPermission();
    return () => {
      active = false;
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    if (permissionState === 'granted') {
      requestCamera({ forceRestart: true });
    }
  }, [facingMode, permissionState, requestCamera]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!ready || !video?.videoWidth || !video?.videoHeight || !canvas) return;

    playSound?.playCameraShutter();
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d', { alpha: false });

    if (facingMode === 'user') {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setRawImage(canvas.toDataURL('image/jpeg', 0.92));
  };

  const advance = () => {
    const nextIndex = indexAtual + 1;
    if (nextIndex < total) {
      setIndexAtual(nextIndex);
      setCapturedImage(null);
      setRawImage(null);
      return;
    }

    stopCamera();
    playSound?.playSuccessSound();
    onFinish();
  };

  const save = async () => {
    if (!capturedImage || enviando) return;

    setEnviando(true);
    setNotice('Enviando foto e atualizando a planilha...');

    const response = await salvarServicoRua({
      patrimoniador: patrimoniadorAtual,
      chapa: chapaAtual,
      pasta: nomePasta,
      fotoBase64: capturedImage
    });

    if (response.success) {
      await onServicoRegistrado?.({
        chapa: chapaAtual,
        patrimoniador: patrimoniadorAtual,
        pasta: nomePasta,
        fotoBase64: capturedImage,
        link: response.link || '',
        arquivoId: response.arquivoId || '',
        synced: true
      });
      setNotice(`${chapaAtual}.jpg confirmado no Drive.`);
      setEnviando(false);
      advance();
      return;
    }

    const podeFicarPendente = ['offline', 'network', 'timeout'].includes(response.errorType);

    if (podeFicarPendente) {
      await onServicoRegistrado?.({
        chapa: chapaAtual,
        patrimoniador: patrimoniadorAtual,
        pasta: nomePasta,
        fotoBase64: capturedImage,
        synced: false,
        erro: response.error
      });
      setNotice(`${response.error} A foto ficou pendente para reenvio automático.`);
      setEnviando(false);
      advance();
      return;
    }

    setNotice(response.error || 'O servidor recusou o envio. Tente novamente.');
    setEnviando(false);
  };

  if (!total) {
    return (
      <section className="panel compact">
        <div className="alert error">Nenhuma chapa foi informada.</div>
      </section>
    );
  }

  return (
    <section className="camera-fullscreen">
      <div className="camera-fullscreen__top">
        <button
          type="button"
          className="camera-back"
          onClick={() => {
            stopCamera();
            onBack?.();
          }}
          aria-label="Voltar para preparação"
        >
          <ArrowLeft />
        </button>

        <div>
          <span>ITEM ATUAL</span>
          <strong>{chapaAtual}</strong>
        </div>
        <b>{indexAtual + 1}/{total}</b>
      </div>

      <div className="camera-fullscreen__progress">
        <i style={{ width: `${progress}%` }} />
      </div>

      {notice && <div className="camera-fullscreen__notice">{notice}</div>}

      {permissionState === 'checking' && (
        <div className="camera-permission"><p>Verificando permissão da câmera...</p></div>
      )}

      {(permissionState === 'prompt' || permissionState === 'denied') && !ready ? (
        <div className="camera-permission">
          <ShieldCheck size={48} />
          <h3>Usar a câmera deste celular</h3>
          <p>
            {permissionState === 'denied'
              ? 'A câmera está bloqueada. Libere a permissão do site e tente novamente.'
              : 'Esta confirmação aparece apenas enquanto o navegador ainda não concedeu a permissão.'}
          </p>
          <button className="primary-button" onClick={() => requestCamera({ forceRestart: true })}>
            <Camera size={19} />
            ABRIR CÂMERA
          </button>
        </div>
      ) : (
        <>
          <div className="camera-fullscreen__view">
            {cameraError ? (
              <div className="camera-error">
                <AlertTriangle size={38} />
                <p>{cameraError}</p>
                <button className="secondary-button" onClick={() => requestCamera({ forceRestart: true })}>
                  Tentar novamente
                </button>
              </div>
            ) : (
              <>
                <video ref={videoRef} playsInline autoPlay muted className={capturedImage ? 'hidden' : ''} />
                {capturedImage && (
                  <img
                    src={capturedImage}
                    alt="Foto recortada"
                    className="camera-fullscreen__captured-preview"
                  />
                )}
              </>
            )}
            <canvas ref={canvasRef} hidden />
          </div>

          {!capturedImage ? (
            <div className="camera-fullscreen__actions">
              <button
                className="camera-switch"
                onClick={() => setFacingMode((current) => current === 'environment' ? 'user' : 'environment')}
                aria-label="Trocar câmera"
              >
                <SwitchCamera />
              </button>
              <button className="camera-shutter" onClick={capture} disabled={!ready || Boolean(cameraError)} aria-label="Tirar foto">
                <span />
              </button>
              <span className="camera-action-spacer" />
            </div>
          ) : (
            <div className="camera-fullscreen__confirm">
              <button className="secondary-button" onClick={() => setCapturedImage(null)} disabled={enviando}>
                <RefreshCw />
                Refazer
              </button>
              <button className="primary-button" onClick={save} disabled={enviando}>
                <CheckCircle />
                {enviando ? 'ENVIANDO...' : 'CONFIRMAR'}
              </button>
            </div>
          )}
        </>
      )}

      {rawImage && (
        <PhotoEditor
          image={rawImage}
          onCancel={() => setRawImage(null)}
          onConfirm={(result) => {
            setCapturedImage(result);
            setRawImage(null);
            playSound?.playScanBeep();
          }}
        />
      )}
    </section>
  );
}
