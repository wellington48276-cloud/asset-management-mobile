import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Move, RotateCw, RotateCcw, X } from 'lucide-react';

const OUTPUT_WIDTH = 1600;
const OUTPUT_HEIGHT = 1200;

export default function PhotoEditor({ image, onCancel, onConfirm }) {
  const canvasRef = useRef(null);
  const sourceRef = useRef(null);
  const dragRef = useRef(null);

  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const getLayout = useCallback((source, angle) => {
    const rotated = angle % 180 !== 0;
    const visualWidth = rotated ? source.height : source.width;
    const visualHeight = rotated ? source.width : source.height;
    const scale = Math.max(OUTPUT_WIDTH / visualWidth, OUTPUT_HEIGHT / visualHeight);

    return {
      scale,
      renderedWidth: visualWidth * scale,
      renderedHeight: visualHeight * scale
    };
  }, []);

  const clampOffset = useCallback((nextOffset, source = sourceRef.current, angle = rotation) => {
    if (!source) return { x: 0, y: 0 };

    const { renderedWidth, renderedHeight } = getLayout(source, angle);
    const maxX = Math.max(0, (renderedWidth - OUTPUT_WIDTH) / 2);
    const maxY = Math.max(0, (renderedHeight - OUTPUT_HEIGHT) / 2);

    return {
      x: Math.max(-maxX, Math.min(maxX, nextOffset.x)),
      y: Math.max(-maxY, Math.min(maxY, nextOffset.y))
    };
  }, [getLayout, rotation]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const source = sourceRef.current;
    if (!canvas || !source) return;

    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_HEIGHT;

    const context = canvas.getContext('2d', { alpha: false });
    const { scale } = getLayout(source, rotation);
    const safeOffset = clampOffset(offset, source, rotation);

    context.fillStyle = '#000';
    context.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
    context.save();
    context.translate(OUTPUT_WIDTH / 2 + safeOffset.x, OUTPUT_HEIGHT / 2 + safeOffset.y);
    context.rotate((rotation * Math.PI) / 180);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(
      source,
      -(source.width * scale) / 2,
      -(source.height * scale) / 2,
      source.width * scale,
      source.height * scale
    );
    context.restore();
  }, [clampOffset, getLayout, offset, rotation]);

  useEffect(() => {
    const source = new Image();
    source.onload = () => {
      sourceRef.current = source;
      setOffset({ x: 0, y: 0 });
    };
    source.src = image;
  }, [image]);

  useEffect(() => {
    draw();
  }, [draw]);

  const getPointer = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const pointer = event.touches?.[0] || event;
    return {
      x: pointer.clientX - rect.left,
      y: pointer.clientY - rect.top
    };
  };

  const startDrag = (event) => {
    event.preventDefault();
    dragRef.current = {
      pointer: getPointer(event),
      offset
    };
  };

  const moveDrag = (event) => {
    if (!dragRef.current) return;
    event.preventDefault();

    const pointer = getPointer(event);
    const canvas = canvasRef.current;
    const scaleX = OUTPUT_WIDTH / canvas.clientWidth;
    const scaleY = OUTPUT_HEIGHT / canvas.clientHeight;

    const nextOffset = {
      x: dragRef.current.offset.x + (pointer.x - dragRef.current.pointer.x) * scaleX,
      y: dragRef.current.offset.y + (pointer.y - dragRef.current.pointer.y) * scaleY
    };

    setOffset(clampOffset(nextOffset));
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const rotate = (direction) => {
    const nextRotation = (rotation + direction + 360) % 360;
    setRotation(nextRotation);
    setOffset({ x: 0, y: 0 });
  };

  const confirm = () => {
    draw();
    onConfirm(canvasRef.current.toDataURL('image/jpeg', 0.96));
  };

  return (
    <div className="editor-modal editor-fullscreen" role="dialog" aria-label="Recortar foto">
      <div className="editor-fullscreen-head">
        <div>
          <h3>Recortar foto</h3>
          <p>Arraste a imagem. Tudo dentro do quadro será salvo.</p>
        </div>
        <button className="icon-button" onClick={onCancel} aria-label="Cancelar recorte">
          <X />
        </button>
      </div>

      <div className="editor-fullscreen-stage">
        <div className="crop-frame">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrag}
            onMouseMove={moveDrag}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            onTouchStart={startDrag}
            onTouchMove={moveDrag}
            onTouchEnd={endDrag}
          />
          <div className="crop-thirds" aria-hidden="true" />
          <div className="crop-hint"><Move size={15} /> Arraste para enquadrar</div>
        </div>
      </div>

      <div className="editor-fullscreen-controls crop-rotation-controls">
        <button onClick={() => rotate(-90)}>
          <RotateCcw size={19} /> Girar à esquerda
        </button>
        <button onClick={() => rotate(90)}>
          <RotateCw size={19} /> Girar à direita
        </button>
      </div>

      <div className="editor-fullscreen-actions">
        <button className="secondary-button" onClick={onCancel}>Refazer foto</button>
        <button className="primary-button" onClick={confirm}><Check size={18} /> Confirmar recorte</button>
      </div>
    </div>
  );
}
