@echo off
chcp 65001 >nul
title Terrain - Catalogue d'emotes GTA V et FiveM
cd /d "%~dp0"

echo.
echo   ============================================================
echo     TERRAIN - Catalogue d'emotes GTA V et FiveM
echo   ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo   [ERREUR] Node.js n'est pas installe.
    echo.
    echo   1. Ouvre  https://nodejs.org
    echo   2. Telecharge la version LTS  ^(bouton de gauche^)
    echo   3. Installe-la en laissant tout par defaut
    echo   4. Redouble-clique sur ce fichier
    echo.
    pause
    exit /b 1
)

echo   Node.js detecte : 
node -v

if not exist "node_modules\" (
    echo.
    echo   Premiere installation ^(2 a 4 minutes selon ta connexion^)...
    call npm install
    if errorlevel 1 (
        echo.
        echo   [ERREUR] npm install a echoue. Verifie ta connexion Internet.
        pause
        exit /b 1
    )
    echo.
    echo   Installation terminee !
)

echo.
echo   Lancement du site... le navigateur va s'ouvrir.
echo   Laisse cette fenetre ouverte - ferme-la pour arreter.
echo.

start "" "cmd /c timeout /t 3 /nobreak >nul && start http://localhost:5173"
call npm run dev

pause
