#!/usr/bin/env bash
# Terrain — lance le catalogue en local (Mac / Linux)
# Usage : ./lanceur-mac-linux.sh   (ou : bash lanceur-mac-linux.sh)
set -e
cd "$(dirname "$0")"

echo ""
echo "  ============================================================"
echo "    TERRAIN — Catalogue d'emotes GTA V & FiveM"
echo "  ============================================================"
echo ""

if ! command -v node >/dev/null 2>&1; then
    echo "  [ERREUR] Node.js n'est pas installé."
    echo ""
    echo "    Mac   : brew install node   (ou https://nodejs.org)"
    echo "    Ubuntu: sudo apt install nodejs npm"
    echo ""
    exit 1
fi

echo "  Node.js détecté : $(node -v)"

if [ ! -d node_modules ]; then
    echo ""
    echo "  Première installation (2 à 4 minutes)..."
    npm install
fi

echo ""
echo "  Lancement du site… le navigateur va s'ouvrir."
echo "  Laisse ce terminal ouvert — Ctrl+C pour arrêter."
echo ""

(sleep 3 && xdg-open http://localhost:5173 2>/dev/null || open http://localhost:5173 || true) &
npm run dev
