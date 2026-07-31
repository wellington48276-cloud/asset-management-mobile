import React, { useRef, useEffect, useState } from 'react';
import { Camera, RefreshCw, CheckCircle } from 'lucide-react';
import { salvarColetaData } from '../services/api';

export default function CameraScreen({ listaChapas, usuarioAtual, onFinish }) {
  const [indexAtual, setIndexAtual] = useState(0);
  const [capturedImage, setCapturedImage] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const total = listaChapas.length;
  const chapaAtual = listaChapas[indexAtual] || '------';
  const pct = (indexAtual / total) * 100;

  const vibrar = () => {
    if ("vibrate" in navigator) navigator.vibrate(30);
  };

  useEffect(() => {
    iniciarCamera();
    return () => {
      pararCamera();
    };
  }, []);

  const iniciarCamera = async () => {
    pararCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
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

  const capturarEProcessar = () => {
    vibrar();
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    const largura = 1000;
    const proporcao = (video.videoHeight || 720) / (video.videoWidth || 1280);
    const altura = largura * proporcao;

    canvas.width = largura;
    canvas.height = altura;

    ctx.drawImage(video, 0, 0, largura, altura);

    const agora = new Date();
    const dataHoraStr = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR');

    // Tarja de Registro na Foto
    ctx.fillStyle = "rgba(15, 76, 129, 0.90)";
    ctx.fillRect(0, altura - 60, largura, 60);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px 'Plus Jakarta Sans', Arial";
    ctx.fillText(`CHAPA: ${chapaAtual} | OFICIAL: ${usuarioAtual}`, 20, altura - 34);

    ctx.fillStyle = "#fbc02d";
    ctx.font = "bold 13px 'Plus Jakarta Sans', Arial";
    ctx.fillText(`REGISTRO EM: ${dataHoraStr} | CONTROL-PAT`, 20, altura - 12);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
    setCapturedImage(dataUrl);
  };

  const refazerFoto = () => {
    vibrar();
    setCapturedImage(null);
  };

  const salvarEAvancar = async () => {
    vibrar();
    setEnviando(true);

    try {
      await salvarColetaData(usuarioAtual, chapaAtual, capturedImage);
    } catch (e) {
      console.error("Erro no salvamento:", e);
    } finally {
      setEnviando(false);
    }

    const proximoIndex = indexAtual + 1;
    if (proximoIndex < total) {
      setIndexAtual(proximoIndex);
      setCapturedImage(null);
    } else {
      onFinish();
    }
  };

  return (
    <div className="system-card">
      <div className="progress-box">
        <div className="progress-header">
          <span>PROGRESSO DO LOTE</span>
          <span>{indexAtual + 1} / {total}</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
        </div>
      </div>

      <div className="chapa-box">
        <span>IDENTIFICAÇÃO DO BEM</span>
        <strong>{chapaAtual}</strong>
      </div>

      <div className="camera-container">
        {cameraError ? (
          <div style={{ color: '#ef4444', textAlign: 'center', padding: '20px', fontSize: '0.85rem' }}>
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
          </>
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      <div style={{ marginTop: '16px' }}>
        {!capturedImage ? (
          <button className="btn btn-tech-start" onClick={capturarEProcessar} disabled={!!cameraError}>
            <Camera size={18} />
            CAPTURAR IMAGEM
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
                  ENVIANDO...
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
