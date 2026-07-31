import React, { useState, useRef, useCallback } from 'react';
import { RotateCcw, RotateCw, Check, X } from 'lucide-react';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function getRotatedSize(width, height, rotation) {
  const r = ((rotation % 360) + 360) % 360;
  if (r === 90 || r === 270) return { width: height, height: width };
  return { width, height };
}

function renderEditedImage(imageSrc, rotation, crop, quality = 0.92) {
  return new Promise(async (resolve, reject) => {
    try {
      const img = await loadImage(imageSrc);
      const rot = ((rotation % 360) + 360) % 360;

      const { width: rw, height: rh } = getRotatedSize(img.width, img.height, rot);
      const rotCanvas = document.createElement('canvas');
      rotCanvas.width = rw;
      rotCanvas.height = rh;
      const rotCtx = rotCanvas.getContext('2d');

      rotCtx.translate(rw / 2, rh / 2);
      rotCtx.rotate((rot * Math.PI) / 180);
      rotCtx.drawImage(img, -img.width / 2, -img.height / 2);

      const sx = Math.round(crop.x * rw);
      const sy = Math.round(crop.y * rh);
      const sw = Math.round(crop.width * rw);
      const sh = Math.round(crop.height * rh);

      const outCanvas = document.createElement('canvas');
      outCanvas.width = sw;
      outCanvas.height = sh;
      const outCtx = outCanvas.getContext('2d');
      outCtx.drawImage(rotCanvas, sx, sy, sw, sh, 0, 0, sw, sh);

      resolve(outCanvas.toDataURL('image/jpeg', quality));
    } catch (e) {
      reject(e);
    }
  });
}

export default function PhotoEditor({ imageSrc, onConfirm, onCancel, playSound }) {
  const [rotation, setRotation] = useState(0);
  const [crop, setCrop] = useState({ x: 0.05, y: 0.05, width: 0.9, height: 0.9 });
  const [processing, setProcessing] = useState(false);

  const containerRef = useRef(null);
  const dragRef = useRef(null);

  const rotateLeft = () => {
    if (playSound) playSound.playButtonClick();
    setRotation((r) => r - 90);
    setCrop({ x: 0.05, y: 0.05, width: 0.9, height: 0.9 });
  };

  const rotateRight = () => {
    if (playSound) playSound.playButtonClick();
    setRotation((r) => r + 90);
    setCrop({ x: 0.05, y: 0.05, width: 0.9, height: 0.9 });
  };

  const getPos = (e) => {
    const touch = e.touches ? e.touches[0] : e;
    return { x: touch.clientX, y: touch.clientY };
  };

  const startDrag = useCallback((type, e) => {
    e.preventDefault();
    const pos = getPos(e);
    dragRef.current = { type, startX: pos.x, startY: pos.y, startCrop: { ...crop } };
  }, [crop]);

  const onDrag = useCallback((e) => {
    if (!dragRef.current || !containerRef.current) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const pos = getPos(e);
    const dx = (pos.x - dragRef.current.startX) / rect.width;
    const dy = (pos.y - dragRef.current.startY) / rect.height;
    const sc = dragRef.current.startCrop;
    const minSize = 0.15;

    if (dragRef.current.type === 'move') {
      let nx = sc.x + dx;
      let ny = sc.y + dy;
      nx = Math.max(0, Math.min(1 - sc.width, nx));
      ny = Math.max(0, Math.min(1 - sc.height, ny));
      setCrop({ ...sc, x: nx, y: ny });
    } else {
      let { x, y, width, height } = sc;
      if (dragRef.current.type.includes('r')) width = Math.max(minSize, sc.width + dx);
      if (dragRef.current.type.includes('l')) {
        width = Math.max(minSize, sc.width - dx);
        x = sc.x + sc.width - width;
      }
      if (dragRef.current.type.includes('b')) height = Math.max(minSize, sc.height + dy);
      if (dragRef.current.type.includes('t')) {
        height = Math.max(minSize, sc.height - dy);
        y = sc.y + sc.height - height;
      }
      x = Math.max(0, x);
      y = Math.max(0, y);
      if (x + width > 1) width = 1 - x;
      if (y + height > 1) height = 1 - y;
      setCrop({ x, y, width, height });
    }
  }, []);

  const endDrag = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleConfirm = async () => {
    if (playSound) playSound.playButtonClick();
    setProcessing(true);
    try {
      const result = await renderEditedImage(imageSrc, rotation, crop);
      onConfirm(result);
    } catch (e) {
      console.error('Erro ao processar imagem:', e);
    } finally {
      setProcessing(false);
    }
  };

  const cropStyle = {
    left: `${crop.x * 100}%`,
    top: `${crop.y * 100}%`,
    width: `${crop.width * 100}%`,
    height: `${crop.height * 100}%`,
  };

  return (
    <div className="photo-editor">
      <div className="photo-editor-header">
        <span>RECORTAR E ROTACIONAR</span>
      </div>

      <div
        className="photo-editor-viewport"
        ref={containerRef}
        onMouseMove={onDrag}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchMove={onDrag}
        onTouchEnd={endDrag}
      >
        <img
          src={imageSrc}
          alt="Foto capturada"
          className="photo-editor-image"
          style={{ transform: `rotate(${rotation}deg)` }}
          draggable={false}
        />
        <div className="photo-editor-overlay">
          <div
            className="photo-editor-crop"
            style={cropStyle}
            onMouseDown={(e) => startDrag('move', e)}
            onTouchStart={(e) => startDrag('move', e)}
          >
            <div className="crop-handle tl" onMouseDown={(e) => { e.stopPropagation(); startDrag('tl', e); }} onTouchStart={(e) => { e.stopPropagation(); startDrag('tl', e); }} />
            <div className="crop-handle tr" onMouseDown={(e) => { e.stopPropagation(); startDrag('tr', e); }} onTouchStart={(e) => { e.stopPropagation(); startDrag('tr', e); }} />
            <div className="crop-handle bl" onMouseDown={(e) => { e.stopPropagation(); startDrag('bl', e); }} onTouchStart={(e) => { e.stopPropagation(); startDrag('bl', e); }} />
            <div className="crop-handle br" onMouseDown={(e) => { e.stopPropagation(); startDrag('br', e); }} onTouchStart={(e) => { e.stopPropagation(); startDrag('br', e); }} />
          </div>
        </div>
      </div>

      <div className="photo-editor-tools">
        <button type="button" className="btn-tool" onClick={rotateLeft} title="Girar esquerda">
          <RotateCcw size={20} />
        </button>
        <button type="button" className="btn-tool" onClick={rotateRight} title="Girar direita">
          <RotateCw size={20} />
        </button>
      </div>

      <div className="photo-editor-actions">
        <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onCancel} disabled={processing}>
          <X size={16} />
          CANCELAR
        </button>
        <button type="button" className="btn btn-green" style={{ flex: 1 }} onClick={handleConfirm} disabled={processing}>
          {processing ? (
            <>
              <span className="spinner"></span>
              PROCESSANDO...
            </>
          ) : (
            <>
              <Check size={16} />
              APLICAR
            </>
          )}
        </button>
      </div>
    </div>
  );
}
