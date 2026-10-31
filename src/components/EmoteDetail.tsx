import { useEffect, useRef, useState } from 'react';
import type { Emote } from '../lib/pose';
import { KIND_HINT, KIND_LABEL, altCommand, commandFor, sourceLabel, type ResourceFilter, type Syntax } from '../lib/commands';
import { Sketch } from './Sketch';
import { Emote3D } from './Emote3D';
import { previewFor } from '../lib/forge';
import { Icon } from './Icon';

interface Props {
  emote: Emote;
  index: number;
  syntax: Syntax;
  resource: ResourceFilter;
  favorite: boolean;
  onClose: () => void;
  onFavorite: (id: string) => void;
  onCopy: (text: string, label?: string) => void;
  onNavigate?: (direction: -1 | 1) => void;
  canNavigate?: { prev: boolean; next: boolean };
}

const SOURCE_URLS: Record<string, string> = {
  rpemotes: 'https://github.com/alberttheprince/rpemotes-reborn/blob/master/client/AnimationList.lua',
  scully: 'https://github.com/Scullyy/scully_emotemenu/tree/main/shared/data/emotes',
};

export function EmoteDetail({
  emote,
  index,
  syntax,
  resource,
  favorite,
  onClose,
  onFavorite,
  onCopy,
  onNavigate,
  canNavigate,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [frame, setFrame] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const renderImg = previewFor(emote);
  const [mode, setMode] = useState<'forge' | '3d' | 'sketch'>(renderImg ? 'forge' : '3d');
  const { command, hint } = commandFor(emote, syntax, resource);
  const alternative = altCommand(emote, syntax);
  const lua = [emote.dict && `dict  = "${emote.dict}"`, emote.anim && `anim  = "${emote.anim}"`]
    .filter(Boolean)
    .join('\n');

  useEffect(() => {
    setFrame(0);
    setZoomed(false);
    setMode(previewFor(emote) ? 'forge' : '3d');
  }, [emote.id]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (zoomed) {
          event.preventDefault();
          setZoomed(false);
          return;
        }
        event.preventDefault();
        onClose();
        return;
      }
      if (onNavigate && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        const direction = event.key === 'ArrowLeft' ? -1 : 1;
        const ok = event.key === 'ArrowLeft' ? canNavigate?.prev !== false : canNavigate?.next !== false;
        if (ok) {
          event.preventDefault();
          onNavigate(direction as -1 | 1);
        }
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose, onNavigate, canNavigate?.prev, canNavigate?.next, zoomed]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        ref={dialogRef}
      >
        <div className="modal-visual">
          {onNavigate && (
            <>
              <button
                type="button"
                className="modal-nav modal-nav--prev"
                onClick={() => onNavigate(-1)}
                disabled={!canNavigate?.prev}
                aria-label="Emote précédente"
              >
                <Icon name="chevron" size={20} />
              </button>
              <button
                type="button"
                className="modal-nav modal-nav--next"
                onClick={() => onNavigate(1)}
                disabled={!canNavigate?.next}
                aria-label="Emote suivante"
              >
                <Icon name="chevron" size={20} />
              </button>
              <span className="modal-position" aria-hidden="true">←/→</span>
            </>
          )}
          <div className="modal-visual-head">
            <span className="eyebrow">Aperçu</span>
            <div className="visual-toggle" role="group" aria-label="Mode d'aperçu">
              {renderImg && (
                <button
                  type="button"
                  className={mode === 'forge' ? 'is-active' : ''}
                  onClick={() => setMode('forge')}
                  aria-pressed={mode === 'forge'}
                >
                  Rendu GTA
                </button>
              )}
              <button
                type="button"
                className={mode === '3d' ? 'is-active' : ''}
                onClick={() => setMode('3d')}
                aria-pressed={mode === '3d'}
              >
                3D
              </button>
              <button
                type="button"
                className={mode === 'sketch' ? 'is-active' : ''}
                onClick={() => setMode('sketch')}
                aria-pressed={mode === 'sketch'}
              >
                Croquis
              </button>
            </div>
          </div>

          {mode === 'forge' ? (
            <div className="planche" aria-label="Rendu du jeu (Plebmasters Forge)">
              <div className="planche-frame planche-frame--forge">
                <button
                  type="button"
                  className="forge-zoom-trigger"
                  onClick={() => setZoomed(true)}
                  aria-label="Agrandir le rendu"
                  title="Cliquer pour agrandir"
                >
                  <img
                    className="forge-preview"
                    src={renderImg ?? ''}
                    alt={`Rendu du jeu : ${emote.label}`}
                    loading="eager"
                    referrerPolicy="no-referrer"
                    onError={() => setMode('3d')}
                  />
                </button>
              </div>
              <p className="sketch-disclaimer">
                Rendu de l’animation réelle provenant de Plebmasters Forge — cliquez pour agrandir.
              </p>
            </div>
          ) : mode === '3d' ? (
            <div className="planche" aria-label="Figure 3D illustrative">
              <div className="planche-frame planche-frame--3d">
                <Emote3D key={emote.id} emote={emote} index={index} />
              </div>
              <p className="sketch-disclaimer">
                Glissez pour tourner la figure, molette pour zoomer. Illustration 3D générée
                à partir du type d’emote — pas la capture exacte du jeu.
              </p>
            </div>
          ) : (
            <>
              <div className="planche">
                <div className="planche-frame">
                  <Sketch emote={emote} index={index} variant="detail" frame={frame} />
                </div>
              </div>

              <div className="filmstrip" role="group" aria-label="Séquence du croquis">
                {[
                  ['01', 'entrée'],
                  ['02', 'geste'],
                  ['03', 'retour'],
                ].map(([num, label], i) => (
                  <button
                    key={num}
                    type="button"
                    className={`frame-pick ${frame === i ? 'is-active' : ''}`}
                    onClick={() => setFrame(i)}
                    aria-pressed={frame === i}
                    aria-label={`Image ${num} — ${label}`}
                  >
                    <Sketch emote={emote} index={index} variant="detail" frame={i} />
                    <span className="frame-label">
                      <b>{num}</b>
                      {label}
                    </span>
                  </button>
                ))}
              </div>

              <p className="sketch-disclaimer">
                Croquis éditorial généré à partir du nom de l’emote. Il illustre l’intention, pas la capture exacte du jeu.
              </p>
            </>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-primary" onClick={() => onCopy(command, 'Commande copiée')}>
              <Icon name="copy" size={15} />
              Copier la commande
            </button>
            <button
              type="button"
              className={`btn btn-ghost ${favorite ? 'is-fav' : ''}`}
              onClick={() => onFavorite(emote.id)}
              aria-pressed={favorite}
            >
              <Icon name="heart" size={15} fill={favorite ? 'currentColor' : 'none'} />
              {favorite ? 'Dans les favoris' : 'Ajouter aux favoris'}
            </button>
          </div>
        </div>

        <div className="modal-content">
          <div className="modal-topline">
            <span className="cat-pill"><span className="cat-dot" />{emote.category}</span>
            <span className="kind-pill">{KIND_LABEL[emote.kind]}</span>
            <button ref={closeRef} type="button" className="icon-button modal-close" onClick={onClose} aria-label="Fermer">
              <Icon name="x" size={18} />
            </button>
          </div>

          <h2 id="detail-title">{emote.label}</h2>
          <p className="modal-desc">{KIND_HINT[emote.kind]}</p>

          <div className="command-box">
            <div className="command-main">
              <span className="command-label">Commande chat</span>
              <code>{command}</code>
            </div>
            <button type="button" className="copy-button" onClick={() => onCopy(command, 'Commande copiée')} aria-label="Copier la commande">
              <Icon name="copy" size={15} />
            </button>
            <p className="command-hint">
              {hint}
              {alternative && alternative !== command && (
                <> · variante&nbsp;: <code>{alternative}</code></>
              )}
            </p>
          </div>

          <dl className="meta-grid">
            <div>
              <dt>Type</dt>
              <dd>{KIND_LABEL[emote.kind]}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{sourceLabel(emote)}</dd>
            </div>
            {emote.dict && (
              <div className="meta-wide">
                <dt>Dictionnaire</dt>
                <dd>
                  <code>{emote.dict}</code>
                  <button type="button" className="inline-copy" onClick={() => onCopy(emote.dict!, 'Dictionnaire copié')} aria-label="Copier le dictionnaire">
                    <Icon name="copy" size={12} />
                  </button>
                </dd>
              </div>
            )}
            {emote.anim && (
              <div className="meta-wide">
                <dt>Animation</dt>
                <dd><code>{emote.anim}</code></dd>
              </div>
            )}
            {emote.scenario && (
              <div className="meta-wide">
                <dt>Scénario natif</dt>
                <dd><code>{emote.scenario}</code></dd>
              </div>
            )}
            {emote.prop && (
              <div className="meta-wide">
                <dt>Prop</dt>
                <dd><code>{emote.prop}</code></dd>
              </div>
            )}
            {emote.expression && (
              <div className="meta-wide">
                <dt>Mood</dt>
                <dd><code>{emote.expression}</code></dd>
              </div>
            )}
            {emote.walk && (
              <div className="meta-wide">
                <dt>Clipset</dt>
                <dd><code>{emote.walk}</code></dd>
              </div>
            )}
            {emote.other && (
              <div className="meta-wide">
                <dt>Partenaire</dt>
                <dd><code>/{syntax} {emote.other}</code></dd>
              </div>
            )}
          </dl>

          {lua && (
            <div className="code-block">
              <div className="code-head">
                <span>Référence technique</span>
                <button type="button" className="inline-copy" onClick={() => onCopy(lua, 'Référence copiée')}>
                  Copier
                </button>
              </div>
              <pre>{lua}</pre>
            </div>
          )}

          <div className="source-links">
            {emote.sources.map((source) => (
              <a key={source} href={SOURCE_URLS[source]} target="_blank" rel="noreferrer" className="source-link">
                {source === 'scully' ? 'scully_emotemenu' : 'rpemotes-reborn'}
                <Icon name="external" size={12} />
              </a>
            ))}
          </div>

          <p className="modal-note">
            Les alias et la disponibilité dépendent de la ressource et de la configuration du serveur.
            Les emotes <strong>prop</strong>, <strong>animal</strong> et <strong>duo</strong> peuvent nécessiter des réglages supplémentaires.
          </p>
        </div>
      </div>

      {zoomed && renderImg && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Rendu agrandi" onClick={() => setZoomed(false)}>
          <button type="button" className="icon-button lightbox-close" aria-label="Fermer l'aperçu">
            <Icon name="x" size={18} />
          </button>
          <img src={renderImg} alt={`Rendu du jeu : ${emote.label}`} referrerPolicy="no-referrer" />
          <span className="lightbox-caption">{emote.label} · {emote.dict}</span>
        </div>
      )}
    </div>
  );
}
