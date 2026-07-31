import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle, Grid3X3, RefreshCw, SwitchCamera, ShieldCheck, AlertTriangle } from 'lucide-react';
import { salvarColetaData } from '../services/api';
import PhotoEditor from './PhotoEditor';

export default function CameraScreen({ listaChapas, usuarioAtual, onFinish, playSound, onColetaRegistrada }) {
  const [indexAtual,setIndexAtual]=useState(0); const [rawImage,setRawImage]=useState(null); const [capturedImage,setCapturedImage]=useState(null); const [enviando,setEnviando]=useState(false); const [cameraError,setCameraError]=useState(''); const [facingMode,setFacingMode]=useState('environment'); const [showGrid,setShowGrid]=useState(true); const [permissionAsked,setPermissionAsked]=useState(false); const [ready,setReady]=useState(false); const [notice,setNotice]=useState('');
  const videoRef=useRef(null), canvasRef=useRef(null), streamRef=useRef(null);
  const total=listaChapas.length, chapaAtual=listaChapas[indexAtual]||'', pct=total?Math.round(indexAtual/total*100):0;
  const stop=()=>{streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=null;setReady(false)};
  useEffect(()=>()=>stop(),[]);
  const requestCamera=async()=>{setPermissionAsked(true);setCameraError('');stop(); if(!navigator.mediaDevices?.getUserMedia){setCameraError('Este navegador não oferece acesso à câmera. Abra o sistema no Chrome ou Safari e use HTTPS.');return;}
    try {const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:facingMode},width:{ideal:3840,min:1280},height:{ideal:2160,min:720},frameRate:{ideal:30}}});streamRef.current=stream;videoRef.current.srcObject=stream;await videoRef.current.play();setReady(true);} catch(err){const msg=err.name==='NotAllowedError'?'Permissão negada. Toque no cadeado do navegador, permita a câmera e tente novamente.':err.name==='NotFoundError'?'Nenhuma câmera foi encontrada neste aparelho.':'Não foi possível abrir a câmera. Feche outros aplicativos que estejam usando a câmera e tente novamente.';setCameraError(msg);}};
  useEffect(()=>{if(permissionAsked) requestCamera();},[facingMode]);
  const capture=()=>{const v=videoRef.current,c=canvasRef.current;if(!ready||!v?.videoWidth)return;playSound?.playCameraShutter();const max=2560,scale=Math.min(1,max/v.videoWidth);c.width=Math.round(v.videoWidth*scale);c.height=Math.round(v.videoHeight*scale);const ctx=c.getContext('2d');if(facingMode==='user'){ctx.translate(c.width,0);ctx.scale(-1,1)}ctx.drawImage(v,0,0,c.width,c.height);setRawImage(c.toDataURL('image/jpeg',.97));};
  const save=async()=>{setEnviando(true);const r=await salvarColetaData(usuarioAtual,chapaAtual,capturedImage);onColetaRegistrada?.({chapa:chapaAtual,operador:usuarioAtual,fotoBase64:capturedImage,synced:!!r.success});setNotice(r.success?'Registro enviado com sucesso.':'Registro salvo no aparelho e aguardando conexão.');setEnviando(false);const next=indexAtual+1;if(next<total){setIndexAtual(next);setCapturedImage(null);setRawImage(null)}else{stop();playSound?.playSuccessSound();onFinish();}};
  if(!total)return <section className="panel compact"><div className="alert error">Nenhuma chapa foi informada.</div></section>;
  return <section className="panel camera-panel">
    <div className="camera-top"><div><span className="eyebrow">ITEM ATUAL</span><h2>#{chapaAtual}</h2></div><div className="progress-pill">{indexAtual+1}/{total}</div></div>
    <div className="progress-track"><i style={{width:`${pct}%`}}/></div>
    {notice&&<div className="alert success">{notice}</div>}
    {!permissionAsked?<div className="permission-card"><ShieldCheck size={42}/><h3>Permitir câmera do celular</h3><p>O sistema precisa da câmera principal do aparelho para produzir fotos nítidas. O navegador exibirá uma solicitação de permissão.</p><button className="primary-button" onClick={requestCamera}><Camera size={19}/> PERMITIR E ABRIR CÂMERA</button></div>:
    <><div className="camera-view">{cameraError?<div className="camera-error"><AlertTriangle size={34}/><p>{cameraError}</p><button className="secondary-button" onClick={requestCamera}>Tentar novamente</button></div>:<><video ref={videoRef} playsInline autoPlay muted className={capturedImage?'hidden':''}/>{capturedImage&&<img src={capturedImage} alt="Foto ajustada"/>}{showGrid&&!capturedImage&&<div className="camera-grid"/>}<div className="focus-frame"/></>}<canvas ref={canvasRef} hidden/></div>
    {!capturedImage&&<div className="camera-tools"><button onClick={()=>setShowGrid(v=>!v)} className={showGrid?'active':''}><Grid3X3/> Grade</button><button onClick={()=>setFacingMode(v=>v==='environment'?'user':'environment')}><SwitchCamera/> Inverter</button></div>}
    {!capturedImage?<button className="capture-button" onClick={capture} disabled={!ready||!!cameraError}><span><Camera size={25}/></span> TIRAR FOTO</button>:<div className="confirm-row"><button className="secondary-button" onClick={()=>setCapturedImage(null)} disabled={enviando}><RefreshCw/> Refazer</button><button className="primary-button" onClick={save} disabled={enviando}><CheckCircle/> {enviando?'SALVANDO...':'CONFIRMAR'}</button></div>}</>}
    {rawImage&&<PhotoEditor image={rawImage} onCancel={()=>setRawImage(null)} onConfirm={img=>{setCapturedImage(img);setRawImage(null);playSound?.playScanBeep()}}/>}
  </section>;
}
