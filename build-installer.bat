@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ============================================================
:: Script de build + packaging Inno Setup pour EasyMedical
:: ============================================================
:: Usage : double-clique sur build-installer.bat
::
:: Prérequis :
::   - Node.js installé (v18+ recommandé)
::   - Inno Setup 6.x installé
::   - MongoDB démarrée si tu veux tester après build
:: ============================================================

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%" || (
    echo [ERREUR] Impossible d'accéder au dossier du projet.
    pause
    exit /b 1
)

:: --- 1. Vérifier Node.js ---
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Node.js n'est pas installé ou n'est pas dans le PATH.
    echo Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js détecté.

:: --- 2. Installer les dépendances si nécessaire ---
if not exist "node_modules" (
    echo.
    echo [INFO] Installation des dépendances npm...
    call npm install
    if errorlevel 1 (
        echo [ERREUR] npm install a échoué.
        pause
        exit /b 1
    )
)

:: --- 3. Build Next.js standalone ---
echo.
echo [INFO] Build de l'application Next.js en mode standalone...
call npm run build
if errorlevel 1 (
    echo.
    echo [ERREUR] Le build Next.js a échoué.
    pause
    exit /b 1
)

:: --- 4. Vérifier le build standalone ---
if not exist ".next\standalone\server.js" (
    echo.
    echo [ERREUR] Le fichier .next\standalone\server.js est introuvable.
    echo Le build standalone est incomplet.
    pause
    exit /b 1
)
echo [OK] Build standalone généré.

:: --- 5. Vérifier Inno Setup ---
set "ISCC_PATH=C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
if not exist "%ISCC_PATH%" (
    set "ISCC_PATH=C:\Program Files\Inno Setup 6\ISCC.exe"
)

if not exist "%ISCC_PATH%" (
    echo.
    echo [ERREUR] Inno Setup Compiler ^(ISCC.exe^) introuvable.
    echo Veuillez installer Inno Setup 6.x depuis https://jrsoftware.org/isinfo.php
    pause
    exit /b 1
)
echo [OK] Inno Setup trouvé : %ISCC_PATH%

:: --- 6. Compiler le script ISS ---
if not exist "dist" mkdir "dist"

echo.
echo [INFO] Compilation de l'installateur...
"%ISCC_PATH%" "easy_medical_setup.iss"
if errorlevel 1 (
    echo.
    echo [ERREUR] La compilation Inno Setup a échoué.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  [SUCCESS] Installateur généré dans le dossier dist\
echo ============================================================
echo.
pause
