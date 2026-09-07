# Import WinDev → MongoDB (Easy Medical)

Ce script importe les données historiques WinDev dans la base MongoDB du projet Easy Medical.

Il gère les tables disponibles dans l’export WinDev :

- `ASSURANCE`
- `ACTE` / `ActeClinique`
- `TARIF_ASSURANCE`
- `PARTIENT`
- `CONSULTATION`
- `FACTURATION`
- `ENCAISSEMENT_CAISSE`
- `EXAMENS_HOSPITALISATION`
- `LIGNE_PRESTATION`

## Limitation importante

Les fichiers WinDev natifs (`.fic`, `.ndx`) sont au **format Hyper File binaire** et ne sont pas lisibles directement. Il faut d’abord **les exporter depuis WinDev** au format **Excel (.xlsx)** ou **CSV**.

Le format **Excel** est recommandé car il préserve :

- les dates ;
- les nombres (heures, montants) ;
- l’encodage des caractères accentués ;
- la structure des lignes multi-lignes.

## 1. Exporter depuis WinDev

Dans WinDev, exporter chaque table au format **Excel .xlsx** (ou CSV `;` encodé Windows-1252) dans un même dossier, par exemple :

```
C:/Users/.../Desktop/exportation windev/
```

Les noms de fichiers attendus (insensibles à la casse) :

- `ASSURANCE.xlsx` / `.csv`
- `Acte.xlsx` / `.csv`
- `TARIF_ASSURANCE.xlsx` / `.csv`
- `patient.xlsx` / `.csv`
- `consultation.xlsx` / `.csv`
- `FACTURATION.xlsx` / `.csv`
- `ENCAISSEMENT_CAISSE.xlsx` / `.csv`
- `EXAMENS_HOSPITALISATION.xlsx` / `.csv`
- `LIGNE_PRESTATION.xlsx` / `.csv`

## 2. Lancer l’import complet

### Prérequis

Définir l’URI MongoDB cible et, optionnellement, l’identifiant de l’entreprise :

```powershell
$env:MONGODB_URI="mongodb://localhost:27017/bd_esaymed"
$env:ENTREPRISE_ID="<objectId_de_l_entreprise>"  # optionnel
```

### Commande d’import

```powershell
node scripts/import_windev/import_all.js `
  --dir "C:/Users/.../Desktop/exportation windev"
```

### Aperçu sans insertion (dry run)

```powershell
node scripts/import_windev/import_all.js `
  --dir "C:/Users/.../Desktop/exportation windev" `
  --dryRun
