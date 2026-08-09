; ============================================================
; Inno Setup Script - EasyMedical (Installation locale complète)
; ============================================================
; Ce script génère un installateur Windows pour l'application
; EasyMedical (build Next.js standalone).
;
; PRÉREQUIS AVANT COMPILATION :
;   1. Inno Setup Compiler 6.x installé
;   2. Avoir exécuté : npm install
;   3. Avoir exécuté : npm run build
;   4. Le dossier .next\standalone doit exister et contenir server.js
;   5. Le dossier .next\static doit exister (assets statiques)
;   6. Le dossier public doit exister (assets publics)
;
; FICHIERS INCLUS PAR L'INSTALLATEUR :
;   - Tout le build standalone (.next\standalone\*)
;   - Le dossier .next\static (assets de build)
;   - Le dossier public (assets publics)
;   - Le fichier .env (configuration locale)
;   - start-app.bat (lanceur de l'application)
;   - check-users.js et create-superadmin.bat (création super admin)
;
; DÉPENDANCES CÔTÉ CLIENT :
;   - Node.js (LTS recommandé) installé sur le poste cible
;   - MongoDB locale ou distante accessible
;
; COMMANDE DE COMPILATION :
;   "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" easy_medical_setup.iss
; ============================================================

#define MyAppName "EasyMedical"
#define MyAppVersion "0.1.0"
#define MyAppPublisher "EasyMedical"
#define MyAppURL "https://example.com"
; Chemin racine du projet sur l'ordinateur de BUILD (à adapter si besoin)
#define MyProjectDir "c:\Users\DAVID-YAO-PC\Desktop\GOMYCODE\PROJET DE FORMATION\easy_medical"
; Chemins des sources à packager
#define MyStandaloneDir MyProjectDir + "\.next\standalone"
#define MyStaticDir MyProjectDir + "\.next\static"
#define MyPublicDir MyProjectDir + "\public"

[Setup]
AppId={{EASY-MEDICAL-2026-STANDALONE-LOCAL-SETUP}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir={#MyProjectDir}\dist
OutputBaseFilename=EasyMedical_Setup_v{#MyAppVersion}
SetupIconFile=
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
DisableProgramGroupPage=no
UninstallDisplayIcon={app}\start-app.bat
CloseApplications=force
RestartApplications=no

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Tasks]
Name: "desktopicon"; Description: "Créer un raccourci sur le bureau"; GroupDescription: "Raccourcis:"
Name: "startuperuser"; Description: "Créer le super administrateur après l'installation (nécessite MongoDB)"; GroupDescription: "Configuration initiale:"

[Files]
; --- 1. Application Next.js standalone (tout le contenu du build) ---
; server.js, node_modules optimisés, .next interne, etc.
Source: "{#MyStandaloneDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs

; --- 2. Assets statiques générés par Next.js ---
; Next.js standalone a besoin du dossier .next/static à côté de server.js
Source: "{#MyStaticDir}\*"; DestDir: "{app}\.next\static"; Flags: ignoreversion recursesubdirs

; --- 3. Dossier public (images, uploads, etc.) ---
Source: "{#MyPublicDir}\*"; DestDir: "{app}\public"; Flags: ignoreversion recursesubdirs

; --- 4. Fichiers de configuration et utilitaires ---
; Le .env contient les variables sensibles (MONGO_URI, JWT_SECRET, etc.)
Source: "{#MyProjectDir}\.env"; DestDir: "{app}"; Flags: ignoreversion

; Lanceur de l'application
Source: "{#MyProjectDir}\start-app.bat"; DestDir: "{app}"; Flags: ignoreversion

; Utilitaires de création du super administrateur
Source: "{#MyProjectDir}\check-users.js"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#MyProjectDir}\create-superadmin.bat"; DestDir: "{app}"; Flags: ignoreversion

[Dirs]
; Droits utilisateurs pour pouvoir écrire logs/uploads si nécessaire
Name: "{app}"; Permissions: users-modify
Name: "{app}\public"; Permissions: users-modify
Name: "{app}\public\uploads"; Permissions: users-modify

[Icons]
; Lancer l'application
Name: "{group}\Démarrer EasyMedical"; Filename: "{app}\start-app.bat"; WorkingDir: "{app}"
Name: "{autodesktop}\Démarrer EasyMedical"; Filename: "{app}\start-app.bat"; WorkingDir: "{app}"; Tasks: desktopicon

; Créer le super admin
Name: "{group}\Créer le Super Admin"; Filename: "{app}\create-superadmin.bat"; WorkingDir: "{app}"
Name: "{autodesktop}\Créer le Super Admin"; Filename: "{app}\create-superadmin.bat"; WorkingDir: "{app}"; Tasks: desktopicon

; Ouvrir le dossier d'installation
Name: "{group}\Ouvrir le dossier EasyMedical"; Filename: "{app}"

; Désinstaller
Name: "{group}\Désinstaller EasyMedical"; Filename: "{uninstallexe}"

[Run]
; Crée automatiquement le super admin après l'installation si coché
Filename: "{app}\create-superadmin.bat"; Description: "Créer le super administrateur"; Flags: postinstall runhidden; Tasks: startuperuser

; Ouvrir le dossier d'installation à la fin
Filename: "explorer.exe"; Parameters: "{app}"; Description: "Ouvrir le dossier d'installation"; Flags: postinstall skipifsilent nowait

[UninstallDelete]
; Nettoyage complet lors de la désinstallation
Type: filesandordirs; Name: "{app}"

[Code]
// ============================================================
// Vérifications avant et pendant l'installation
// ============================================================
function InitializeSetup(): Boolean;
begin
  // Vérifier que le build standalone existe
  if not DirExists('{#MyStandaloneDir}') then
  begin
    MsgBox('Le build standalone est introuvable.' + #13#10 +
           'Chemin attendu : {#MyStandaloneDir}' + #13#10#13#10 +
           'Assure-toi d''avoir exécuté :' + #13#10 +
           '  npm install' + #13#10 +
           '  npm run build' + #13#10 +
           'et que le dossier .next\standalone existe.',
           mbError, MB_OK);
    Result := false;
    Exit;
  end;

  // Vérifier que server.js existe
  if not FileExists('{#MyStandaloneDir}\server.js') then
  begin
    MsgBox('Le fichier server.js est introuvable dans le build standalone.' + #13#10 +
           'Le build semble incomplet. Reconstruis le projet avec : npm run build',
           mbError, MB_OK);
    Result := false;
    Exit;
  end;

  // Vérifier que Node.js est installé sur le poste de BUILD pour compiler
  // (optionnel mais recommandé)
  Result := true;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    // Message informatif après installation
    // L'utilisateur doit s'assurer que MongoDB est démarré avant de lancer l'app
  end;
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := true;
end;
