import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import rawCatalogue from './data/catalogue.json';
import { enrich, type Emote, type Kind, type RawEmote } from './lib/pose';
import {
  KIND_LABEL,
  commandFor,
  type ResourceFilter,
  type Syntax,
} from './lib/commands';
import { EmoteCard } from './components/EmoteCard';
import { EmoteDetail } from './components/EmoteDetail';
import { Emote3D } from './components/Emote3D';
import { Icon } from './components/Icon';
import { previewFor } from './lib/forge';

const ALL: Emote[] = (rawCatalogue as RawEmote[]).map(enrich);
const HERO_GALLERY = pickHeroGallery();

const CATEGORY_ORDER = [
  'Danses',
  'Salutations',
  'Gestes',
  'Émotions',
  'Assis & repos',
  'Boire & manger',
  'Fumer',
  'Téléphone & tech',
  'Musique',
  'Sport & fitness',
  'Métiers & atelier',
  'Police & secours',
  'Animaux',
  'Objets',
  'Duo & synchronisé',
  'Expressions',
  'Démarches',
  'Scénarios',
  'Général',
];

const KIND_ORDER: Kind[] = ['animation', 'prop', 'scenario', 'synchronized', 'animal', 'expression', 'walk'];

const FAVORITES_KEY = 'terrain-emotes-favorites-v2';
const THEME_KEY = 'terrain-theme-v2';
const PAGE_SIZE = 48;

type Theme = 'dark' | 'light';
type Sort = 'guide' | 'az' | 'category';
type View = 'grid' | 'list';

function readTheme(): Theme {
  const saved = document.documentElement.dataset.theme;
  return saved === 'light' ? 'light' : 'dark';
}

function readFavorites(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]');
    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string') ? parsed : [];
  } catch {
    return [];
  }
}

async function writeClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fallback below for file:// pages and restricted browsers.
    }
  }
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.append(field);
  field.select();
  const ok = document.execCommand('copy');
  field.remove();
  if (!ok) throw new Error('clipboard unavailable');
}

const number = new Intl.NumberFormat('fr-FR');

function score(emote: Emote, needle: string): number {
  if (!needle) return 0;
  const command = emote.command.toLowerCase();
  const label = emote.label.toLowerCase();
  if (command === needle) return 0;
  if (command.startsWith(needle)) return 1;
  if (label.startsWith(needle)) return 2;
  if (label.includes(needle)) return 3;
  if (command.includes(needle)) return 4;
  return 5;
}

/** Compteur qui monte de 0 à `to` quand il entre à l'écran. */
function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setValue(to);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const duration = 1400;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          setValue(Math.round(to * (1 - Math.pow(1 - t, 3))));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.35 },
    );
    const el = ref.current;
    if (!el) return;
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);

  return <span ref={ref as React.RefObject<HTMLSpanElement>}>{number.format(value)}</span>;
}

/** Échantillon d'emotes vedettes pour la galerie du hero. */
function pickHeroGallery(): Emote[] {
  const wanted = ['dance', 'salute', 'wave', 'facepalm', 'airguitar', 'music', 'pushup', 'drink', 'bow', 'dance2'];
  const byCommand = new Map(ALL.map((emote) => [emote.command, emote]));
  const picked = new Map<string, Emote>();
  for (const cmd of wanted) {
    const emote = byCommand.get(cmd);
    if (emote && previewFor(emote)) picked.set(cmd, emote);
  }
  const pool = ALL.filter((emote) => emote.kind === 'animation' && previewFor(emote));
  const step = Math.max(1, Math.floor(pool.length / 14));
  for (let i = Math.floor(pool.length / 2); i < pool.length && picked.size < 12; i += step) {
    picked.set(pool[i].id, pool[i]);
  }
  return [...picked.values()];
}

