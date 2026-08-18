<#
============================================================
 update-production.ps1
 Met à jour C:\EasyInstaller\EasyMedical_Production à partir
 du build Next.js standalone du dossier de développement.
============================================================

 Usage :
   powershell -ExecutionPolicy Bypass -File .\update-production.ps1
   powershell -ExecutionPolicy Bypass -File .\update-production.ps1 -SkipBuild
   powershell -ExecutionPolicy Bypass -File .\update-production.ps1 -ProdDir "D:\Autre\Chemin"

 Ce script :
   1. Build le projet (npm run build), sauf si -SkipBuild
   2. Vérifie que le build standalone est complet (pas de
      dossier .next\node_modules\<pkg>-<hash> vide)
   3. Vide l'ancien contenu applicatif de EasyMedical_Production
      (sans toucher à .env)
   4. Copie le nouveau build (standalone + static + public)
   5. Revérifie EasyMedical_Production après copie et corrige
      automatiquement les dossiers externalisés vides en les
      recopiant depuis node_modules
   6. Affiche un résumé clair, s'arrête au premier problème
      bloquant
============================================================
#>

param(
    [string]$DevDir = $PSScriptRoot,
    [string]$ProdDir = "C:\EasyInstaller\EasyMedical_Production",
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

function Write-Step($msg) {
    Write-Host ""
    Write-Host "==> $msg" -ForegroundColor Cyan
}

function Write-Ok($msg) {
    Write-Host "[OK] $msg" -ForegroundColor Green
}

function Write-Warn($msg) {
    Write-Host "[ATTENTION] $msg" -ForegroundColor Yellow
}

function Write-Err($msg) {
    Write-Host "[ERREUR] $msg" -ForegroundColor Red
}

function Test-EmptyExternalModules {
    <#
        Vérifie les dossiers .next\node_modules\<pkg>-<hash> et
        renvoie la liste de ceux qui sont vides (0 fichier).
    #>
    param([string]$NextDir)

    $result = @()
    $externalDir = Join-Path $NextDir "node_modules"

    if (-not (Test-Path $externalDir)) {
        return $result
    }

    Get-ChildItem $externalDir -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        $count = (Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
        if ($count -eq 0) {
            $result += $_.FullName
        }
    }

    return $result
}

function Repair-EmptyExternalModule {
    <#
        Tente de réparer un dossier .next\node_modules\<pkg>-<hash>
        vide en recopiant le vrai paquet depuis node_modules\<pkg>.
    #>
    param(
        [string]$EmptyFolder,
        [string]$AppRoot
    )

    $folderName = Split-Path $EmptyFolder -Leaf

    # Le nom réel du paquet est tout ce qui précède le dernier "-<hash hexa>"
    if ($folderName -notmatch '^(.+)-[0-9a-f]{8,}$') {
        Write-Warn "Impossible de déduire le nom du paquet pour '$folderName'. Réparation manuelle requise."
        return $false
    }

    $pkgName = $Matches[1]
    $sourcePkg = Join-Path $AppRoot "node_modules\$pkgName"

    if (-not (Test-Path $sourcePkg)) {
        Write-Warn "Paquet source introuvable : $sourcePkg. Réparation manuelle requise pour '$folderName'."
        return $false
    }

    robocopy $sourcePkg $EmptyFolder /E /NFL /NDL /NJH /NJS | Out-Null

    $count = (Get-ChildItem $EmptyFolder -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
    if ($count -gt 0) {
        Write-Ok "Réparé automatiquement : $folderName ($count fichiers copiés depuis node_modules\$pkgName)"
        return $true
    }

    Write-Err "Échec de la réparation automatique de '$folderName'."
    return $false
}

# ------------------------------------------------------------
# 0. Vérifications préalables
# ------------------------------------------------------------

Write-Step "Vérification des dossiers"

if (-not (Test-Path $DevDir)) {
    Write-Err "Dossier de développement introuvable : $DevDir"
    exit 1
}

if (-not (Test-Path $ProdDir)) {
    Write-Err "Dossier de production introuvable : $ProdDir"
    exit 1
}

Write-Ok "Dev  : $DevDir"
Write-Ok "Prod : $ProdDir"

# ------------------------------------------------------------
# 1. Build
# ------------------------------------------------------------

if (-not $SkipBuild) {
    Write-Step "Build Next.js (npm run build)"
    Push-Location $DevDir
    try {
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Err "Le build a échoué (code $LASTEXITCODE)."
            exit 1
        }
    } finally {
        Pop-Location
    }
    Write-Ok "Build terminé."
} else {
    Write-Warn "Build ignoré (-SkipBuild). Utilisation du build existant."
}

$standaloneDir = Join-Path $DevDir ".next\standalone"
$standaloneServer = Join-Path $standaloneDir "server.js"

if (-not (Test-Path $standaloneServer)) {
    Write-Err "server.js introuvable dans $standaloneDir. Le build standalone est incomplet."
    exit 1
}
Write-Ok "Build standalone présent : $standaloneServer"

# ------------------------------------------------------------
# 2. Vérification du build FRAIS avant toute copie
# ------------------------------------------------------------

Write-Step "Vérification des modules externalisés dans le build frais"

$standaloneNextDir = Join-Path $standaloneDir ".next"
$emptyInBuild = Test-EmptyExternalModules -NextDir $standaloneNextDir

if ($emptyInBuild.Count -eq 0) {
    Write-Ok "Aucun dossier externalisé vide dans le build."
} else {
    Write-Warn "$($emptyInBuild.Count) dossier(s) externalisé(s) vide(s) détecté(s) dans le build. Tentative de réparation..."
    foreach ($folder in $emptyInBuild) {
        Repair-EmptyExternalModule -EmptyFolder $folder -AppRoot $standaloneDir | Out-Null
    }
}

# ------------------------------------------------------------
# 2b. Sécurité : node.exe (runtime portable) ne doit JAMAIS
#     être supprimé ni recopié depuis le build. On le mémorise
#     et on vérifiera sa présence après coup.
# ------------------------------------------------------------

$nodeExePath = Join-Path $ProdDir "node.exe"
$nodeExeExistedBefore = Test-Path $nodeExePath

if ($nodeExeExistedBefore) {
    Write-Ok "node.exe (runtime portable) présent, il sera préservé : $nodeExePath"
} else {
    Write-Warn "node.exe est introuvable dans $ProdDir avant la mise à jour. Il faudra le fournir manuellement (runtime Node.js portable pour le client)."
}

# ------------------------------------------------------------
# 3. Nettoyage de EasyMedical_Production (on garde .env et node.exe)
# ------------------------------------------------------------

Write-Step "Nettoyage de l'ancien contenu applicatif dans $ProdDir"

$pathsToClean = @(
    (Join-Path $ProdDir ".next"),
    (Join-Path $ProdDir "node_modules"),
    (Join-Path $ProdDir "public"),
    (Join-Path $ProdDir "server.js"),
    (Join-Path $ProdDir "package.json")
)

foreach ($p in $pathsToClean) {
    if (Test-Path $p) {
        Remove-Item $p -Recurse -Force
        Write-Ok "Supprimé : $p"
    }
}

Write-Warn ".env de production conservé tel quel (non touché par ce script)."

# ------------------------------------------------------------
# 4. Copie du nouveau build
# ------------------------------------------------------------

Write-Step "Copie du build standalone vers $ProdDir"
robocopy $standaloneDir $ProdDir /E /NFL /NDL /NJH /NJS
if ($LASTEXITCODE -ge 8) {
    Write-Err "robocopy a échoué en copiant le standalone (code $LASTEXITCODE)."
    exit 1
}
Write-Ok "Standalone copié."

Write-Step "Copie des assets statiques (.next\static)"
robocopy (Join-Path $DevDir ".next\static") (Join-Path $ProdDir ".next\static") /E /NFL /NDL /NJH /NJS
if ($LASTEXITCODE -ge 8) {
    Write-Err "robocopy a échoué en copiant .next\static (code $LASTEXITCODE)."
    exit 1
}
Write-Ok "Assets statiques copiés."

Write-Step "Copie du dossier public"
robocopy (Join-Path $DevDir "public") (Join-Path $ProdDir "public") /E /NFL /NDL /NJH /NJS
if ($LASTEXITCODE -ge 8) {
    Write-Err "robocopy a échoué en copiant public (code $LASTEXITCODE)."
    exit 1
}
Write-Ok "Dossier public copié."

$checkUsersSource = Join-Path $DevDir "scripts\check-users.js"
$checkUsersDest = Join-Path $ProdDir "scripts\check-users.js"
if (Test-Path $checkUsersSource) {
    New-Item -ItemType Directory -Path (Split-Path $checkUsersDest) -Force | Out-Null
    Copy-Item $checkUsersSource $checkUsersDest -Force
    Write-Ok "check-users.js mis à jour."
}

# ------------------------------------------------------------
# 5. Vérification finale + réparation automatique dans PROD
# ------------------------------------------------------------

Write-Step "Vérification finale des modules externalisés dans $ProdDir"

$prodNextDir = Join-Path $ProdDir ".next"
$emptyInProd = Test-EmptyExternalModules -NextDir $prodNextDir

$allFixed = $true
if ($emptyInProd.Count -eq 0) {
    Write-Ok "Aucun dossier externalisé vide. La production est saine."
} else {
    Write-Warn "$($emptyInProd.Count) dossier(s) externalisé(s) vide(s) détecté(s) après copie. Réparation..."
    foreach ($folder in $emptyInProd) {
        $fixed = Repair-EmptyExternalModule -EmptyFolder $folder -AppRoot $ProdDir
        if (-not $fixed) {
            $allFixed = $false
        }
    }
}

# ------------------------------------------------------------
# 5b. Vérification que node.exe est toujours là
# ------------------------------------------------------------

Write-Step "Vérification de node.exe"

if ($nodeExeExistedBefore -and -not (Test-Path $nodeExePath)) {
    Write-Err "node.exe a disparu de $ProdDir pendant la mise à jour ! Restaure-le avant de packager."
    $allFixed = $false
} elseif (Test-Path $nodeExePath) {
    Write-Ok "node.exe toujours présent : $nodeExePath"
}

# ------------------------------------------------------------
# 6. Résumé
# ------------------------------------------------------------

Write-Step "Résumé"

if (-not $allFixed) {
    Write-Err "Certains dossiers externalisés n'ont pas pu être réparés automatiquement."
    Write-Err "NE PAS packager l'installeur avant d'avoir corrigé cela manuellement."
    exit 1
}

Write-Ok "EasyMedical_Production est à jour et vérifié."
Write-Host ""
Write-Host "Prochaines étapes :" -ForegroundColor Cyan
Write-Host "  1. Vérifie C:\EasyInstaller\EasyMedical_Production\.env si des variables ont changé."
Write-Host "  2. Recompile l'installeur :"
Write-Host "     cd C:\EasyInstaller\Setup"
Write-Host "     & 'C:\Program Files (x86)\Inno Setup 6\ISCC.exe' EasyMedical.iss"
Write-Host "  3. Teste le nouvel installeur avant de le diffuser."
Write-Host ""
