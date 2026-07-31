import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle, SwitchCamera, ShieldCheck } from 'lucide-react';
import { salvarColetaData } from '../services/api';
import PhotoEditor from './PhotoEditor';

const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

function aplicarMarcaDagua(imageSrc, chapaAtual, usuarioAtual) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const tarjaAltura = Math.max(60, Math.round(img.height * 0.08));
      const agora = new Date();
      const dataHoraStr = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR');
      const fontSize = Math.max(14, Math.round(img.width * 0.018));
      const fontSizeSmall = Math.max(11, Math.round(img.width * 0.012));

      ctx.fillStyle = 'rgba(10, 30, 60, 0.92)';
      ctx.fillRect(0, img.height - tarjaAltura, img.width, tarjaAltura);
      ctx.fillStyle = '#00f2fe';
      ctx.fillRect(0, img.height - tarjaAltura, img.width, 3);

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${fontSize}px 'Plus Jakarta Sans', Arial`;
      ctx.fillText(`CHAPA: ${chapaAtual} | OPERADOR: ${usuarioAtual}`, 16, img.height - tarjaAltura + fontSize + 8);

      ctx.fillStyle = '#fbc02d';
      ctx.font = `bold ${fontSizeSmall}px 'Plus Jakarta Sans', Arial`;
      ctx.fillText(`REGISTRO: ${dataHoraStr}`, 16, img.height - 12);

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}

export default function CameraScreen({ listaChapas, usuarioAtual, onFinish, playSound, onColetaRegistrada }) {
  const [indexAtual, setIndexAtual] = useState(0);
  const [rawImage, setRawImage] = useState(null);
  const [editedImage, setEditedImage] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [triggerFlash, setTriggerFlash] = useState(false);
  const [isMobile] = useState(isMobileDevice);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const total = listaChapas.length;
  const chapaAtual = listaChapas[indexAtual] || '------';
  const pct = Math.min(100, Math.round(((indexAtual + (editedImage ? 1 : 0)) / total) * 100));

  const pararCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const iniciarCamera = useCallback(async () => {
    pararCamera();
    setCameraError(null);
    setRequestingPermission(true);

    try {
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 3840, min: 1280 },
          height: { ideal: 2160, min: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setPermissionGranted(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error('Erro na câmera:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Permissão de câmera negada. Ative nas configurações do celular.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('Nenhuma câmera encontrada neste dispositivo.');
      } else {
        setCameraError('Não foi possível acessar a câmera. Tente novamente.');
      }
      setPermissionGranted(false);
    } finally {
      setRequestingPermission(false);
    }
  }, [facingMode, pararCamera]);

  useEffect(() => {
    if (!isMobile && permissionGranted) {
      iniciarCamera();
    }
    return () => pararCamera();
  }, [facingMode, isMobile, permissionGranted, iniciarCamera, pararCamera]);

  const solicitarPermissao = () => {
    if (playSound) playSound.playButtonClick();
    if (isMobile) {
      fileInputRef.current?.click();
    } else {
      iniciarCamera();
    }
  };

  const capturarDoVideo = () => {
    if (playSound) playSound.playCameraShutter();
    setTriggerFlash(true);
    setTimeout(() => setTriggerFlash(false), 250);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setRawImage(dataUrl);
    pararCamera();

    if (playSound) playSound.playScanBeep();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPermissionGranted(true);
    setCameraError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (playSound) playSound.playCameraShutter();
      setTriggerFlash(true);
      setTimeout(() => setTriggerFlash(false), 250);
      setRawImage(ev.target.result);
      if (playSound) playSound.playScanBeep();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleEditorConfirm = (processedImage) => {
    setEditedImage(processedImage);
    setRawImage(null);
  };

  const handleEditorCancel = () => {
    if (playSound) playSound.playButtonClick();
    setRawImage(null);
    if (!isMobile) iniciarCamera();
  };

  const refazerFoto = () => {
    if (playSound) playSound.playButtonClick();
    setEditedImage(null);
    setRawImage(null);
    if (isMobile) {
      fileInputRef.current?.click();
    } else {
      iniciarCamera();
    }
  };

  const salvarEAvancar = async () => {
    if (playSound) playSound.playButtonClick();
    setEnviando(true);

    let fotoFinal = editedImage;
    try {
      fotoFinal = await aplicarMarcaDagua(editedImage, chapaAtual, usuarioAtual);
    } catch (e) {
      console.error('Erro na marca dágua:', e);
    }

    let isSuccess = false;
    try {
      const res = await salvarColetaData(usuarioAtual, chapaAtual, fotoFinal);
      isSuccess = res ? res.success : true;
    } catch (e) {
      console.error('Erro no salvamento:', e);
    } finally {
      setEnviando(false);
    }

    if (onColetaRegistrada) {
      onColetaRegistrada({
        chapa: chapaAtual,
        operador: usuarioAtual,
        fotoBase64: fotoFinal,
        synced: isSuccess,
      });
    }

    const proximoIndex = indexAtual + 1;
    if (proximoIndex < total) {
      setIndexAtual(proximoIndex);
      setEditedImage(null);
      setRawImage(null);
      if (!isMobile) iniciarCamera();
    } else {
      if (playSound) playSound.playSuccessSound();
      onFinish();
    }
  };

  const alternarCamera = () => {
    if (playSound) playSound.playButtonClick();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const tirarFoto = () => {
    if (isMobile) {
      fileInputRef.current?.click();
    } else {
      capturarDoVideo();
    }
  };

  return (
    <div className="system-card glass-cyber camera-screen">
      {triggerFlash && <div className="camera-flash-overlay" />}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="progress-box">
        <div className="progress-header">
          <span>PROGRESSO DO LOTE</span>
          <span>{indexAtual + 1} / {total} ({pct}%)</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="chapa-box glow-box">
        <span>CHAPA ATUAL</span>
        <strong>#{chapaAtual}</strong>
      </div>

      {rawImage ? (
        <PhotoEditor
          imageSrc={rawImage}
          onConfirm={handleEditorConfirm}
          onCancel={handleEditorCancel}
          playSound={playSound}
        />
      ) : editedImage ? (
        <>
          <div className="camera-preview-container">
            <img src={editedImage} alt="Foto editada" className="captured-img" />
          </div>
          <div className="camera-actions">
            <button type="button" className="btn btn-outline" onClick={refazerFoto} disabled={enviando}>
              <RefreshCw size={16} />
              REFAZER
            </button>
            <button type="button" className="btn btn-green" onClick={salvarEAvancar} disabled={enviando}>
              {enviando ? (
                <>
                  <span className="spinner" />
                  SALVANDO...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  CONFIRMAR
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="camera-preview-container">
            {!permissionGranted && !cameraError ? (
              <div className="camera-permission-box">
                <ShieldCheck size={48} className="glow-icon" />
                <h3>Permissão da Câmera</h3>
                <p>
                  {isMobile
                    ? 'Toque abaixo para abrir a câmera do celular e fotografar o bem patrimonial.'
                    : 'Permita o acesso à câmera para capturar fotos em alta qualidade.'}
                </p>
                <button
                  type="button"
                  className="btn btn-tech-start"
                  onClick={solicitarPermissao}
                  disabled={requestingPermission}
                >
                  {requestingPermission ? (
                    <>
                      <span className="spinner" />
                      SOLICITANDO...
                    </>
                  ) : (
                    <>
                      <Camera size={18} />
                      PERMITIR CÂMERA
                    </>
                  )}
                </button>
              </div>
            ) : cameraError ? (
              <div className="camera-error-msg">
                <p>{cameraError}</p>
                <button type="button" className="btn btn-outline btn-sm" onClick={solicitarPermissao}>
                  TENTAR NOVAMENTE
                </button>
              </div>
            ) : isMobile ? (
              <div className="camera-native-hint">
                <Camera size={64} className="glow-icon" />
                <p>Câmera pronta</p>
                <span>Toque em &quot;Tirar Foto&quot; para abrir a câmera do celular</span>
              </div>
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
            )}
          </div>

          {(permissionGranted || isMobile) && !cameraError && (
            <div className="camera-controls">
              {!isMobile && (
                <button type="button" className="btn-hud-control" onClick={alternarCamera} title="Alternar câmera">
                  <SwitchCamera size={16} />
                  INVERTER
                </button>
              )}
              <button type="button" className="btn btn-tech-start btn-capture" onClick={tirarFoto}>
                <Camera size={18} />
                TIRAR FOTO
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
