import { memo, useState } from 'react';
import type { Emote } from '../lib/pose';
import { commandFor, KIND_LABEL, sourceLabel, type ResourceFilter, type Syntax } from '../lib/commands';
import { previewFor } from '../lib/forge';
import { Sketch } from './Sketch';
import { Icon } from './Icon';

interface Props {
  emote: Emote;
  index: number;
  favorite: boolean;
  syntax: Syntax;
  resource: ResourceFilter;
  copied: boolean;
  onCopy: (emote: Emote) => void;
  onFavorite: (id: string) => void;
  onOpen: (emote: Emote) => void;
}

function EmoteCardBase({
  emote,
  index,
  favorite,
  syntax,
  resource,
  copied,
  onCopy,
  onFavorite,
  onOpen,
}: Props) {
  const { command } = commandFor(emote, syntax, resource);
  const render = previewFor(emote);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <article
      className="emote-card"
      data-kind={emote.kind}
      data-category={emote.category}
    >
      <div
        className="card-visual"
        role="button"
        tabIndex={0}
        aria-label={`Ouvrir la fiche de ${emote.label}`}
        onClick={() => onOpen(emote)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpen(emote);
          }
        }}
      >
        <Sketch emote={emote} index={index} />
        {render && !imgFailed && (
          <>
            <img
              className="forge-thumb"
              src={render}
              alt=""
              loading="lazy"
              aria-hidden="true"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
            />
            <span className="render-badge" aria-hidden="true">Rendu réel</span>
          </>
        )}
        <span className="kind-badge">{KIND_LABEL[emote.kind]}</span>
        <button
          className={`fav-button ${favorite ? 'is-fav' : ''}`}
          type="button"
          aria-label={favorite ? `Retirer ${emote.label} des favoris` : `Ajouter ${emote.label} aux favoris`}
          aria-pressed={favorite}
          onClick={(event) => {
            event.stopPropagation();
            onFavorite(emote.id);
          }}
        >
          <Icon name="heart" size={16} strokeWidth={2} fill={favorite ? 'currentColor' : 'none'} />
        </button>
        <span className="open-hint" aria-hidden="true">
          Voir la fiche <Icon name="arrow" size={13} />
        </span>
      </div>

      <div className="card-body">
        <div className="card-kicker">
          <span className="cat-dot" />
          <span>{emote.category}</span>
          {emote.prop && <span className="prop-flag" title={`Prop : ${emote.prop}`}>prop</span>}
        </div>
        <h3 className="card-title">
          <button type="button" onClick={() => onOpen(emote)}>
            {emote.label}
          </button>
        </h3>
        <div className="card-command">
          <code>{command}</code>
          <button
            type="button"
            className={`copy-button ${copied ? 'is-copied' : ''}`}
            onClick={() => onCopy(emote)}
            aria-label={`Copier ${command}`}
          >
            <Icon name={copied ? 'check' : 'copy'} size={14} />
          </button>
        </div>
        <div className="card-footer">
          <span className="source-chip" data-source={emote.sources.join('+')}>
            {sourceLabel(emote)}
          </span>
          <span className="card-code" title={emote.dict ? `${emote.dict} · ${emote.anim}` : emote.scenario ?? emote.command}>
            {emote.scenario ? emote.scenario : emote.dict}
          </span>
        </div>
      </div>
    </article>
  );
}

export const EmoteCard = memo(EmoteCardBase);
