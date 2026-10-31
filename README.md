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

## 📖 Installer en local — tutoriels pas-à-pas

**Une méthode pour chaque usage** — toutes compatibles Windows, Mac, Linux.

| Méthode | Pour qui ? | Difficulté |
|---|---|---|
| **1. Fichier autonome** | Juste ouvrir le catalogue | ⭐ aucune |
| **2-3. Version développeur** | Modifier le code / reconstruire | ⭐⭐ Node.js requis |
| **4. Application (PWA)** | Le garder sur téléphone ou PC | ⭐ aucune |

---

### Méthode 1 — Fichier autonome ⭐ *(aucune installation)*

1. Ouvre [`generated-artifacts`](generated-artifacts/) sur cette page
2. Télécharge le fichier **`terrain-emotes-offline.html`** (bouton *Download raw file* ou flèche ⬇)
3. **Double-clique** sur le fichier téléchargé → il s'ouvre dans ton navigateur (Edge, Chrome, Firefox…)

✅ Catalogue, recherche, croquis 3D et favoris marchent **100 % hors-ligne**.
⚠️ Seules les images des rendus GTA demandent Internet — sans réseau, l'aperçu bascule automatiquement sur la 3D.

---

### Méthode 2 — Windows 💻 *(version développeur)*

**Étape 1 — Installer Node.js (une fois, ~2 min)**

1. Ouvre <https://nodejs.org> et télécharge la version **LTS** (bouton de gauche)
2. Lance l'installeur, clique sur **Suivant** partout (tout par défaut)
3. Ferme et rouvre ton terminal

> 🚦 Vérifier : dans PowerShell (clic droit sur le menu Démarrer → *Terminal*), tape `node -v` — une version s'affiche ? C'est bon.

**Étape 2 — Télécharger le projet**

```powershell
cd $HOME\Documents
git clone https://github.com/khrone18/Catalogue-animations-GTA-5-RP.git
cd Catalogue-animations-GTA-5-RP
```

> Pas de git ? [Télécharge le zip](https://github.com/khrone18/Catalogue-animations-GTA-5-RP/archive/refs/heads/main.zip) et décompresse-le.

**Étape 3 — Lancer**

🪟 **Le plus simple : double-clique sur `LANCEUR-WINDOWS.bat`.**
Il installe tout seul ce qui manque (première fois ~1 min) puis ouvre ton navigateur sur le site. Ferme le terminal pour arrêter.

Ou en ligne de commande :

```powershell
npm install      # une seule fois
npm run dev      # http://localhost:5173
```

---

### Méthode 3 — Mac / Linux 🍎🐧 *(version développeur)*

```bash
# Node.js :
brew install node                  # Mac
sudo apt install nodejs npm        # Debian / Ubuntu
sudo dnf install nodejs npm        # Fedora

# Puis :
git clone https://github.com/khrone18/Catalogue-animations-GTA-5-RP.git
cd Catalogue-animations-GTA-5-RP
./lanceur-mac-linux.sh             # ou : npm install && npm run dev
```

Le site se charge sur <http://localhost:5173>.

---

### Méthode 4 — Installer comme application 📱 *(PWA)*

Une fois le site ouvert dans le navigateur :

| Appareil | Comment faire |
|---|---|
| **Android** (Chrome) | Menu ⋮ → *Installer l'application* |
| **iPhone / iPad** (Safari) | Bouton Partager ⬆️ → *Sur l'écran d'accueil* |
| **Windows** (Edge / Chrome) | Menu ⋯ → *Applications* → *Installer ce site en tant qu'application* |

✅ Icône dans le menu démarrer / l'écran d'accueil, sa propre fenêtre, et catalogue consultable **hors-ligne**.

---

### 🔧 Dépannage rapide

| Problème | Solution |
|---|---|
| `'node' n'est pas reconnu…` | Node.js n'est pas installé → reprends l'Étape 1 de la Méthode 2, puis **redémarre le terminal** |
| `npm ERR! EACCES` (Mac/Linux) | Pas de `sudo` : lance `npm install` dans ton dossier perso |
| Le port 5173 est occupé | Vite passe automatiquement au suivant (5174…), ou : `npm run dev -- --port 3000` |
| Page blanche au lancement | Lis le terminal : il affiche l'URL exacte à ouvrir |
| Rendus GTA absents | Normal sans Internet — la figure 3D les remplace automatiquement |
| Antivirus bloque le `.bat` | Faux positif : autorise-le. Tu peux lire son contenu avec le Bloc-notes (faits = `npm install` + `npm run dev`) |

---

> 📄 Ce tutoriel existe aussi en fichier séparé : [TUTORIEL-INSTALLATION.md](TUTORIEL-INSTALLATION.md).

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
