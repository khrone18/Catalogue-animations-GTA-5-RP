# Terrain — catalogue d'emotes GTA V & FiveM

![Build](https://img.shields.io/badge/build-%E2%9C%93%20passing-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Offline](https://img.shields.io/badge/100%25-hors--ligne-orange)
![License](https://img.shields.io/badge/license-MIT-green)

**[3 739 emotes réelles](#catalogue)** extraites de deux ressources FiveM open source,
avec **aperçu 3D interactif**, recherche instantanée et commandes prêtes à copier.

> Aucune animation n'est inventée : les commandes, dictionnaires, props et
> scénarios viennent directement des tables Lua des ressources.

---

## ✨ Fonctionnalités

| | |
| --- | --- |
| 🕺 **3 739 emotes** | 19 catégories : danses, salutations, gestes, props, animaux, duos… |
| 🧊 **Aperçu 3D interactif** | Figure squelettique animée par code (Three.js), rotation à la souris, zoom |
| 💃 **Chorégraphies distinctes** | 8 danses animées différemment (shuffle, krump staccato, robot, bachata…) |
| 🔍 **Recherche instantanée** | Nom, commande, dictionnaire, prop — ignore les accents et underscores |
| 🎛️ **Filtres** | Catégorie, type, ressource (rpemotes / Scully), favoris |
| 📋 **Commandes contextuelles** | `/e`, `/emote`, `/eplay`, `/walk`, `/mood` — selon la ressource choisie |
| 🖼️ **Croquis animés** | Planche d'artiste SVG avec halo, ring et traces de mouvement |
| ⭐ **Favoris + thème** | Conservés dans le navigateur, thèmes clair/sombre |
| 🔗 **Liens profonds** | `?emote=dance` ouvre directement la fiche |
| 📱 **Responsive** | Mobile et desktop |
| 📦 **100 % hors-ligne** | Aucun réseau, aucun compte, aucune API |

## 🚀 Démarrage rapide

```bash
npm install
npm run dev        # http://localhost:5173
```

> 🪟 **Windows ?** Double-clique simplement sur **`LANCEUR-WINDOWS.bat`**.
> 🍎🐧 **Mac / Linux ?** `./lanceur-mac-linux.sh`.

📖 **Tutoriels pas-à-pas complets pour chaque méthode** (fichier autonome,
développeur, installation sur téléphone) : voir
[**TUTORIEL-INSTALLATION.md**](TUTORIEL-INSTALLATION.md).

## 📦 Version hors-ligne

```bash
npm run standalone
```

Génère **`generated-artifacts/terrain-emotes-offline.html`** : un seul fichier
autonome (~1,6 Mo) à ouvrir directement dans un navigateur, `file://` inclus.

## 🛠️ Scripts

| Commande | Effet |
| --- | --- |
| `npm run dev` | serveur de développement (hot reload) |
| `npm run build` | vérification TypeScript + build de production |
| `npm run standalone` | build + fichier HTML unique autonome |
| `npm run data` | régénère `src/data/catalogue.json` depuis les sources |

## 📚 Sources

Données générées à partir des tables Lua de :

- **[rpemotes-reborn](https://github.com/alberttheprince/rpemotes-reborn)** — 1 864 entrées · `AnimationList.lua`
- **[scully_emotemenu](https://github.com/Scullyy/scully_emotemenu)** — 2 935 entrées · `shared/data/emotes/*`

Chaque fiche affiche le dictionnaire, l'animation, le prop et la ressource d'origine.

## 🗂️ Structure

```text
.
├── generated-artifacts/       # build HTML autonome
├── data/raw/                  # sources Lua téléchargées (non versionné)
├── scripts/
│   ├── build-catalogue.py     # téléchargement + parsing Lua + déduplication
│   └── build-standalone.mjs   # inlining CSS/JS dans un seul HTML
├── src/
│   ├── components/            # cartes, fiche, croquis SVG, figure 3D
│   ├── data/catalogue.json    # 3 739 emotes générées
│   ├── lib/                   # commandes, inférence de pose
│   ├── App.tsx
│   └── styles.css
└── index.html
```

## ⚖️ Crédits et limites

Les animations, dictionnaires et props appartiennent à **Rockstar Games** et aux
auteurs de rpemotes-reborn / scully_emotemenu. Ce projet est un catalogue
d'aide au roleplay, sans affiliation.

Les figures 3D et les croquis sont des **illustrations éditoriales** : ils
montrent l'intention du geste, pas la capture exacte du jeu. Les alias et la
disponibilité des emotes dépendent de la version et de la configuration de
chaque serveur.
