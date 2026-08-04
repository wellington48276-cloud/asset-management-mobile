import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle,
  Edit3,
  ListChecks,
  RefreshCw,
  ShieldCheck,
  SkipForward,
  SwitchCamera
} from 'lucide-react';
import {
  deleteDraft,
  getDraft,
  putDraft,
  renameDraft
} from '../services/db';
import { dataUrlToBlob } from '../utils/image';
import { folderFromPlates, onlyDigits, replacePlate } from '../utils/plates';
import PhotoEditor from './PhotoEditor';
import ServiceReview from './ServiceReview';
import './editor-clean.css';

const CAMERA_SESSION_KEY = 'patrimonio_camera_autorizada_sessao';

const waitForVideoElement = async (videoRef) => {
  for (let attempt = 0; attempt < 15; attempt += 1) {
    if (videoRef.current) return videoRef.current;
    await new Promise((resolve) => setTimeout(resolve, 16));
  }
  return videoRef.current;
};

export default function CameraScreen({
  service,
  onUpdateService,
  onBack,
  onFinalize,
  playSound
}) {
  const [indexAtual, setIndexAtualState] = useState(Math.min(service.currentIndex || 0, service.plates.length - 1));
  const [rawImage, setRawImage] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment');
  const [permissionAsked, setPermissionAsked] = useState(false);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const openingCameraRef = useRef(false);
  const previousFacingModeRef = useRef(facingMode);

  const total = service.plates.length;
  const chapaAtual = service.plates[indexAtual] || '';
  const progress = total ? Math.round(((indexAtual + 1) / total) * 100) : 0;
  const isSkipped = service.skipped?.includes(chapaAtual);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setReady(false);
  }, []);

  const requestCamera = useCallback(async () => {
    if (openingCameraRef.current) return;
    openingCameraRef.current = true;
    setPermissionAsked(true);
    setCameraError('');
    stopCamera();

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Abra o sistema pelo Chrome ou Safari usando uma conexão HTTPS.');
      openingCameraRef.current = false;
      return;
    }

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
      const video = await waitForVideoElement(videoRef);

      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error('VIDEO_ELEMENT_NOT_READY');
      }

      video.srcObject = stream;
      await video.play();
      sessionStorage.setItem(CAMERA_SESSION_KEY, '1');
      setReady(true);
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        sessionStorage.removeItem(CAMERA_SESSION_KEY);
        setCameraError('Permissão negada. Libere a câmera nas configurações do navegador e tente novamente.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('Nenhuma câmera foi encontrada neste aparelho.');
      } else {
        setCameraError('Não foi possível abrir a câmera. Feche outros aplicativos que estejam usando a câmera.');
      }
    } finally {
      openingCameraRef.current = false;
    }
  }, [facingMode, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    let active = true;

    const restoreCameraPermission = async () => {
      let alreadyGranted = sessionStorage.getItem(CAMERA_SESSION_KEY) === '1';

      if (!alreadyGranted && navigator.permissions?.query) {
        try {
          const permission = await navigator.permissions.query({ name: 'camera' });
          alreadyGranted = permission.state === 'granted';
          if (alreadyGranted) sessionStorage.setItem(CAMERA_SESSION_KEY, '1');
        } catch {
          // Alguns navegadores móveis não oferecem consulta da permissão da câmera.
        }
      }

      if (active && alreadyGranted) setPermissionAsked(true);
    };

    restoreCameraPermission();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (
      permissionAsked &&
      !reviewing &&
      !capturedBlob &&
      !cameraError &&
      !streamRef.current &&
      sessionStorage.getItem(CAMERA_SESSION_KEY) === '1'
    ) {
      requestCamera();
    }
  }, [permissionAsked, reviewing, capturedBlob, cameraError, chapaAtual, requestCamera]);

  useEffect(() => {
    if (previousFacingModeRef.current === facingMode) return;
    previousFacingModeRef.current = facingMode;

    if (
      permissionAsked &&
      !reviewing &&
      !capturedBlob &&
      sessionStorage.getItem(CAMERA_SESSION_KEY) === '1'
    ) {
      requestCamera();
    }
  }, [facingMode, permissionAsked, reviewing, capturedBlob, requestCamera]);

  useEffect(() => {
    let alive = true;
    setRawImage(null);
    setCapturedBlob(null);
    setNotice('');

    getDraft(service.id, chapaAtual).then((draft) => {
      if (!alive) return;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (draft?.blob) {
        setCapturedBlob(draft.blob);
        setPreviewUrl(URL.createObjectURL(draft.blob));
      } else {
        setPreviewUrl('');
      }
    });

    return () => {
      alive = false;
    };
  }, [service.id, chapaAtual]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const setCurrentIndex = (nextIndex) => {
    const bounded = Math.max(0, Math.min(total - 1, nextIndex));
    setIndexAtualState(bounded);
    onUpdateService((current) => ({ ...current, currentIndex: bounded }));
  };

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
    setRawImage(canvas.toDataURL('image/jpeg', 0.92));
  };

  const storeEditedPhoto = async (dataUrl) => {
    setSavingDraft(true);
    try {
      const blob = dataUrlToBlob(dataUrl);
      await putDraft({ serviceId: service.id, plate: chapaAtual, blob });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setCapturedBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      setRawImage(null);
      onUpdateService((current) => ({
        ...current,
        skipped: (current.skipped || []).filter((plate) => plate !== chapaAtual),
        completed: Array.from(new Set([...(current.completed || []), chapaAtual]))
      }));
      playSound?.playScanBeep();
      setNotice(`${chapaAtual}.jpg guardado com segurança no aparelho.`);
    } finally {
      setSavingDraft(false);
    }
  };

  const advance = () => {
    if (indexAtual + 1 < total) {
      setCurrentIndex(indexAtual + 1);
      return;
    }
    stopCamera();
    setReviewing(true);
  };

  const skipCurrent = () => {
    onUpdateService((current) => ({
      ...current,
      skipped: Array.from(new Set([...(current.skipped || []), chapaAtual]))
    }));
    advance();
  };

  const editPlate = async () => {
    const next = onlyDigits(window.prompt('Digite o novo número da chapa:', chapaAtual));
    if (!next || next === chapaAtual) return;
    if (service.plates.some((plate, index) => index !== indexAtual && plate === next)) {
      setNotice('Essa chapa já existe neste serviço.');
      return;
    }

    await renameDraft(service.id, chapaAtual, next);
    const plates = replacePlate(service.plates, indexAtual, next);
    onUpdateService((current) => ({
      ...current,
      plates,
      folder: folderFromPlates(plates),
      skipped: (current.skipped || []).map((plate) => (plate === chapaAtual ? next : plate)),
      completed: (current.completed || []).map((plate) => (plate === chapaAtual ? next : plate))
    }));
  };

  const goBack = () => {
    stopCamera();
    onBack();
  };

  const reviewGoTo = (index) => {
    setReviewing(false);
    setCurrentIndex(index);
    setPermissionAsked(sessionStorage.getItem(CAMERA_SESSION_KEY) === '1');
    setCameraError('');
  };

  const finalize = async (drafts) => {
    await onFinalize(drafts);
  };

  const redoPhoto = async () => {
    await deleteDraft(service.id, chapaAtual);
    onUpdateService((current) => ({
      ...current,
      completed: (current.completed || []).filter((plate) => plate !== chapaAtual)
    }));
    setCapturedBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setCameraError('');
    setPermissionAsked(sessionStorage.getItem(CAMERA_SESSION_KEY) === '1');
  };

  const previewClass = useMemo(() => (capturedBlob ? 'has-preview' : ''), [capturedBlob]);

  if (reviewing) {
    return <ServiceReview service={service} onBack={() => setReviewing(false)} onGoTo={reviewGoTo} onFinalize={finalize} />;
  }

  if (!total) return <section className="panel compact"><div className="alert error">Nenhuma chapa foi informada.</div></section>;

  return (
    <section className={`camera-fullscreen ${previewClass}`}>
      <div className="camera-fullscreen__top">
        <button type="button" className="camera-top-button" onClick={goBack} aria-label="Voltar para a preparação"><ArrowLeft /></button>
        <div className="camera-current">
          <span>ITEM ATUAL</span>
          <strong>{chapaAtual}</strong>
          {isSkipped && <small>PENDENTE</small>}
        </div>
        <button type="button" className="camera-top-button" onClick={editPlate} aria-label="Editar chapa"><Edit3 /></button>
        <b>{indexAtual + 1}/{total}</b>
      </div>

      <div className="camera-fullscreen__progress"><i style={{ width: `${progress}%` }} /></div>
      {notice && <div className="camera-fullscreen__notice">{notice}</div>}

      {!permissionAsked && !capturedBlob ? (
        <div className="camera-permission">
          <ShieldCheck size={48} />
          <h3>Permitir câmera nesta sessão</h3>
          <p>Depois da primeira autorização, o aplicativo reabre a câmera automaticamente durante esta sessão.</p>
          <button className="primary-button" onClick={() => requestCamera()}><Camera size={19} /> PERMITIR E ABRIR CÂMERA</button>
        </div>
      ) : (
        <>
          <div className="camera-fullscreen__view">
            {cameraError ? (
              <div className="camera-error"><AlertTriangle size={38} /><p>{cameraError}</p><button className="secondary-button" onClick={() => requestCamera()}>Tentar novamente</button></div>
            ) : (
              <>
                <video ref={videoRef} playsInline autoPlay muted className={capturedBlob ? 'hidden' : ''} />
                {previewUrl && <img src={previewUrl} alt={`Foto da chapa ${chapaAtual}`} />}
              </>
            )}
            <canvas ref={canvasRef} hidden />
          </div>

          {!capturedBlob ? (
            <div className="camera-fullscreen__actions">
              <button className="camera-small-action" onClick={() => setCurrentIndex(indexAtual - 1)} disabled={indexAtual === 0} aria-label="Voltar para a chapa anterior"><ArrowLeft /></button>
              <button className="camera-switch" onClick={() => setFacingMode((current) => current === 'environment' ? 'user' : 'environment')} aria-label="Trocar câmera"><SwitchCamera /></button>
              <button className="camera-shutter" onClick={capture} disabled={!ready || Boolean(cameraError)} aria-label="Tirar foto"><span /></button>
              <button className="camera-small-action" onClick={skipCurrent} aria-label="Pular esta chapa"><SkipForward /></button>
              <button className="camera-small-action" onClick={() => { stopCamera(); setReviewing(true); }} aria-label="Revisar serviço"><ListChecks /></button>
            </div>
          ) : (
            <div className="camera-fullscreen__confirm">
              <button className="secondary-button" onClick={redoPhoto} disabled={savingDraft}><RefreshCw /> Refazer</button>
              <button className="primary-button" onClick={advance} disabled={savingDraft}><CheckCircle /> {indexAtual + 1 < total ? 'SALVAR E AVANÇAR' : 'REVISAR SERVIÇO'}</button>
            </div>
          )}
        </>
      )}

      {rawImage && <PhotoEditor image={rawImage} onCancel={() => setRawImage(null)} onConfirm={storeEditedPhoto} />}
    </section>
  );
}