function App() {
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [category, setCategory] = useState('Tout');
  const [kind, setKind] = useState<'all' | Kind>('all');
  const [resource, setResource] = useState<ResourceFilter>('all');
  const [syntax, setSyntax] = useState<Syntax>('e');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(readFavorites);
  const [sort, setSort] = useState<Sort>('guide');
  const [view, setView] = useState<View>('grid');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [slide, setSlide] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [selected, setSelected] = useState<Emote | null>(() => {
    const id = new URLSearchParams(window.location.search).get('emote');
    return id ? ALL.find((item) => item.id === id) ?? null : null;
  });
  const [copied, setCopied] = useState('');
  const [toast, setToast] = useState('');
  const [mobileFilters, setMobileFilters] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* session-only theme */
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      /* session-only favorites */
    }
  }, [favorites]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (HERO_GALLERY.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (document.hidden) return;
    const id = window.setInterval(() => setSlide((current) => (current + 1) % HERO_GALLERY.length), 4200);
    return () => clearInterval(id);
  }, []);


  useEffect(() => {
    const url = new URL(window.location.href);
    if (selected) url.searchParams.set('emote', selected.id);
    else url.searchParams.delete('emote');
    window.history.replaceState(null, '', url);
  }, [selected]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;
      if ((event.key === '/' && !typing) || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')) {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (event.key === 'Escape' && document.activeElement === searchRef.current) {
        setQuery('');
      }
      if (!typing && !event.metaKey && !event.ctrlKey && (event.key === 'g' || event.key === 'l')) {
        setView(event.key === 'g' ? 'grid' : 'list');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const emote of ALL) map.set(emote.category, (map.get(emote.category) ?? 0) + 1);
    return map;
  }, []);

  const sourceCounts = useMemo(
    () => ({
      rpemotes: ALL.filter((emote) => emote.sources.includes('rpemotes')).length,
      scully: ALL.filter((emote) => emote.sources.includes('scully')).length,
    }),
    [],
  );

  const categories = useMemo(
    () => CATEGORY_ORDER.filter((item) => (counts.get(item) ?? 0) > 0),
    [counts],
  );

  const visible = useMemo(() => {
    const needle = deferredQuery.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const tokens = needle.split(/\s+/).filter(Boolean);
    const list = ALL.filter((emote) => {
      if (category !== 'Tout' && emote.category !== category) return false;
      if (kind !== 'all' && emote.kind !== kind) return false;
      if (resource !== 'all' && !emote.sources.includes(resource)) return false;
      if (favoritesOnly && !favoriteSet.has(emote.id)) return false;
      return tokens.every((token) => emote.search.includes(token));
    });

    if (sort === 'az') {
      list.sort((a, b) => a.label.localeCompare(b.label, 'fr'));
    } else if (sort === 'category') {
      list.sort((a, b) => a.category.localeCompare(b.category, 'fr') || a.label.localeCompare(b.label, 'fr'));
    } else if (needle) {
      list.sort((a, b) => score(a, needle) - score(b, needle) || a.label.length - b.label.length);
    } else {
      list.sort(
        (a, b) =>
          (CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)) ||
          a.label.localeCompare(b.label, 'fr'),
      );
    }
    return list;
  }, [category, favoriteSet, favoritesOnly, kind, resource, deferredQuery, sort]);

  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [category, kind, resource, favoritesOnly, deferredQuery, sort]);

  const shown = visible.slice(0, limit);

  const notify = useCallback((message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2400);
  }, []);

  const copy = useCallback(
    async (text: string, label = 'Copié') => {
      try {
        await writeClipboard(text);
        notify(label);
      } catch {
        notify('Copie impossible dans ce navigateur — sélectionnez le texte manuellement.');
      }
    },
    [notify],
  );

  const copyEmote = useCallback(
    (emote: Emote) => {
      const { command } = commandFor(emote, syntax, resource);
      void copy(command, `${command} · copié`);
      setCopied(emote.id);
      window.setTimeout(() => setCopied((current) => (current === emote.id ? '' : current)), 1300);
    },
    [copy, resource, syntax],
  );

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [id, ...current],
    );
  }, []);

  const resetFilters = () => {
    setQuery('');
    setCategory('Tout');
    setKind('all');
    setResource('all');
    setFavoritesOnly(false);
    setSort('guide');
  };

  const randomEmote = () => {
    const pool = visible.length ? visible : ALL;
    setSelected(pool[Math.floor(Math.random() * pool.length)]);
  };

  const activeFilters =
    (query ? 1 : 0) +
    (category !== 'Tout' ? 1 : 0) +
    (kind !== 'all' ? 1 : 0) +
    (resource !== 'all' ? 1 : 0) +
    (favoritesOnly ? 1 : 0);

  const mappedCount = useMemo(
    () => ALL.reduce((acc, emote) => acc + (previewFor(emote) ? 1 : 0), 0),
    [],
  );

  const navInfo = useMemo(() => {
    if (!selected) return null;
    const list = visible.some((item) => item.id === selected.id) ? visible : ALL;
    const idx = list.findIndex((item) => item.id === selected.id);
    return { list, idx };
  }, [selected, visible]);

  const goTo = useCallback(
    (direction: -1 | 1) => {
      if (!navInfo || navInfo.idx < 0) return;
      const next = navInfo.list[navInfo.idx + direction];
      if (next) setSelected(next);
    },
    [navInfo],
  );

  const featured = useMemo(
    () => ALL.find((emote) => emote.command === 'dance') ?? ALL.find((emote) => emote.category === 'Danses') ?? ALL[0],
    [],
  );

  return (
    <div className="app">
      <div className="ambient" aria-hidden="true">
        <div className="ambient-a" />
        <div className="ambient-b" />
        <div className="ambient-grid" />
      </div>

      <header className={`topbar ${scrolled ? 'is-compact' : ''}`}>
        <a className="brand" href="#top" aria-label="Terrain, retour en haut">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="22" height="22">
              <path d="M5 10h22M8 10v16M24 10v16M5 26h22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </span>
          <span className="brand-text">Terrain<span>.</span></span>
        </a>

        <nav className="main-nav" aria-label="Navigation principale">
          <a href="#catalogue">Catalogue</a>
          <a href="#guide">Guide</a>
          <a href="#sources">Sources</a>
        </nav>

        <div className="topbar-actions">
          <span className="offline-pill"><span className="signal-dot" /> {number.format(ALL.length)} emotes · hors-ligne</span>
          <button
            type="button"
            className="icon-button theme-button"
            onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            aria-label={`Activer le thème ${theme === 'dark' ? 'clair' : 'sombre'}`}
            title={`Thème ${theme === 'dark' ? 'clair' : 'sombre'}`}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><Icon name="sparkles" size={13} /> Répertoire roleplay · édition locale</p>
            <h1>
              Les bons gestes.
              <br />
              <span>Au bon moment.</span>
            </h1>
            <p className="hero-lead">
              {number.format(ALL.length)} emotes réelles, leurs dictionnaires, leurs props et toutes les
              commandes prêtes à coller dans le chat. Extrait de <strong>rpemotes-reborn</strong> et
              <strong> scully_emotemenu</strong>, sans animation inventée.
            </p>

            <div className="hero-actions">
              <a className="btn btn-primary" href="#catalogue">
                Explorer le catalogue <Icon name="arrow" size={16} />
              </a>
              <button type="button" className="btn btn-ghost" onClick={randomEmote}>
                <Icon name="dice" size={16} /> Surprends-moi
              </button>
            </div>

            <dl className="hero-stats">
              <div>
                <dt>Emotes</dt>
                <dd><CountUp to={ALL.length} /></dd>
              </div>
              <div>
                <dt>Rendus GTA</dt>
                <dd><CountUp to={mappedCount} /></dd>
              </div>
              <div>
                <dt>Catégories</dt>
                <dd>{categories.length}</dd>
              </div>
              <div>
                <dt>Hors-ligne</dt>
                <dd>100%</dd>
              </div>
            </dl>
          </div>

          <div className={`hero-art ${HERO_GALLERY.length ? 'has-gallery' : ''}`}>
            {(() => {
              const item = HERO_GALLERY.length
                ? HERO_GALLERY[slide % HERO_GALLERY.length]
                : featured;
              const img = previewFor(item);
              return (
                <div
                  className="hero-card"
                  role="button"
                  tabIndex={0}
                  aria-label={`Ouvrir la fiche de ${item.label}`}
                  onClick={() => setSelected(item)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelected(item);
                    }
                  }}
                >
                  <div className="hero-card-head">
                    <span>Planche {String(ALL.indexOf(item) + 1).padStart(3, '0')}</span>
                    <span>{item.category} / {KIND_LABEL[item.kind]}</span>
                  </div>
                  <div className="hero-visual" key={item.id}>
                    {img ? (
                      <img src={img} alt="" referrerPolicy="no-referrer" />
                    ) : (
                      <Emote3D emote={item} index={ALL.indexOf(item)} className="hero-3d" />
                    )}
                  </div>
                  {HERO_GALLERY.length > 1 && (
                    <div className="hero-dots" aria-hidden="true">
                      {HERO_GALLERY.slice(0, 8).map((galleryItem, i) => (
                        <button
                          key={galleryItem.id}
                          type="button"
                          className={slide % HERO_GALLERY.length === i ? 'is-active' : ''}
                          onClick={(event) => {
                            event.stopPropagation();
                            setSlide(i);
                          }}
                          aria-label={`Vedette ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}
                  <div className="hero-card-foot">
                    <code>{commandFor(item, syntax, resource).command}</code>
                    <span>{img ? 'rendu réel' : 'croquis animé'}</span>
                  </div>
                </div>
              );
            })()}
            <span className="float-tag tag-a">{number.format(ALL.length)} entrées</span>
            <span className="float-tag tag-b">/e · /emote · /eplay</span>
            <span className="float-tag tag-c">{number.format(mappedCount)} rendus GTA réels</span>
            <span className="orbit-ring" />
          </div>
        </section>

        <section className="catalogue" id="catalogue" aria-labelledby="catalogue-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">Le catalogue</p>
              <h2 id="catalogue-title">Trouvez, copiez, entrez en scène.</h2>
            </div>
            <p className="section-note">
              Recherche instantanée dans les noms, commandes, dictionnaires et props.
            </p>
          </div>

          <div className="sticky-dock">
            <div className="search-row">
              <label className="search-field">
                <Icon name="search" size={18} />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Chercher une emote, un geste, un prop, un dictionnaire…"
                  aria-label="Rechercher une emote"
                  autoComplete="off"
                  spellCheck={false}
                />
                {query ? (
                  <button type="button" className="icon-button clear-button" onClick={() => setQuery('')} aria-label="Effacer la recherche">
                    <Icon name="x" size={15} />
                  </button>
                ) : (
                  <span className="key-hint"><Icon name="command" size={11} /> K</span>
                )}
              </label>

              <button
                type="button"
                className={`btn btn-ghost favorites-button ${favoritesOnly ? 'is-active' : ''}`}
                onClick={() => {
                  setFavoritesOnly((current) => !current);
                  setCategory('Tout');
                }}
                aria-pressed={favoritesOnly}
              >
                <Icon name="heart" size={16} fill={favoritesOnly ? 'currentColor' : 'none'} />
                Favoris
                <span className="count-chip">{favorites.length}</span>
              </button>

              <button type="button" className="btn btn-ghost random-button" onClick={randomEmote}>
                <Icon name="dice" size={16} />
                <span>Au hasard</span>
              </button>

              <div className="view-toggle" role="group" aria-label="Affichage">
                <button type="button" className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')} aria-label="Grille" aria-pressed={view === 'grid'}>
                  <Icon name="grid" size={16} />
                </button>
                <button type="button" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} aria-label="Liste" aria-pressed={view === 'list'}>
                  <Icon name="list" size={16} />
                </button>
              </div>
            </div>

            <div className="category-rail" role="tablist" aria-label="Catégories">
              <button
                type="button"
                role="tab"
                aria-selected={category === 'Tout'}
                className={`cat-chip ${category === 'Tout' ? 'active' : ''}`}
                onClick={() => {
                  setCategory('Tout');
                  setFavoritesOnly(false);
                }}
              >
                Tout <span>{ALL.length}</span>
              </button>
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={category === item}
                  className={`cat-chip ${category === item ? 'active' : ''}`}
                  onClick={() => {
                    setCategory(item);
                    setFavoritesOnly(false);
                  }}
                >
                  {item} <span>{counts.get(item)}</span>
                </button>
              ))}
            </div>

            <div className={`filter-row ${mobileFilters ? 'is-open' : ''}`}>
              <label className="select-field">
                <span>Type</span>
                <select value={kind} onChange={(event) => setKind(event.target.value as 'all' | Kind)}>
                  <option value="all">Tous les types</option>
                  {KIND_ORDER.map((item) => (
                    <option key={item} value={item}>{KIND_LABEL[item]}</option>
                  ))}
                </select>
                <Icon name="chevron" size={13} />
              </label>

              <label className="select-field">
                <span>Ressource</span>
                <select value={resource} onChange={(event) => setResource(event.target.value as ResourceFilter)}>
                  <option value="all">Toutes</option>
                  <option value="rpemotes">rpemotes-reborn</option>
                  <option value="scully">scully_emotemenu</option>
                </select>
                <Icon name="chevron" size={13} />
              </label>

              <label className="select-field">
                <span>Trier</span>
                <select value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
                  <option value="guide">Ordre du guide</option>
                  <option value="az">A → Z</option>
                  <option value="category">Par catégorie</option>
                </select>
                <Icon name="chevron" size={13} />
              </label>

              <div className="syntax-field">
                <span>Syntaxe</span>
                <div className="segmented" role="group" aria-label="Syntaxe de commande">
                  {(['e', 'emote', 'eplay'] as Syntax[]).map((item) => (
                    <button key={item} type="button" className={syntax === item ? 'active' : ''} onClick={() => setSyntax(item)} aria-pressed={syntax === item}>
                      /{item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="result-summary">
                <strong>{number.format(visible.length)}</strong>
                <span>résultat{visible.length > 1 ? 's' : ''}</span>
                {activeFilters > 0 && (
                  <button type="button" className="reset-filters" onClick={resetFilters}>
                    <Icon name="reset" size={12} /> Réinitialiser
                  </button>
                )}
              </div>

              <button
                type="button"
                className="btn btn-ghost mobile-filter-button"
                onClick={() => setMobileFilters((current) => !current)}
                aria-expanded={mobileFilters}
              >
                <Icon name="sliders" size={16} /> Filtres {activeFilters > 0 ? `(${activeFilters})` : ''}
              </button>
            </div>
          </div>

          {shown.length ? (
            <>
              <div className={`emote-grid ${view === 'list' ? 'is-list' : ''}`}>
                {shown.map((emote) => (
                  <EmoteCard
                    key={emote.id}
                    emote={emote}
                    index={ALL.indexOf(emote)}
                    favorite={favoriteSet.has(emote.id)}
                    syntax={syntax}
                    resource={resource}
                    copied={copied === emote.id}
                    onCopy={copyEmote}
                    onFavorite={toggleFavorite}
                    onOpen={setSelected}
                  />
                ))}
              </div>

              <div className="load-more">
                {limit < visible.length ? (
                  <>
                    <button type="button" className="btn btn-ghost" onClick={() => setLimit((current) => current + PAGE_SIZE)}>
                      Charger {Math.min(PAGE_SIZE, visible.length - limit)} emotes
                    </button>
                    <span>{number.format(limit)} / {number.format(visible.length)} affichées</span>
                  </>
                ) : (
                  <span>{number.format(visible.length)} emote{visible.length > 1 ? 's' : ''} · fin du catalogue</span>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><Icon name={favoritesOnly ? 'heart' : 'search'} size={26} /></div>
              <h3>{favoritesOnly && favorites.length === 0 ? 'Votre carnet est vide' : 'Aucun geste trouvé'}</h3>
              <p>
                {favoritesOnly && favorites.length === 0
                  ? 'Touchez le cœur d’une emote pour la garder sous la main.'
                  : 'Essayez un autre mot, ou retirez un filtre.'}
              </p>
              <button type="button" className="btn btn-primary" onClick={resetFilters}>Tout afficher</button>
            </div>
          )}
        </section>

        <section className="guide" id="guide" aria-labelledby="guide-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">Sur le terrain</p>
              <h2 id="guide-title">Trois secondes, pas trois menus.</h2>
            </div>
            <p className="section-note">
              Le catalogue est pensé pour rester ouvert à côté du jeu.
            </p>
          </div>
          <div className="guide-grid">
            <article>
              <span className="step">01</span>
              <h3>Cherchez</h3>
              <p>Un mot, une commande, un dictionnaire, un prop. La recherche ignore les accents et les underscores.</p>
              <code>/</code>
            </article>
            <article>
              <span className="step">02</span>
              <h3>Copiez</h3>
              <p>La commande choisie est copiée avec la syntaxe de votre ressource. Le détail donne aussi dict et anim.</p>
              <Icon name="copy" size={18} />
            </article>
            <article>
              <span className="step">03</span>
              <h3>Gardez</h3>
              <p>Épinglez vos favoris : ils restent dans le navigateur, même après une coupure du serveur.</p>
              <Icon name="heart" size={18} />
            </article>
          </div>
        </section>

        <section className="sources" id="sources" aria-labelledby="sources-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">Traçabilité</p>
              <h2 id="sources-title">Aucune animation inventée.</h2>
            </div>
            <p className="section-note">
              Chaque entrée provient d’une ressource publique, avec son dictionnaire et son animation d’origine.
            </p>
          </div>

          <div className="source-grid">
            <a className="source-card" href="https://github.com/alberttheprince/rpemotes-reborn" target="_blank" rel="noreferrer">
              <div className="source-card-top">
                <span className="source-logo">RP</span>
                <Icon name="external" size={16} />
              </div>
              <h3>rpemotes-reborn</h3>
              <p>Le menu d’emotes communautaire pour FiveM : humains, animaux, props, expressions et démarches.</p>
              <span className="source-count">{number.format(sourceCounts.rpemotes)} entrées · AnimationList.lua</span>
            </a>
            <a className="source-card" href="https://github.com/Scullyy/scully_emotemenu" target="_blank" rel="noreferrer">
              <div className="source-card-top">
                <span className="source-logo">SC</span>
                <Icon name="external" size={16} />
              </div>
              <h3>scully_emotemenu</h3>
              <p>Un menu moderne avec catégories, emotes synchronisées, consommables et props détaillés.</p>
              <span className="source-count">{number.format(sourceCounts.scully)} entrées · shared/data/emotes</span>
            </a>
            <div className="source-card source-card--note">
              <div className="source-card-top">
                <span className="source-logo">!</span>
                <Icon name="sparkles" size={16} />
              </div>
              <h3>Bon à savoir</h3>
              <p>Les commandes dépendent des ressources installées et de leur configuration. Les croquis sont des illustrations, pas des captures du jeu.</p>
              <span className="source-count">Projet indépendant · aucune affiliation</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-brand">
          <span className="brand-text">Terrain<span>.</span></span>
          <p>Catalogue local d’emotes GTA V &amp; FiveM. Fonctionne sans compte, sans API et sans connexion.</p>
        </div>
        <div className="footer-links">
          <a href="#catalogue">Catalogue</a>
          <a href="#guide">Guide</a>
          <a href="https://github.com/khrone18/Catalogue-animations-GTA-5-RP" target="_blank" rel="noreferrer">
            <Icon name="github" size={14} /> GitHub
          </a>
        </div>
        <div className="footer-meta">
          <span>{number.format(ALL.length)} emotes · {categories.length} catégories</span>
          <span><Icon name="keyboard" size={12} /> <kbd>/</kbd> ou <kbd>⌘K</kbd> pour chercher</span>
        </div>
      </footer>

      {selected && (
        <EmoteDetail
          emote={selected}
          index={ALL.indexOf(selected)}
          syntax={syntax}
          resource={resource}
          favorite={favoriteSet.has(selected.id)}
          onClose={() => setSelected(null)}
          onFavorite={toggleFavorite}
          onCopy={copy}
          onNavigate={navInfo && navInfo.list.length > 1 ? goTo : undefined}
          canNavigate={
            navInfo && navInfo.list.length > 1
              ? { prev: navInfo.idx > 0, next: navInfo.idx < navInfo.list.length - 1 }
              : undefined
          }
        />
      )}

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <Icon name="check" size={14} /> {toast}
        </div>
      )}
    </div>
  );
}

export default App;
