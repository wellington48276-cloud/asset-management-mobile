import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  RefreshCw,
  ShieldCheck,
  SwitchCamera
} from 'lucide-react';
import { salvarColetaData } from '../services/api';
import PhotoEditor from './PhotoEditor';
import './editor-clean.css';

export default function CameraScreen({
  listaChapas,
  usuarioAtual,
  onFinish,
  playSound,
  onColetaRegistrada
}) {
  const [indexAtual, setIndexAtual] = useState(0);
  const [rawImage, setRawImage] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment');
  const [permissionAsked, setPermissionAsked] = useState(false);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const total = listaChapas.length;
  const chapaAtual = listaChapas[indexAtual] || '';
  const progress = total ? Math.round((indexAtual / total) * 100) : 0;

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setReady(false);
  };

  useEffect(() => () => stopCamera(), []);

  const requestCamera = async () => {
    setPermissionAsked(true);
    setCameraError('');
    stopCamera();

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Abra o sistema pelo Chrome ou Safari usando uma conexão HTTPS.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 3840 },
          height: { ideal: 2160 }
        }
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setReady(true);
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        setCameraError('Permissão negada. Libere a câmera nas configurações do navegador e tente novamente.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('Nenhuma câmera foi encontrada neste aparelho.');
      } else {
        setCameraError('Não foi possível abrir a câmera. Feche outros aplicativos que estejam usando a câmera.');
      }
    }
  };

  useEffect(() => {
    if (permissionAsked) requestCamera();
  }, [facingMode]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!ready || !video?.videoWidth || !canvas) return;

    playSound?.playCameraShutter();

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d', { alpha: false });

    if (facingMode === 'user') {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setRawImage(canvas.toDataURL('image/jpeg', 0.97));
  };

  const save = async () => {
    setEnviando(true);

    const response = await salvarColetaData(
      usuarioAtual,
      chapaAtual,
      capturedImage
    );

    onColetaRegistrada?.({
      chapa: chapaAtual,
      operador: usuarioAtual,
      fotoBase64: capturedImage,
      synced: Boolean(response.success)
    });

    setNotice(
      response.success
        ? 'Registro enviado com sucesso.'
        : 'Registro salvo no aparelho e aguardando conexão.'
    );

    setEnviando(false);

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
        <div>
          <span>ITEM ATUAL</span>
          <strong>#{chapaAtual}</strong>
        </div>
        <b>{indexAtual + 1}/{total}</b>
      </div>

      <div className="camera-fullscreen__progress">
        <i style={{ width: `${progress}%` }} />
      </div>

      {notice && <div className="camera-fullscreen__notice">{notice}</div>}

      {!permissionAsked ? (
        <div className="camera-permission">
          <ShieldCheck size={48} />
          <h3>Usar a câmera deste celular</h3>
          <p>Toque no botão abaixo e permita o acesso quando o navegador solicitar.</p>
          <button className="primary-button" onClick={requestCamera}>
            <Camera size={19} />
            PERMITIR E ABRIR CÂMERA
          </button>
        </div>
      ) : (
        <>
          <div className="camera-fullscreen__view">
            {cameraError ? (
              <div className="camera-error">
                <AlertTriangle size={38} />
                <p>{cameraError}</p>
                <button className="secondary-button" onClick={requestCamera}>
                  Tentar novamente
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className={capturedImage ? 'hidden' : ''}
                />
                {capturedImage && (
                  <img src={capturedImage} alt="Foto recortada" />
                )}
              </>
            )}

            <canvas ref={canvasRef} hidden />
          </div>

          {!capturedImage ? (
            <div className="camera-fullscreen__actions">
              <button
                className="camera-switch"
                onClick={() =>
                  setFacingMode((current) =>
                    current === 'environment' ? 'user' : 'environment'
                  )
                }
                aria-label="Trocar câmera"
              >
                <SwitchCamera />
              </button>

              <button
                className="camera-shutter"
                onClick={capture}
                disabled={!ready || Boolean(cameraError)}
                aria-label="Tirar foto"
              >
                <span />
              </button>

              <span className="camera-action-spacer" />
            </div>
          ) : (
            <div className="camera-fullscreen__confirm">
              <button
                className="secondary-button"
                onClick={() => {
                  setCapturedImage(null);
                  setRawImage(null);
                }}
                disabled={enviando}
              >
                <RefreshCw />
                Refazer
              </button>

              <button
                className="primary-button"
                onClick={save}
                disabled={enviando}
              >
                <CheckCircle />
                {enviando ? 'SALVANDO...' : 'CONFIRMAR'}
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
