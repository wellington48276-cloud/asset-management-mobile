import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, RotateCcw, RotateCw, X } from 'lucide-react';
import './editor-clean.css';

const MIN_SIZE = 70;
const MAX_OUTPUT_SIDE = 2400;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Não foi possível carregar a foto.'));
    img.src = src;
  });
}

function rotateSourceImage(image, rotation) {
  const normalized = ((rotation % 360) + 360) % 360;
  const swap = normalized === 90 || normalized === 270;
  const output = document.createElement('canvas');

  output.width = swap ? image.naturalHeight : image.naturalWidth;
  output.height = swap ? image.naturalWidth : image.naturalHeight;

  const context = output.getContext('2d', { alpha: false });
  context.fillStyle = '#000';
  context.fillRect(0, 0, output.width, output.height);
  context.translate(output.width / 2, output.height / 2);
  context.rotate((normalized * Math.PI) / 180);
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

  return output;
}

function fitBox(stageWidth, stageHeight, imageWidth, imageHeight) {
  const scale = Math.min(stageWidth / imageWidth, stageHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;

  return {
    x: (stageWidth - width) / 2,
    y: (stageHeight - height) / 2,
    width,
    height
  };
}

function normalizeCrop(crop, displayBox) {
  if (!displayBox.width || !displayBox.height) return null;
  return {
    x: (crop.x - displayBox.x) / displayBox.width,
    y: (crop.y - displayBox.y) / displayBox.height,
    width: crop.width / displayBox.width,
    height: crop.height / displayBox.height
  };
}

function denormalizeCrop(normalized, displayBox) {
  if (!normalized) return { ...displayBox };
  return {
    x: displayBox.x + normalized.x * displayBox.width,
    y: displayBox.y + normalized.y * displayBox.height,
    width: normalized.width * displayBox.width,
    height: normalized.height * displayBox.height
  };
}

export default function PhotoEditor({ image, onCancel, onConfirm }) {
  const stageRef = useRef(null);
  const sourceImageRef = useRef(null);
  const cropBeforeRotationRef = useRef(null);

  const [rotation, setRotation] = useState(0);
  const [preview, setPreview] = useState('');
  const [previewSize, setPreviewSize] = useState({ width: 1, height: 1 });
  const [displayBox, setDisplayBox] = useState({ x: 0, y: 0, width: 1, height: 1 });
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 1, height: 1 });
  const [drag, setDrag] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    loadImage(image)
      .then((loaded) => {
        if (!active) return;
        sourceImageRef.current = loaded;
        const initialCanvas = rotateSourceImage(loaded, 0);
        setPreview(initialCanvas.toDataURL('image/jpeg', 0.94));
        setPreviewSize({ width: initialCanvas.width, height: initialCanvas.height });
        setRotation(0);
      })
      .catch((loadError) => setError(loadError.message));

    return () => {
      active = false;
    };
  }, [image]);

  useEffect(() => {
    const source = sourceImageRef.current;
    if (!source) return;

    const rotatedCanvas = rotateSourceImage(source, rotation);
    setPreview(rotatedCanvas.toDataURL('image/jpeg', 0.94));
    setPreviewSize({ width: rotatedCanvas.width, height: rotatedCanvas.height });
  }, [rotation, image]);

  useEffect(() => {
    const measure = () => {
      const stage = stageRef.current;
      if (!stage || !previewSize.width || !previewSize.height) return;

      const bounds = stage.getBoundingClientRect();
      const nextBox = fitBox(
        bounds.width,
        bounds.height,
        previewSize.width,
        previewSize.height
      );

      setDisplayBox(nextBox);
      setCrop(denormalizeCrop(cropBeforeRotationRef.current, nextBox));
      cropBeforeRotationRef.current = null;
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [previewSize.width, previewSize.height]);

  const pointFromEvent = (event) => {
    const touch = event.touches?.[0] || event.changedTouches?.[0];
    const source = touch || event;
    const stage = stageRef.current.getBoundingClientRect();
    return { x: source.clientX - stage.left, y: source.clientY - stage.top };
  };

  const beginDrag = (event, mode) => {
    event.preventDefault();
    event.stopPropagation();
    setDrag({ mode, start: pointFromEvent(event), crop });
  };

  const moveDrag = (event) => {
    if (!drag) return;
    event.preventDefault();

    const point = pointFromEvent(event);
    const dx = point.x - drag.start.x;
    const dy = point.y - drag.start.y;
    const original = drag.crop;
    const imageLeft = displayBox.x;
    const imageTop = displayBox.y;
    const imageRight = displayBox.x + displayBox.width;
    const imageBottom = displayBox.y + displayBox.height;
    const next = { ...original };

    if (drag.mode === 'move') {
      next.x = Math.min(imageRight - original.width, Math.max(imageLeft, original.x + dx));
      next.y = Math.min(imageBottom - original.height, Math.max(imageTop, original.y + dy));
    }

    if (drag.mode.includes('left')) {
      const right = original.x + original.width;
      next.x = Math.max(imageLeft, Math.min(right - MIN_SIZE, original.x + dx));
      next.width = right - next.x;
    }

    if (drag.mode.includes('right')) {
      next.width = Math.max(MIN_SIZE, Math.min(imageRight - original.x, original.width + dx));
    }

    if (drag.mode.includes('top')) {
      const bottom = original.y + original.height;
      next.y = Math.max(imageTop, Math.min(bottom - MIN_SIZE, original.y + dy));
      next.height = bottom - next.y;
    }

    if (drag.mode.includes('bottom')) {
      next.height = Math.max(MIN_SIZE, Math.min(imageBottom - original.y, original.height + dy));
    }

    setCrop(next);
  };

  const rotate = (amount) => {
    cropBeforeRotationRef.current = normalizeCrop(crop, displayBox);
    setRotation((current) => (current + amount + 360) % 360);
  };

  const confirmCrop = () => {
    const source = sourceImageRef.current;
    if (!source || !displayBox.width || !displayBox.height) return;

    const rotatedCanvas = rotateSourceImage(source, rotation);
    const scaleX = rotatedCanvas.width / displayBox.width;
    const scaleY = rotatedCanvas.height / displayBox.height;
    const sourceX = Math.max(0, Math.round((crop.x - displayBox.x) * scaleX));
    const sourceY = Math.max(0, Math.round((crop.y - displayBox.y) * scaleY));
    const sourceWidth = Math.min(
      rotatedCanvas.width - sourceX,
      Math.max(1, Math.round(crop.width * scaleX))
    );
    const sourceHeight = Math.min(
      rotatedCanvas.height - sourceY,
      Math.max(1, Math.round(crop.height * scaleY))
    );

    const reduction = Math.min(1, MAX_OUTPUT_SIDE / Math.max(sourceWidth, sourceHeight));
    const outputWidth = Math.max(1, Math.round(sourceWidth * reduction));
    const outputHeight = Math.max(1, Math.round(sourceHeight * reduction));
    const output = document.createElement('canvas');
    output.width = outputWidth;
    output.height = outputHeight;

    const context = output.getContext('2d', { alpha: false });
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.fillStyle = '#000';
    context.fillRect(0, 0, outputWidth, outputHeight);
    context.drawImage(
      rotatedCanvas,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputWidth,
      outputHeight
    );

    onConfirm(output.toDataURL('image/jpeg', 0.9));
  };

  return (
    <div
      className="clean-editor"
      onMouseMove={moveDrag}
      onMouseUp={() => setDrag(null)}
      onMouseLeave={() => setDrag(null)}
      onTouchMove={moveDrag}
      onTouchEnd={() => setDrag(null)}
    >
      <header className="clean-editor__header">
        <button type="button" className="clean-editor__icon" onClick={onCancel} aria-label="Cancelar edição">
          <X />
        </button>

        <div>
          <strong>Recortar foto</strong>
          <span>Ajuste as bordas sem perder a proporção</span>
        </div>

        <button type="button" className="clean-editor__done" onClick={confirmCrop} disabled={!preview}>
          <Check size={19} />
          Concluir
        </button>
      </header>

      <div className="clean-editor__stage" ref={stageRef}>
        {error && <div className="clean-editor__error">{error}</div>}
        {preview && (
          <img
            src={preview}
            alt="Foto para recorte"
            draggable="false"
            className="clean-editor__image"
            style={{
              left: displayBox.x,
              top: displayBox.y,
              width: displayBox.width,
              height: displayBox.height
            }}
          />
        )}

        {preview && (
          <div
            className="clean-editor__crop"
            style={{ left: crop.x, top: crop.y, width: crop.width, height: crop.height }}
            onMouseDown={(event) => beginDrag(event, 'move')}
            onTouchStart={(event) => beginDrag(event, 'move')}
          >
            <button className="crop-handle crop-handle--tl" onMouseDown={(e) => beginDrag(e, 'top-left')} onTouchStart={(e) => beginDrag(e, 'top-left')} aria-label="Ajustar canto superior esquerdo" />
            <button className="crop-handle crop-handle--tr" onMouseDown={(e) => beginDrag(e, 'top-right')} onTouchStart={(e) => beginDrag(e, 'top-right')} aria-label="Ajustar canto superior direito" />
            <button className="crop-handle crop-handle--bl" onMouseDown={(e) => beginDrag(e, 'bottom-left')} onTouchStart={(e) => beginDrag(e, 'bottom-left')} aria-label="Ajustar canto inferior esquerdo" />
            <button className="crop-handle crop-handle--br" onMouseDown={(e) => beginDrag(e, 'bottom-right')} onTouchStart={(e) => beginDrag(e, 'bottom-right')} aria-label="Ajustar canto inferior direito" />
            <button className="crop-edge crop-edge--top" onMouseDown={(e) => beginDrag(e, 'top')} onTouchStart={(e) => beginDrag(e, 'top')} aria-label="Ajustar borda superior" />
            <button className="crop-edge crop-edge--right" onMouseDown={(e) => beginDrag(e, 'right')} onTouchStart={(e) => beginDrag(e, 'right')} aria-label="Ajustar borda direita" />
            <button className="crop-edge crop-edge--bottom" onMouseDown={(e) => beginDrag(e, 'bottom')} onTouchStart={(e) => beginDrag(e, 'bottom')} aria-label="Ajustar borda inferior" />
            <button className="crop-edge crop-edge--left" onMouseDown={(e) => beginDrag(e, 'left')} onTouchStart={(e) => beginDrag(e, 'left')} aria-label="Ajustar borda esquerda" />
          </div>
        )}
      </div>

      <footer className="clean-editor__footer">
        <button type="button" onClick={() => rotate(-90)}>
          <RotateCcw />
          Girar à esquerda
        </button>
        <button type="button" onClick={() => rotate(90)}>
          <RotateCw />
          Girar à direita
        </button>
      </footer>
    </div>
  );
}
