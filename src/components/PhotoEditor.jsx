import { useEffect, useRef, useState } from 'react';
import { Check, Move, RotateCw, X, ZoomIn } from 'lucide-react';

export default function PhotoEditor({ image, onCancel, onConfirm }) {
  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [drag, setDrag] = useState(null);

  useEffect(() => {
    const source = new Image();
    source.onload = () => draw(source);
    source.src = image;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, rotation, zoom, x, y]);

  const draw = (source) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 1200;
    const height = 900;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d', { alpha: false });
    context.fillStyle = '#02060c';
    context.fillRect(0, 0, width, height);
    context.save();
    context.translate(width / 2 + x, height / 2 + y);
    context.rotate(rotation * Math.PI / 180);

    const rotated = rotation % 180 !== 0;
    const effectiveWidth = rotated ? source.height : source.width;
    const effectiveHeight = rotated ? source.width : source.height;
    const base = Math.max(width / effectiveWidth, height / effectiveHeight) * zoom;

    context.drawImage(
      source,
      -source.width * base / 2,
      -source.height * base / 2,
      source.width * base,
      source.height * base
    );
    context.restore();
  };

  const point = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = event.touches?.[0] || event;
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const start = (event) => {
    event.preventDefault();
    setDrag({ point: point(event), x, y });
  };

  const move = (event) => {
    if (!drag) return;
    event.preventDefault();
    const current = point(event);
    const scaleX = canvasRef.current.width / canvasRef.current.clientWidth;
    const scaleY = canvasRef.current.height / canvasRef.current.clientHeight;
    setX(drag.x + (current.x - drag.point.x) * scaleX);
    setY(drag.y + (current.y - drag.point.y) * scaleY);
  };

  const end = () => setDrag(null);
  const confirm = () => onConfirm(canvasRef.current.toDataURL('image/jpeg', 0.96));

  return (
    <div className="editor-modal editor-fullscreen">
      <div className="editor-fullscreen-head">
        <div>
          <h3>Recortar e ajustar</h3>
          <p>A área visível será usada como foto final.</p>
        </div>
        <button className="icon-button" onClick={onCancel} aria-label="Fechar editor"><X /></button>
      </div>

      <div className="editor-fullscreen-stage">
        <canvas
          ref={canvasRef}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
        <div className="crop-guides" />
        <div className="crop-hint"><Move size={15} /> Arraste para enquadrar</div>
      </div>

      <div className="editor-fullscreen-controls">
        <label>
          <ZoomIn size={18} />
          <span>Zoom</span>
          <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
        </label>
        <button onClick={() => setRotation((value) => (value + 90) % 360)}>
          <RotateCw size={19} /> Girar 90°
        </button>
      </div>

      <div className="editor-fullscreen-actions">
        <button className="secondary-button" onClick={onCancel}>Cancelar</button>
        <button className="primary-button" onClick={confirm}><Check size={18} /> Usar foto</button>
      </div>
    </div>
  );
}
