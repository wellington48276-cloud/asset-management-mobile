import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, RotateCcw, RotateCw, X } from 'lucide-react';
import './editor-clean.css';
import { canvasToCompressedDataUrl } from '../utils/image';

const MIN_SIZE = 70;

function rotatedSize(width, height, rotation) {
  return rotation % 180 === 0
    ? { width, height }
    : { width: height, height: width };
}

function rotateSourceImage(image, rotation) {
  const normalized = ((rotation % 360) + 360) % 360;
  const output = document.createElement('canvas');
  const swap = normalized === 90 || normalized === 270;

  output.width = swap ? image.naturalHeight : image.naturalWidth;
  output.height = swap ? image.naturalWidth : image.naturalHeight;

  const context = output.getContext('2d', { alpha: false });
  context.fillStyle = '#000';
  context.fillRect(0, 0, output.width, output.height);
  context.translate(output.width / 2, output.height / 2);
  context.rotate((normalized * Math.PI) / 180);
  context.drawImage(
    image,
    -image.naturalWidth / 2,
    -image.naturalHeight / 2
  );

  return output;
}

export default function PhotoEditor({ image, onCancel, onConfirm }) {
  const stageRef = useRef(null);
  const imageRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 });
  const [displayBox, setDisplayBox] = useState({ x: 0, y: 0, width: 1, height: 1 });
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 1, height: 1 });
  const [drag, setDrag] = useState(null);

  const rotated = useMemo(
    () => rotatedSize(naturalSize.width, naturalSize.height, rotation),
    [naturalSize, rotation]
  );

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = image;
  }, [image]);

  useEffect(() => {
    const measure = () => {
      const stage = stageRef.current;
      if (!stage || !rotated.width || !rotated.height) return;

      const bounds = stage.getBoundingClientRect();
      const availableWidth = bounds.width;
      const availableHeight = bounds.height;
      const scale = Math.min(
        availableWidth / rotated.width,
        availableHeight / rotated.height
      );

      const width = rotated.width * scale;
      const height = rotated.height * scale;
      const x = (availableWidth - width) / 2;
      const y = (availableHeight - height) / 2;

      setDisplayBox({ x, y, width, height });
      setCrop({ x, y, width, height });
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [rotated.width, rotated.height]);

  const pointFromEvent = (event) => {
    const touch = event.touches?.[0] || event.changedTouches?.[0];
    const source = touch || event;
    const stage = stageRef.current.getBoundingClientRect();

    return {
      x: source.clientX - stage.left,
      y: source.clientY - stage.top
    };
  };

  const beginDrag = (event, mode) => {
    event.preventDefault();
    event.stopPropagation();
    setDrag({
      mode,
      start: pointFromEvent(event),
      crop
    });
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

    let next = { ...original };

    if (drag.mode === 'move') {
      next.x = Math.min(
        imageRight - original.width,
        Math.max(imageLeft, original.x + dx)
      );
      next.y = Math.min(
        imageBottom - original.height,
        Math.max(imageTop, original.y + dy)
      );
    }

    if (drag.mode.includes('left')) {
      const right = original.x + original.width;
      next.x = Math.max(imageLeft, Math.min(right - MIN_SIZE, original.x + dx));
      next.width = right - next.x;
    }

    if (drag.mode.includes('right')) {
      next.width = Math.max(
        MIN_SIZE,
        Math.min(imageRight - original.x, original.width + dx)
      );
    }

    if (drag.mode.includes('top')) {
      const bottom = original.y + original.height;
      next.y = Math.max(imageTop, Math.min(bottom - MIN_SIZE, original.y + dy));
      next.height = bottom - next.y;
    }

    if (drag.mode.includes('bottom')) {
      next.height = Math.max(
        MIN_SIZE,
        Math.min(imageBottom - original.y, original.height + dy)
      );
    }

    setCrop(next);
  };

  const endDrag = () => setDrag(null);

  const rotate = (amount) => {
    setRotation((current) => (current + amount + 360) % 360);
  };

  const confirmCrop = () => {
    const sourceImage = imageRef.current;
    if (!sourceImage) return;

    const rotatedCanvas = rotateSourceImage(sourceImage, rotation);
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

    const output = document.createElement('canvas');
    output.width = sourceWidth;
    output.height = sourceHeight;

    const context = output.getContext('2d', { alpha: false });
    context.fillStyle = '#000';
    context.fillRect(0, 0, output.width, output.height);
    context.drawImage(
      rotatedCanvas,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      sourceWidth,
      sourceHeight
    );

    onConfirm(canvasToCompressedDataUrl(output));
  };

  return (
    <div
      className="clean-editor"
      onMouseMove={moveDrag}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onTouchMove={moveDrag}
      onTouchEnd={endDrag}
    >
      <header className="clean-editor__header">
        <button type="button" className="clean-editor__icon" onClick={onCancel} aria-label="Cancelar edição">
          <X />
        </button>

        <div>
          <strong>Recortar foto</strong>
          <span>Ajuste as bordas e confirme</span>
        </div>

        <button type="button" className="clean-editor__done" onClick={confirmCrop}>
          <Check size={19} />
          Concluir
        </button>
      </header>

      <div className="clean-editor__stage" ref={stageRef}>
        <img
          ref={imageRef}
          src={image}
          alt="Foto para recorte"
          draggable="false"
          className="clean-editor__image"
          style={{
            left: displayBox.x,
            top: displayBox.y,
            width: displayBox.width,
            height: displayBox.height,
            transform: `rotate(${rotation}deg)`
          }}
        />

        <div
          className="clean-editor__crop"
          style={{
            left: crop.x,
            top: crop.y,
            width: crop.width,
            height: crop.height
          }}
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
