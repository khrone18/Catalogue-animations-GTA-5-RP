# Terrain — catalogue d'emotes GTA V & FiveM

Catalogue local de **3 739 emotes réelles** issues de deux ressources FiveM
open source :

- [rpemotes-reborn](https://github.com/alberttheprince/rpemotes-reborn)
- [scully_emotemenu](https://github.com/Scullyy/scully_emotemenu)

Recherche instantanée, filtres, favoris, commandes prêtes à copier, planches de
croquis animés et mode hors-ligne. **Aucune animation n'est inventée** : les
commandes, dictionnaires, props et scénarios viennent directement des tables Lua
des ressources. Voir [`data/README.md`](data/README.md) pour les sources exactes.

## Démarrage rapide

Prérequis : **Node.js 20+**.

```bash
npm install
npm run dev
```

Le site s'ouvre sur `http://localhost:5173`.

## Scripts

| Commande | Effet |
| --- | --- |
| `npm run dev` | serveur de développement (rechargement à chaud) |
| `npm start` | identique à `dev`, ouvre le navigateur |
| `npm run build` | vérification TypeScript + build de production dans `dist/` |
| `npm run preview` | sert le build de production |
| `npm run standalone` | build + fichier HTML unique autonome |
| `npm run data` | régénère `src/data/catalogue.json` depuis les sources |

## Version hors-ligne

```bash
npm run standalone
```

Génère **`generated-artifacts/terrain-emotes-offline.html`** : un seul fichier
d'environ 650 Ko, sans dépendance réseau ni serveur. Il suffit de l'ouvrir dans
un navigateur (`file://` fonctionne).

## Fonctionnalités

- **3 739 emotes** réparties en 19 catégories : danses, salutations, gestes,
  émotions, props, animaux, duos synchronisés, démarches, scénarios…
- **Recherche** par nom, commande, dictionnaire ou animation.
- **Filtres** par catégorie, type, ressource (rpemotes / Scully) et favoris.
- **Commandes contextuelles** : `/e`, `/emote`, `/eplay`, `/walk` ou `/w`,
  `/mood` ou `/f` selon la ressource.
- **Planche de croquis** interactive pour chaque emote (entrée, geste, retour),
  avec la mention explicite qu'il s'agit d'une illustration éditoriale.
- **Fiche détaillée** : dictionnaire, clip, prop, scénario, partenaire, référence
  Lua et liens vers la source.
- **Favoris** et **thème clair/sombre** conservés dans le navigateur.
- **Liens profonds** : `?emote=dance` ouvre directement la fiche.
- **Responsive** mobile et desktop.

## Structure

```text
.
├── generated-artifacts/       # build HTML autonome
├── data/
│   ├── README.md              # sources et méthode de génération
│   └── raw/                   # sources Lua téléchargées (non versionné)
├── scripts/
│   ├── build-catalogue.py     # téléchargement + parsing + déduplication
│   └── build-standalone.mjs   # inlining CSS/JS dans un seul HTML
├── src/
│   ├── components/            # cartes, fiche, croquis SVG, icônes
│   ├── data/catalogue.json    # 3 739 emotes générées
│   ├── lib/                   # commandes, inférence de pose
│   ├── App.tsx
│   └── styles.css
└── index.html
```

## Crédits et limites

Les animations, dictionnaires et props appartiennent à Rockstar Games et aux
auteurs de rpemotes-reborn / scully_emotemenu. Ce projet est un catalogue
d'aide au roleplay, sans affiliation.

Les croquis sont des **illustrations éditoriales** générées à partir du nom et du
type de l'emote : ils suggèrent l'intention du geste, mais ne représentent pas la
capture exacte du jeu. Les alias et la disponibilité des emotes dépendent de la
version et de la configuration de chaque serveur.
