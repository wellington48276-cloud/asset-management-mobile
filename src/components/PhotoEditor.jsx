import { useEffect, useRef, useState } from 'react';
import { RotateCw, Check, X, ZoomIn, Move } from 'lucide-react';

export default function PhotoEditor({ image, onCancel, onConfirm }) {
  const canvasRef=useRef(null); const [rotation,setRotation]=useState(0); const [zoom,setZoom]=useState(1); const [x,setX]=useState(0); const [y,setY]=useState(0); const [drag,setDrag]=useState(null);
  useEffect(()=>{const img=new Image(); img.onload=()=>draw(img); img.src=image;},[image,rotation,zoom,x,y]);
  const draw=img=>{const c=canvasRef.current;if(!c)return; const size=900;c.width=size;c.height=size;const ctx=c.getContext('2d');ctx.fillStyle='#050b16';ctx.fillRect(0,0,size,size);ctx.save();ctx.translate(size/2+x,size/2+y);ctx.rotate(rotation*Math.PI/180);const base=Math.max(size/img.width,size/img.height)*zoom;ctx.drawImage(img,-img.width*base/2,-img.height*base/2,img.width*base,img.height*base);ctx.restore();ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=4;ctx.strokeRect(3,3,size-6,size-6);};
  const point=e=>{const r=canvasRef.current.getBoundingClientRect();const t=e.touches?.[0]||e;return {x:t.clientX-r.left,y:t.clientY-r.top}};
  const start=e=>{e.preventDefault();const p=point(e);setDrag({p,x,y})};
  const move=e=>{if(!drag)return;e.preventDefault();const p=point(e);setX(drag.x+(p.x-drag.p.x)*3);setY(drag.y+(p.y-drag.p.y)*3)};
  const end=()=>setDrag(null);
  const confirm=()=>onConfirm(canvasRef.current.toDataURL('image/jpeg',.95));
  return <div className="editor-modal"><div className="editor-card"><div className="editor-head"><div><h3>Ajustar foto</h3><p>Arraste para reposicionar, use zoom e rotação. A área quadrada será recortada.</p></div><button className="icon-button" onClick={onCancel}><X/></button></div>
    <div className="editor-stage"><canvas ref={canvasRef} onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchMove={move} onTouchEnd={end}/><div className="crop-hint"><Move size={15}/> Arraste a imagem</div></div>
    <div className="editor-controls"><label><ZoomIn size={17}/><input type="range" min="1" max="3" step=".05" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/></label><button onClick={()=>setRotation(r=>(r+90)%360)}><RotateCw size={18}/> Girar 90°</button></div>
    <div className="editor-actions"><button className="secondary-button" onClick={onCancel}>Cancelar</button><button className="primary-button" onClick={confirm}><Check size={18}/> Usar foto</button></div></div></div>;
}