```

## 3. Ordre d’import et liaison des IDs

Le script importe automatiquement dans l’ordre de dépendance :

1. `ASSURANCE` → référentiel assurance
2. `ACTE` → actes cliniques
3. `TARIF_ASSURANCE` → tarifs liés aux assurances et actes
4. `PARTIENT` → patients (clé `Code_dossier` et ID WinDev `IDPARTIENT`)
5. `CONSULTATION` → consultations (lien `IdPatient`)
4. `FACTURATION` → facturations (lien `IdPatient`)
5. `ENCAISSEMENT_CAISSE` → encaissements (lien `IdPatient` via patient, facturation ou consultation)
6. `EXAMENS_HOSPITALISATION` → examens hospitalisation (lien `IdPatient`)
7. `LIGNE_PRESTATION` → lignes de prestation (liens `IdPatient`, `idFacturation`, `idHospitalisation`)

Les identifiants numériques WinDev (`IDPARTIENT`, `IDFACTURATION`, `IDHOSPITALISATION`, etc.) sont convertis en `ObjectId` MongoDB à l’aide de tables de correspondance internes. Les champs faisant référence à des tables non exportées (actes, médecins, sociétés d’assurance, etc.) sont laissés vides pour éviter d’insérer de faux ObjectIds.

## 4. Options

| Option | Description |
|--------|-------------|
| `--dir <chemin>` | Dossier contenant les fichiers d’export |
| `--dryRun` | Affiche les compteurs sans insérer |
| `--uri <uri>` | URI MongoDB (par défaut : `$env:MONGODB_URI`) |

## 5. Résultats attendus

Sur les exports actuels, l’import complet a inséré dans une base de test propre :

- **28 assurances**
- **1266 actes cliniques** (dont des actes déjà présents avant cette extension)
- **28645 tarifs assurance**
- **2023 patients**
- **3782 consultations**
- **1252 facturations**
- **61 encaissements caisse**
- **1888 examens hospitalisation**
- **11892 lignes prestation**

1 consultation a été ignorée car son `IDPARTIENT` n’existe pas dans le fichier patient.

## 6. Vérifier l’import

Utiliser le script `verify.js` :

```powershell
$env:MONGODB_URI="mongodb://localhost:27017/bd_esaymed"
node scripts/import_windev/verify.js
```

Il affiche les compteurs de toutes les collections et un exemple de patient avec ses relations.

## 7. Tables non importées

Les tables suivantes n’étaient pas disponibles dans le dossier d’export ou n’ont pas été traitées :

- `PRESCRIPTION`
- `PATIENT_PRESCRIPTION`
- `MEDICAMENT`
- `MEDECIN`
- `COMPTE_PATIENT`
- `RENDEZ_VOUS`
- `HONORAIREPAYE`
- `FACTUREASSUR`

Ces tables pourront être ajoutées dans le même script dès que les exports correspondants seront fournis. `Prescription` et `PatientPrescription` ne peuvent pas être reconstruits correctement à partir des autres exports : il faut leurs fichiers WinDev, ainsi que `MEDICAMENT` pour renseigner la référence obligatoire du médicament. Les champs liés aux référentiels absents restent vides afin de ne jamais écrire un identifiant numérique WinDev dans un champ ObjectId.

## 8. Textes WinDev au format RTF

Les imports détectent automatiquement les chaînes commençant par `{\\rtf` et les convertissent en texte lisible. Les accents Windows-1252, caractères Unicode, paragraphes et tabulations sont conservés autant que possible, tandis que les tables de polices, couleurs, images et autres métadonnées RTF sont supprimées.

Les exports actuels contiennent du RTF dans :

- `consultation.xlsx` : `EXAMENDEMANDE` (1 138 lignes) ;
- `LIGNE_PRESTATION.xlsx` : `resultatacte` (314 lignes) ;
- `PARAM_LABO.xlsx` : `Param_designation` (156 lignes) ;
- `RESULTAT_LIGNE_PRESTATION.xlsx` : `Param_designation` (28 795 lignes).

Commandes de contrôle :

```powershell
node scripts/import_windev/scan_rtf.js "C:/chemin/exportation windev"
node scripts/import_windev/clean_rtf.js "mongodb://localhost:27017/bd_esaymed" --dryRun
```

Retirer `--dryRun` pour nettoyer les documents déjà importés.

## 9. Couverture finale des exports

Tous les exports métier disponibles sont pris en charge : patients, consultations, examens/hospitalisations, prestations, facturation, encaissements, assurances, actes, tarifs, prescriptions, pharmacie, résultats laboratoire, traitements automates, affections, documents patient, observations, stocks, honoraires, factures assurance, caisse et paramètres.

`patient.xlsx` et `PARTIENT.xlsx` contiennent chacun 2 025 lignes et représentent le même export patient. Une seule copie doit être importée.

`Login.xlsx` est volontairement exclu : il contient des mots de passe WinDev en clair, des identifiants qui ne sont pas des adresses e-mail et des profils numériques incompatibles avec les rôles de l’application. Ces mots de passe ne doivent jamais être copiés dans MongoDB. Les comptes doivent être recréés via l’administration avec un mot de passe temporaire haché et une obligation de réinitialisation.

## 10. Fichiers du script

- `import_all.js` : orchestration de l’import complet
- `mapping.js` : mapping patients / consultations
- `mappingTables.js` : mapping assurance / facturation / encaissement / examens / lignes
- `inspect_xlsx.js` : outil pour afficher les en-têtes d’un export Excel
- `count.js` : compte les documents par collection
- `verify.js` : vérifie un exemple de patient avec ses relations
