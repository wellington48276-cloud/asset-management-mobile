import { useMemo, useState } from 'react';
import { ListPlus, Play } from 'lucide-react';
export default function BatchScreen({ usuarioAtual, onStartBatch, playSound }) {
  const [text,setText]=useState(''); const chapas=useMemo(()=>[...new Set(text.split(/[\s,;]+/).map(v=>v.trim()).filter(Boolean))],[text]);
  const start=()=>{if(!chapas.length)return; playSound?.playButtonClick(); onStartBatch(chapas)};
  return <section className="panel compact"><div className="section-title"><ListPlus/><div><h2>Novo lote</h2><p>Olá, {usuarioAtual}. Informe as chapas patrimoniais.</p></div></div>
    <label className="field"><span>Chapas separadas por espaço, vírgula ou linha</span><textarea rows="7" value={text} onChange={e=>setText(e.target.value)} placeholder={'Exemplo:\n12345\n12346\n12347'} /></label>
    <div className="summary"><strong>{chapas.length}</strong> item(ns) preparado(s)</div>
    <button className="primary-button" onClick={start} disabled={!chapas.length}><Play size={18}/> INICIAR COLETA</button></section>;
}
