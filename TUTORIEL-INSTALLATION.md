# 📖 TUTORIEL — Installer Terrain en local

> Choisis la méthode selon ce que tu veux faire. Toutes fonctionnent sur **Windows**, **Mac** et **Linux**.

---

## Méthode 1 — Fichier autonome ⭐ *la plus simple (aucune installation)*

**Pour qui ?** Tout le monde. Tu veux juste ouvrir le catalogue, c'est tout.

### Étapes (Windows)

1. Va sur la page GitHub du projet : <https://github.com/khrone18/Catalogue-animations-GTA-5-RP>
2. Ouvre le dossier `generated-artifacts`
3. Télécharge le fichier **`terrain-emotes-offline.html`** (clic sur le fichier → bouton *Download raw file* / flèche de téléchargement)
4. **Double-clique sur le fichier** téléchargé → il s'ouvre dans ton navigateur (Edge, Chrome, Firefox…)

✅ C'est fini. Le catalogue, la recherche, les croquis 3D et les favoris marchent **100 % hors-ligne**.
⚠️ Les seules images qui demandent Internet : les rendus GTA de Forge. Sans réseau, le site bascule automatiquement sur la 3D.

---

## Méthode 2 — Version développeur sur Windows 💻 *live-reload, pour modifier le site*

**Pour qui ?** Tu veux modifier le code, ajouter des emotes, revoir les croquis.

### Étape 1 : installer Node.js (une seule fois, ~2 min)

1. Ouvre <https://nodejs.org> et télécharge la version **LTS** (bouton de gauche)
2. Lance l'installeur téléchargé, clique sur **Suivant** partout (laisse tout par défaut)
3. À la fin, Redémarre l'ordinateur (ou ferme et rouvre les fenêtres de terminal)

> ✔️ Vérification : ouvre PowerShell (clic droit sur le menu Démarrer → *Terminal*) et tape `node -v`. Si une version s'affiche (ex. `v22.x`), c'est bon.

### Étape 2 : télécharger le projet

- **Si tu as GitHub Desktop** : *File* → *Clone repository* → colle l'adresse `https://github.com/khrone18/Catalogue-animations-GTA-5-RP.git`
- **Sinon, en ligne de commande** : dans PowerShell :

```powershell
cd $HOME\Documents
git clone https://github.com/khrone18/Catalogue-animations-GTA-5-RP.git
cd Catalogue-animations-GTA-5-RP
```

> Pas de `git` ? Télécharge le zip : <https://github.com/khrone18/Catalogue-animations-GTA-5-RP/archive/refs/heads/main.zip>, décompresse l'archive puis ouvre `cmd` dans le dossier décompressé.

### Étape 3 : lancer (le plus simple)

**Double-clique sur `LANCEUR-WINDOWS.bat`** à la racine du dossier. Il :
- installe automatiquement ce qui manque (première fois : ~1 min),
- ouvre ton navigateur sur le site,
- recharge le site à chaque modification du code.

Un terminal noir reste ouvert tant que le site tourne : **ferme-le pour arrêter.**

### À la place du lanceur (en ligne de commande)

```powershell
npm install      # une seule fois
npm run dev      # à chaque fois → http://localhost:5173
```

---

## Méthode 3 — Version développeur sur Mac / Linux 🍎🐧

### Étape 1 : installer Node.js

```bash
# Mac (avec Homebrew) :
brew install node

# Debian/Ubuntu :
sudo apt install nodejs npm

# Fedora/RHEL :
sudo dnf install nodejs npm
```

ou télécharge l'installeur sur <https://nodejs.org>.

### Étape 2 : télécharger et lancer

```bash
git clone https://github.com/khrone18/Catalogue-animations-GTA-5-RP.git
cd Catalogue-animations-GTA-5-RP
./lanceur-mac-linux.sh      # ou : npm install && npm run dev
```

Le site s'ouvre sur <http://localhost:5173>.

---

## Méthode 4 — Installer comme application (PWA) 📱 *iPhone, Android, Windows*

Une fois le site ouvert dans ton navigateur, tu peux l'installer comme une vraie app avec son icône :

| Appareil | Comment faire |
|---|---|
| **Android** (Chrome) | Menu ⋮ → *Installer l'application* (ou *Ajouter à l'écran d'accueil*) |
| **iPhone / iPad** (Safari) | Bouton Partager ⬆️ → *Sur l'écran d'accueil* |
| **Windows** (Edge/Chrome) | Menu ⋯ → *Applications* → *Installer ce site en tant qu'application* |
| **Mac** (Chrome) | Menu ⋮ → *Transmettre, enregistrer…* → *Installer la page comme application* |

✅ Après installation : icône dans le menu démarrer / l'écran d'accueil, ouverture dans sa propre fenêtre, et le catalogue est disponible hors-ligne (les rendus GTA, eux, ont besoin du réseau).

---

## 🔧 Dépannage rapide

| Problème | Solution |
|---|---|
| `'node' n'est pas reconnu…` | Node.js n'est pas installé ou pas dans le PATH → réinstalle-le (Méthode 2, étape 1) puis **redémarre le terminal** |
| `npm ERR! EACCES` (Mac/Linux) | Ne pas utiliser sudo : `npm install` dans ton dossier perso, ou corrige les permissions de npm |
| Le port 5173 est occupé | Vite utilise automatiquement le suivant (5174…), ou lance `npm run dev -- --port 3000` |
| La page est blanche au lancement | Regarde le terminal : il affiche l'URL exacte à ouvrir (pas forcément 5173) |
| Les rendus GTA ne s'affichent pas | C'est normal sans Internet ; le site remplace par la figure 3D automatiquement |
| L'antivirus bloque le `.bat` | C'est un faux positif : autorise-le manuellement. Tu peux vérifier son contenu avec le Bloc-notes — il fait juste `npm install` + `npm run dev` |

---

## Résumé express

| Tu veux… | Fais ça |
|---|---|
| Juste regarder le catalogue | **Méthode 1** — télécharge le HTML et double-clique |
| Modifier le site / coder | **Méthode 2 ou 3** — Node.js + lanceur |
| Le garder sur ton tel/PC | **Méthode 4** — installer la PWA |
