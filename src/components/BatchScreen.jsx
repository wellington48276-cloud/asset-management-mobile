import { useMemo, useState } from 'react';
import { Hash, Layers3, Play, PlusCircle, Route, UserRound } from 'lucide-react';

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

  const rangePlates = useMemo(() => buildRange(initialPlate, finalPlate), [initialPlate, finalPlate]);
  const selectedPlates = mode === 'range'
    ? rangePlates
    : onlyDigits(singlePlate)
      ? [onlyDigits(singlePlate)]
      : [];

  const start = () => {
    setError('');
    if (mode === 'range') {
      if (!initialPlate || !finalPlate) return setError('Informe a chapa inicial e a chapa final.');
      if (Number(onlyDigits(finalPlate)) < Number(onlyDigits(initialPlate))) return setError('A chapa final deve ser maior ou igual à chapa inicial.');
      if (!rangePlates.length) return setError('O intervalo deve conter no máximo 5.000 bens.');
    }
    if (mode === 'single' && !selectedPlates.length) return setError('Informe a chapa do bem.');

    playSound?.playButtonClick();
    onStartBatch(selectedPlates);
  };

  return (
    <section className="panel batch-panel">
      <div className="batch-hero">
        <div className="batch-hero__icon"><Layers3 /></div>
        <div>
          <span className="eyebrow">NOVO SERVIÇO</span>
          <h2>Preparar serviço de rua</h2>
          <p><UserRound size={15} /> Patrimoniador: <strong>{usuarioAtual}</strong></p>
        </div>
      </div>

      <div className="batch-mode-tabs" role="tablist" aria-label="Tipo de serviço">
        <button type="button" className={mode === 'range' ? 'active' : ''} onClick={() => { setMode('range'); setError(''); }}>
          <Hash size={18} />
          <span><strong>Intervalo</strong><small>Várias chapas em sequência</small></span>
        </button>
        <button type="button" className={mode === 'single' ? 'active' : ''} onClick={() => { setMode('single'); setError(''); }}>
          <PlusCircle size={18} />
          <span><strong>Chapa única</strong><small>Somente um bem</small></span>
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="batch-form-card">
        {mode === 'range' ? (
          <div className="range-fields">
            <label className="field">
              <span>Chapa inicial</span>
              <input inputMode="numeric" value={initialPlate} onChange={(event) => setInitialPlate(onlyDigits(event.target.value))} placeholder="Ex.: 2005" />
            </label>
            <div className="range-separator"><Route size={18} /></div>
            <label className="field">
              <span>Chapa final</span>
              <input inputMode="numeric" value={finalPlate} onChange={(event) => setFinalPlate(onlyDigits(event.target.value))} placeholder="Ex.: 2010" />
            </label>
          </div>
        ) : (
          <label className="field single-field">
            <span>Chapa do bem</span>
            <input inputMode="numeric" value={singlePlate} onChange={(event) => setSinglePlate(onlyDigits(event.target.value))} placeholder="Ex.: 2005" />
          </label>
        )}
      </div>

      <div className="batch-summary">
        <div>
          <span>{mode === 'range' ? 'Itens do intervalo' : 'Item selecionado'}</span>
          <strong>{selectedPlates.length}</strong>
          <small>{selectedPlates.length === 1 ? 'bem' : 'bens'}</small>
        </div>
        {mode === 'range' && selectedPlates.length > 0 && (
          <div className="range-preview">
            <span>{selectedPlates[0]}</span><i>até</i><span>{selectedPlates[selectedPlates.length - 1]}</span>
          </div>
        )}
      </div>

      <button className="primary-button batch-start" onClick={start} disabled={!selectedPlates.length}>
        <Play size={18} /> INICIAR SERVIÇO DE RUA
      </button>
    </section>
  );
}
