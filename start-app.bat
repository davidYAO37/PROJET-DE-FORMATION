@echo off
chcp 65001 >nul
setlocal

:: ============================================================
:: Démarrage de l'application EasyMedical (Next.js standalone)
:: ============================================================

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%" || (
    echo [ERREUR] Impossible d'accéder au dossier de l'application.
    pause
    exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Node.js n'est pas installé ou n'est pas dans le PATH.
    echo Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

if not exist "server.js" (
    echo [ERREUR] server.js introuvable dans %SCRIPT_DIR%
    echo L'application n'a pas été correctement installée.
    pause
    exit /b 1
)

echo ============================================================
echo  Démarrage d'EasyMedical...
echo ============================================================
echo.
echo L'application sera accessible sur http://localhost:3000
echo.

node server.js

if errorlevel 1 (
    echo.
    echo [ERREUR] L'application s'est arrêtée avec une erreur.
    pause
    exit /b 1
)
