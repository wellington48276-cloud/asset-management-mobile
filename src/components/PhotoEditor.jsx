import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Crop, RotateCcw, RotateCw, X } from 'lucide-react';

const MIN_CROP = 80;
const ASPECTS = [
  { id: 'original', label: 'Original', ratio: null },
  { id: '9:16', label: '9:16', ratio: 9 / 16 },
  { id: '4:3', label: '4:3', ratio: 4 / 3 },
  { id: '1:1', label: '1:1', ratio: 1 }
];

function rotateImage(source, degrees) {
  const radians = (degrees * Math.PI) / 180;
  const swap = Math.abs(degrees) % 180 !== 0;
  const canvas = document.createElement('canvas');
  canvas.width = swap ? source.naturalHeight : source.naturalWidth;
  canvas.height = swap ? source.naturalWidth : source.naturalHeight;
  const context = canvas.getContext('2d', { alpha: false });
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(radians);
  context.drawImage(source, -source.naturalWidth / 2, -source.naturalHeight / 2);
  return canvas.toDataURL('image/jpeg', 0.99);
}

export default function PhotoEditor({ image, onCancel, onConfirm }) {
  const stageRef = useRef(null);
  const imageRef = useRef(null);
  const interactionRef = useRef(null);
  const [workingImage, setWorkingImage] = useState(image);
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 });
  const [displayRect, setDisplayRect] = useState({ left: 0, top: 0, width: 1, height: 1 });
  const [aspectId, setAspectId] = useState('original');
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 1, height: 1 });

  const aspect = useMemo(() => ASPECTS.find((item) => item.id === aspectId), [aspectId]);

  const measure = () => {
    const stage = stageRef.current;
    const img = imageRef.current;
    if (!stage || !img || !img.naturalWidth) return;
    const stageBox = stage.getBoundingClientRect();
    const imageBox = img.getBoundingClientRect();
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    setDisplayRect({
      left: imageBox.left - stageBox.left,
      top: imageBox.top - stageBox.top,
      width: imageBox.width,
      height: imageBox.height
    });
  };

  const resetCrop = (ratio = null) => {
    requestAnimationFrame(() => {
      const img = imageRef.current;
      if (!img) return;
      const width = img.clientWidth;
      const height = img.clientHeight;
      if (!width || !height) return;

      const margin = Math.max(14, Math.min(width, height) * 0.045);
      let cropWidth = width - margin * 2;
      let cropHeight = height - margin * 2;
      const targetRatio = ratio || width / height;

      if (cropWidth / cropHeight > targetRatio) cropWidth = cropHeight * targetRatio;
      else cropHeight = cropWidth / targetRatio;

      setCrop({
        x: (width - cropWidth) / 2,
        y: (height - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight
      });
      measure();
    });
  };

  useEffect(() => {
    setWorkingImage(image);
  }, [image]);

  useEffect(() => {
    const onResize = () => {
      measure();
      resetCrop(aspect?.ratio || null);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [aspect]);

  const onImageLoad = () => {
    measure();
    resetCrop(aspect?.ratio || null);
  };

  const chooseAspect = (next) => {
    setAspectId(next.id);
    resetCrop(next.ratio);
  };

  const point = (event) => {
    const imageBox = imageRef.current.getBoundingClientRect();
    return { x: event.clientX - imageBox.left, y: event.clientY - imageBox.top };
  };

  const beginInteraction = (event, mode) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    interactionRef.current = { mode, start: point(event), crop };
  };

  const clampCrop = (candidate) => {
    const widthLimit = imageRef.current?.clientWidth || 1;
    const heightLimit = imageRef.current?.clientHeight || 1;
    const width = Math.max(MIN_CROP, Math.min(widthLimit, candidate.width));
    const height = Math.max(MIN_CROP, Math.min(heightLimit, candidate.height));
    const x = Math.max(0, Math.min(widthLimit - width, candidate.x));
    const y = Math.max(0, Math.min(heightLimit - height, candidate.y));
    return { x, y, width, height };
  };

  const resizeFromCorner = (base, dx, dy, corner) => {
    const ratio = aspect?.ratio;
    let left = base.x;
    let top = base.y;
    let right = base.x + base.width;
    let bottom = base.y + base.height;

    if (corner.includes('w')) left += dx;
    if (corner.includes('e')) right += dx;
    if (corner.includes('n')) top += dy;
    if (corner.includes('s')) bottom += dy;

    let width = Math.max(MIN_CROP, right - left);
    let height = Math.max(MIN_CROP, bottom - top);

    if (ratio) {
      const useWidth = Math.abs(dx) >= Math.abs(dy);
      if (useWidth) height = width / ratio;
      else width = height * ratio;
      if (corner.includes('w')) left = right - width;
      else right = left + width;
      if (corner.includes('n')) top = bottom - height;
      else bottom = top + height;
    }

    return clampCrop({ x: left, y: top, width: right - left, height: bottom - top });
  };

  const moveInteraction = (event) => {
    const state = interactionRef.current;
    if (!state) return;
    event.preventDefault();
    const current = point(event);
    const dx = current.x - state.start.x;
    const dy = current.y - state.start.y;

    if (state.mode === 'move') {
      setCrop(clampCrop({ ...state.crop, x: state.crop.x + dx, y: state.crop.y + dy }));
    } else {
      setCrop(resizeFromCorner(state.crop, dx, dy, state.mode));
    }
  };

  const endInteraction = () => {
    interactionRef.current = null;
  };

  const rotate = async (degrees) => {
    const source = new Image();
    source.onload = () => {
      setWorkingImage(rotateImage(source, degrees));
      setAspectId('original');
    };
    source.src = workingImage;
  };

  const confirm = () => {
    const img = imageRef.current;
    if (!img?.naturalWidth || !crop.width || !crop.height) return;
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;
    const sourceX = Math.round(crop.x * scaleX);
    const sourceY = Math.round(crop.y * scaleY);
    const sourceWidth = Math.max(1, Math.round(crop.width * scaleX));
    const sourceHeight = Math.max(1, Math.round(crop.height * scaleY));

    const output = document.createElement('canvas');
    output.width = sourceWidth;
    output.height = sourceHeight;
    const context = output.getContext('2d', { alpha: false });
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
    onConfirm(output.toDataURL('image/jpeg', 0.98));
  };

  const resolution = `${Math.round(crop.width * (naturalSize.width / Math.max(1, displayRect.width)))} × ${Math.round(crop.height * (naturalSize.height / Math.max(1, displayRect.height)))} px`;

  return (
    <div className="pro-cropper" role="dialog" aria-modal="true" aria-label="Recortar foto">
      <header className="pro-cropper-header">
        <button className="crop-icon-button" onClick={onCancel} aria-label="Refazer foto"><X /></button>
        <div><strong>Recortar foto</strong><span>{resolution}</span></div>
        <button className="crop-done-button" onClick={confirm}><Check size={19} /> Concluir</button>
      </header>

      <main className="pro-cropper-stage" ref={stageRef} onPointerMove={moveInteraction} onPointerUp={endInteraction} onPointerCancel={endInteraction}>
        <img ref={imageRef} src={workingImage} alt="Foto para recorte" onLoad={onImageLoad} draggable="false" />
        <div className="crop-shade crop-shade-top" style={{ left: displayRect.left, top: displayRect.top, width: displayRect.width, height: crop.y }} />
        <div className="crop-shade crop-shade-bottom" style={{ left: displayRect.left, top: displayRect.top + crop.y + crop.height, width: displayRect.width, height: Math.max(0, displayRect.height - crop.y - crop.height) }} />
        <div className="crop-shade crop-shade-left" style={{ left: displayRect.left, top: displayRect.top + crop.y, width: crop.x, height: crop.height }} />
        <div className="crop-shade crop-shade-right" style={{ left: displayRect.left + crop.x + crop.width, top: displayRect.top + crop.y, width: Math.max(0, displayRect.width - crop.x - crop.width), height: crop.height }} />

        <div
          className="pro-crop-box"
          style={{ left: displayRect.left + crop.x, top: displayRect.top + crop.y, width: crop.width, height: crop.height }}
          onPointerDown={(event) => beginInteraction(event, 'move')}
        >
          <div className="crop-grid-lines" />
          {['nw', 'ne', 'sw', 'se'].map((corner) => (
            <button
              key={corner}
              className={`crop-handle crop-handle-${corner}`}
              onPointerDown={(event) => { event.stopPropagation(); beginInteraction(event, corner); }}
              aria-label={`Ajustar canto ${corner}`}
            />
          ))}
        </div>
      </main>

      <footer className="pro-cropper-footer">
        <div className="aspect-selector" role="group" aria-label="Proporção do recorte">
          {ASPECTS.map((item) => (
            <button key={item.id} className={aspectId === item.id ? 'active' : ''} onClick={() => chooseAspect(item)}>{item.label}</button>
          ))}
        </div>
        <div className="crop-rotate-row">
          <button onClick={() => rotate(-90)}><RotateCcw size={20} /> Esquerda</button>
          <div><Crop size={18} /><span>Arraste o quadro e os cantos</span></div>
          <button onClick={() => rotate(90)}>Direita <RotateCw size={20} /></button>
        </div>
      </footer>
    </div>
  );
}
