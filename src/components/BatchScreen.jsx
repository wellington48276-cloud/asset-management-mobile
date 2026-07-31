import React, { useState } from 'react';
import { Layers, ArrowRight, Hash } from 'lucide-react';

export default function BatchScreen({ usuarioAtual, onStartBatch }) {
  const [init, setInit] = useState('100001');
  const [end, setEnd] = useState('100005');

  const vibrar = () => {
    if ("vibrate" in navigator) navigator.vibrate(30);
  };

  const handleStart = (e) => {
    e.preventDefault();
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

    vibrar();
    onStartBatch(chapas);
  };

  return (
    <div className="system-card">
      <div className="card-header">
        <h2>
          <Layers size={20} />
          OFICIAL: {usuarioAtual.toUpperCase()}
        </h2>
        <p>PARÂMETROS DA SEQUÊNCIA DE REGISTROS</p>
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

        <button type="submit" className="btn btn-tech-start">
          AVANÇAR
          <ArrowRight size={18} />
        </button>
      </form>
    </div>
  );
}
