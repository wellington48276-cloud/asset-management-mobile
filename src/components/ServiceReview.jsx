import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Camera, CheckCircle2, Loader2 } from 'lucide-react';
import { getDraftsForService } from '../services/db';

function ReviewThumbnail({ draft, plate }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!draft?.blob) {
      setUrl('');
      return undefined;
    }
    const nextUrl = URL.createObjectURL(draft.blob);
    setUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [draft]);

  return url ? <img src={url} alt={`Chapa ${plate}`} /> : <Camera size={30} />;
}

export default function ServiceReview({ service, onBack, onGoTo, onFinalize }) {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getDraftsForService(service.id)
      .then((items) => {
        if (alive) setDrafts(items);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [service.id]);

  const byPlate = useMemo(() => new Map(drafts.map((draft) => [draft.plate, draft])), [drafts]);
  const missing = service.plates.filter((plate) => !byPlate.has(plate));

  const finish = async () => {
    if (missing.length || finishing) return;
    setFinishing(true);
    try {
      await onFinalize(service.plates.map((plate) => byPlate.get(plate)));
    } finally {
      setFinishing(false);
    }
  };

  return (
    <section className="review-screen">
      <header className="review-screen__header">
        <button type="button" className="icon-button" onClick={onBack} aria-label="Voltar para a câmera">
          <ArrowLeft />
        </button>
        <div>
          <span>REVISÃO FINAL</span>
          <strong>{service.folder}</strong>
        </div>
        <b>{drafts.length}/{service.plates.length}</b>
      </header>

      <div className="review-screen__content">
        {loading ? (
          <div className="review-loading"><Loader2 className="spin" /> Carregando fotos...</div>
        ) : (
          <div className="review-grid">
            {service.plates.map((plate, index) => {
              const draft = byPlate.get(plate);
              return (
                <article className={`review-item ${draft ? 'done' : 'missing'}`} key={plate}>
                  <div className="review-item__thumb"><ReviewThumbnail draft={draft} plate={plate} /></div>
                  <div><strong>#{plate}</strong><span>{draft ? 'Foto pronta' : 'Foto pendente'}</span></div>
                  <button type="button" onClick={() => onGoTo(index)}>{draft ? 'REVISAR' : 'FOTOGRAFAR'}</button>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <footer className="review-screen__footer">
        {missing.length > 0
          ? <p>Faltam {missing.length} foto(s). Fotografe os itens pendentes para concluir.</p>
          : <p>Todas as fotos estão prontas para envio.</p>}
        <button type="button" className="primary-button" onClick={finish} disabled={missing.length > 0 || finishing}>
          <CheckCircle2 /> {finishing ? 'PREPARANDO ENVIO...' : 'CONCLUIR E ENVIAR'}
        </button>
      </footer>
    </section>
  );
}
