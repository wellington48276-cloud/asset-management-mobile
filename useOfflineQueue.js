import { useMemo, useState } from 'react';
import { Hash, Layers3, Play, PlusCircle } from 'lucide-react';

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function buildRange(startValue, endValue) {
  const startText = onlyDigits(startValue);
  const endText = onlyDigits(endValue);
  if (!startText || !endText) return [];

  const start = Number(startText);
  const end = Number(endText);
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || end < start) return [];

  const amount = end - start + 1;
  if (amount > 5000) return [];

  const width = Math.max(startText.length, endText.length);
  return Array.from({ length: amount }, (_, index) => String(start + index).padStart(width, '0'));
}

export default function BatchScreen({ usuarioAtual, onStartBatch, playSound }) {
  const [mode, setMode] = useState('range');
  const [initialPlate, setInitialPlate] = useState('');
  const [finalPlate, setFinalPlate] = useState('');
  const [singlePlate, setSinglePlate] = useState('');
  const [error, setError] = useState('');

  const rangePlates = useMemo(
    () => buildRange(initialPlate, finalPlate),
    [initialPlate, finalPlate]
  );

  const selectedPlates = mode === 'range'
    ? rangePlates
    : onlyDigits(singlePlate)
      ? [onlyDigits(singlePlate)]
      : [];

  const start = () => {
    setError('');

    if (mode === 'range') {
      if (!initialPlate || !finalPlate) {
        setError('Informe a chapa inicial e a chapa final.');
        return;
      }
      if (Number(onlyDigits(finalPlate)) < Number(onlyDigits(initialPlate))) {
        setError('A chapa final deve ser maior ou igual à chapa inicial.');
        return;
      }
      if (!rangePlates.length) {
        setError('O intervalo deve conter no máximo 5.000 bens.');
        return;
      }
    }

    if (mode === 'single' && !selectedPlates.length) {
      setError('Informe a chapa do bem.');
      return;
    }

    playSound?.playButtonClick();
    onStartBatch(selectedPlates);
  };

  return (
    <section className="panel compact batch-panel">
      <div className="section-title">
        <Layers3 />
        <div>
          <h2>Patrimônio Bens Móveis</h2>
          <p>Olá, {usuarioAtual}. Escolha um intervalo de chapas ou cadastre somente um bem.</p>
        </div>
      </div>

      <div className="batch-mode-tabs" role="tablist" aria-label="Tipo de patrimônio">
        <button
          type="button"
          className={mode === 'range' ? 'active' : ''}
          onClick={() => { setMode('range'); setError(''); }}
        >
          <Hash size={18} /> Intervalo
        </button>
        <button
          type="button"
          className={mode === 'single' ? 'active' : ''}
          onClick={() => { setMode('single'); setError(''); }}
        >
          <PlusCircle size={18} /> Chapa única
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      {mode === 'range' ? (
        <div className="range-fields">
          <label className="field">
            <span>Chapa inicial</span>
            <input
              inputMode="numeric"
              value={initialPlate}
              onChange={(event) => setInitialPlate(onlyDigits(event.target.value))}
              placeholder="Ex.: 000120"
            />
          </label>
          <label className="field">
            <span>Chapa final</span>
            <input
              inputMode="numeric"
              value={finalPlate}
              onChange={(event) => setFinalPlate(onlyDigits(event.target.value))}
              placeholder="Ex.: 000135"
            />
          </label>
        </div>
      ) : (
        <label className="field single-field">
          <span>Chapa do bem</span>
          <input
            inputMode="numeric"
            value={singlePlate}
            onChange={(event) => setSinglePlate(onlyDigits(event.target.value))}
            placeholder="Ex.: 000120"
          />
        </label>
      )}

      <div className="batch-count-card">
        <span>{mode === 'range' ? 'Quantidade encontrada' : 'Quantidade selecionada'}</span>
        <strong>{selectedPlates.length}</strong>
        <small>{selectedPlates.length === 1 ? 'bem' : 'bens'}</small>
      </div>

      {mode === 'range' && selectedPlates.length > 0 && (
        <div className="range-preview">
          <span>De <b>{selectedPlates[0]}</b></span>
          <span>até <b>{selectedPlates[selectedPlates.length - 1]}</b></span>
        </div>
      )}

      <button className="primary-button" onClick={start} disabled={!selectedPlates.length}>
        <Play size={18} /> INICIAR PATRIMÔNIO
      </button>
    </section>
  );
}
