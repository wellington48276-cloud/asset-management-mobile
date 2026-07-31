import React, { useRef, useEffect, useState } from 'react';
import { Camera, RefreshCw, CheckCircle, Grid, SwitchCamera, Zap } from 'lucide-react';
import { salvarColetaData } from '../services/api';

export default function CameraScreen({ listaChapas, usuarioAtual, onFinish, playSound, onColetaRegistrada }) {
  const [indexAtual, setIndexAtual] = useState(0);
  const [capturedImage, setCapturedImage] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [showGrid, setShowGrid] = useState(true);
  const [triggerFlash, setTriggerFlash] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const total = listaChapas.length;
  const chapaAtual = listaChapas[indexAtual] || '------';
  const pct = Math.min(100, Math.round((indexAtual / total) * 100));

  useEffect(() => {
    iniciarCamera();
    return () => {
      pararCamera();
    };
  }, [facingMode]);

  const iniciarCamera = async () => {
    pararCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Erro na câmera:", err);
      setCameraError("Não foi possível inicializar o dispositivo de captura.");
    }
  };

  const pararCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const alternarCamera = () => {
    if (playSound) playSound.playButtonClick();
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  const alternarGrade = () => {
    if (playSound) playSound.playButtonClick();
    setShowGrid(prev => !prev);
  };

  const capturarEProcessar = () => {
    // Efeito sonoro e flash de tela
    if (playSound) playSound.playCameraShutter();
    setTriggerFlash(true);
    setTimeout(() => setTriggerFlash(false), 250);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    const largura = 1200;
    const proporcao = (video.videoHeight || 720) / (video.videoWidth || 1280);
    const altura = largura * proporcao;

    canvas.width = largura;
    canvas.height = altura;

    // Desenha o vídeo no canvas
    ctx.drawImage(video, 0, 0, largura, altura);

    const agora = new Date();
    const dataHoraStr = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR');

    // Tarja Cyber-Tech de Registro na Foto
    ctx.fillStyle = "rgba(10, 30, 60, 0.92)";
    ctx.fillRect(0, altura - 70, largura, 70);

    // Linha Neon Superior na Tarja
    ctx.fillStyle = "#00f2fe";
    ctx.fillRect(0, altura - 70, largura, 3);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px 'Plus Jakarta Sans', Arial";
    ctx.fillText(`CHAPA PATRIMONIAL: ${chapaAtual} | OFICIAL: ${usuarioAtual}`, 24, altura - 40);

    ctx.fillStyle = "#fbc02d";
    ctx.font = "bold 14px 'Plus Jakarta Sans', Arial";
    ctx.fillText(`REGISTRO AUDITADO EM: ${dataHoraStr} | CONTROL-PAT SECURE`, 24, altura - 16);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);

    if (playSound) playSound.playScanBeep();
  };

  const refazerFoto = () => {
    if (playSound) playSound.playButtonClick();
    setCapturedImage(null);
  };

  const salvarEAvancar = async () => {
    if (playSound) playSound.playButtonClick();
    setEnviando(true);

    let isSuccess = false;
    try {
      const res = await salvarColetaData(usuarioAtual, chapaAtual, capturedImage);
      isSuccess = res ? res.success : true;
    } catch (e) {
      console.error("Erro no salvamento:", e);
    } finally {
      setEnviando(false);
    }

    // Registra no histórico offline local
    if (onColetaRegistrada) {
      onColetaRegistrada({
        chapa: chapaAtual,
        vistoriador: usuarioAtual,
        fotoBase64: capturedImage,
        synced: isSuccess
      });
    }

    const proximoIndex = indexAtual + 1;
    if (proximoIndex < total) {
      setIndexAtual(proximoIndex);
      setCapturedImage(null);
    } else {
      if (playSound) playSound.playSuccessSound();
      onFinish();
    }
  };

  return (
    <div className="system-card glass-cyber">
      {/* Flash Visual */}
      {triggerFlash && <div className="camera-flash-overlay" />}

      <div className="progress-box">
        <div className="progress-header">
          <span>PROGRESSO DA VISTORIA</span>
          <span>{indexAtual + 1} DE {total} ({pct}%)</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
        </div>
      </div>

      <div className="chapa-box glow-box">
        <span>BEM PATRIMONIAL EM ANÁLISE</span>
        <strong>#{chapaAtual}</strong>
      </div>

      <div className="camera-hud-container">
        {cameraError ? (
          <div className="camera-error-msg">
            {cameraError}
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ display: capturedImage ? 'none' : 'block' }}
            />
            {capturedImage && (
              <img src={capturedImage} alt="Captura de Patrimônio" className="captured-img" />
            )}

            {/* Elementos HUD Scanner */}
            {!capturedImage && (
              <>
                <div className="hud-laser-line" />
                {showGrid && <div className="hud-grid-overlay" />}
                <div className="hud-target-corners">
                  <div className="corner top-left" />
                  <div className="corner top-right" />
                  <div className="corner bottom-left" />
                  <div className="corner bottom-right" />
                </div>
              </>
            )}
          </>
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {/* Controles do HUD (Grade e Troca de Câmera) */}
      {!capturedImage && (
        <div className="hud-controls-bar">
          <button
            type="button"
            className={`btn-hud-control ${showGrid ? 'active' : ''}`}
            onClick={alternarGrade}
            title="Alternar Grade Guia"
          >
            <Grid size={16} />
            GRADE
          </button>
          <button
            type="button"
            className="btn-hud-control"
            onClick={alternarCamera}
            title="Alternar Câmera"
          >
            <SwitchCamera size={16} />
            INVERTER
          </button>
        </div>
      )}

      <div style={{ marginTop: '16px' }}>
        {!capturedImage ? (
          <button className="btn btn-tech-start btn-scan-hud" onClick={capturarEProcessar} disabled={!!cameraError}>
            <Camera size={18} />
            CAPTURAR E PROCESSAR
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={refazerFoto} disabled={enviando}>
              <RefreshCw size={16} />
              REFAZER
            </button>
            <button className="btn btn-green" style={{ flex: 1 }} onClick={salvarEAvancar} disabled={enviando}>
              {enviando ? (
                <>
                  <span className="spinner"></span>
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
        )}
      </div>
    </div>
  );
}
