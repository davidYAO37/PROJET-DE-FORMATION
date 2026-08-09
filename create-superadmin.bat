@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ============================================================
:: Création / restauration du super administrateur EasyMedical
:: ============================================================

:: Détecte le dossier où se trouve ce script
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%" || (
    echo [ERREUR] Impossible d'accéder au dossier du script : %SCRIPT_DIR%
    pause
    exit /b 1
)

:: Vérifie que Node.js est disponible
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Node.js n'est pas installé ou n'est pas dans le PATH.
    echo Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

:: Vérifie que check-users.js est présent
if not exist "check-users.js" (
    echo [ERREUR] Le fichier check-users.js est introuvable dans : %SCRIPT_DIR%
    echo Assurez-vous que ce fichier a été copié dans le dossier d'installation.
    pause
    exit /b 1
)

:: Configuration
set "MONGO_URI=mongodb://localhost:27017/bd_esaymed"
set "SUPER_ADMIN_EMAIL=ykdavid11@gmail.com"
set "SUPER_ADMIN_PASSWORD=Yao2026!"
set "ENTREPRISE_NAME=Entreprise par défaut"

:: Affichage
echo ============================================================
echo  EasyMedical - Création du super administrateur
echo ============================================================
echo.
echo MongoDB    : %MONGO_URI%
echo Email      : %SUPER_ADMIN_EMAIL%
echo Entreprise : %ENTREPRISE_NAME%
echo.
echo Exécution de node check-users.js...
echo.

:: Exécution
node check-users.js

if errorlevel 1 (
    echo.
    echo [ERREUR] La création du super administrateur a échoué.
    pause
    exit /b 1
)

echo.
echo [OK] Opération terminée.
pause
