import React, { useState } from 'react';
import { Layers, ArrowRight, Hash, Sparkles } from 'lucide-react';

export default function BatchScreen({ usuarioAtual, onStartBatch, playSound }) {
  const [init, setInit] = useState('100001');
  const [end, setEnd] = useState('100005');

  const aplicarPreset = (quantidade) => {
    if (playSound) playSound.playButtonClick();
    const startNum = parseInt(init, 10) || 100001;
    setEnd((startNum + quantidade - 1).toString());
  };

  const handleStart = (e) => {
    e.preventDefault();
    if (playSound) playSound.playButtonClick();

    const startNum = parseInt(init, 10);
    const endNum = parseInt(end, 10);

    if (isNaN(startNum) || isNaN(endNum) || endNum < startNum) {
      alert('Informe um intervalo numérico válido para o lote.');
      return;
    }

    const chapas = [];
    for (let i = startNum; i <= endNum; i++) {
      chapas.push(i.toString());
    }

    onStartBatch(chapas);
  };

  const totalCalculado = Math.max(0, (parseInt(end, 10) || 0) - (parseInt(init, 10) || 0) + 1);

  return (
    <div className="system-card glass-cyber">
      <div className="card-header">
        <h2>
          <Layers size={20} className="glow-icon" />
          Configurar Lote
        </h2>
        <p>Operador: {usuarioAtual}</p>
      </div>

      <form onSubmit={handleStart}>
        <div className="input-group">
          <label htmlFor="chapa-init">
            <Hash size={14} />
            Chapa Inicial do Lote
          </label>
          <input
            type="number"
            id="chapa-init"
            placeholder="100001"
            value={init}
            onChange={(e) => setInit(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="chapa-end">
            <Hash size={14} />
            Chapa Final do Lote
          </label>
          <input
            type="number"
            id="chapa-end"
            placeholder="100005"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>

        <div className="presets-container">
          <span>ATALHOS DE LOTE:</span>
          <div className="preset-buttons">
            <button type="button" className="btn-preset" onClick={() => aplicarPreset(5)}>+5 Chapas</button>
            <button type="button" className="btn-preset" onClick={() => aplicarPreset(10)}>+10 Chapas</button>
            <button type="button" className="btn-preset" onClick={() => aplicarPreset(20)}>+20 Chapas</button>
          </div>
        </div>

        <div className="batch-summary">
          <Sparkles size={16} />
          <span>Total de itens no lote: <strong>{totalCalculado}</strong></span>
        </div>

        <button type="submit" className="btn btn-tech-start">
          INICIAR REGISTROS
          <ArrowRight size={18} />
        </button>
      </form>
    </div>
  );
}
