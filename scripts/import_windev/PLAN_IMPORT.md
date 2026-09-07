# Plan d’import complet WinDev → MongoDB

## Objectif

Permettre à un patient d’avoir dans MongoDB **toutes ses données historiques** : consultations, examens, facturations, encaissements, lignes de prestation, etc.

## Principe général

Les tables WinDev utilisent des **identifiants numériques** (ex: `IDPARTIENT`, `IDCONSULTATION`).  
Dans MongoDB ce sont des **ObjectId**. Il faut donc importer dans un ordre précis et conserver des correspondances (`windevId` → `ObjectId`) en mémoire au fur et à mesure.

## Ordre d’import réellement implémenté

Le script `import_all.js` gère actuellement l’ordre suivant :

1. `ASSURANCE`
2. `PARTIENT`
3. `CONSULTATION`
4. `FACTURATION`
5. `ENCAISSEMENT_CAISSE`
6. `EXAMENS_HOSPITALISATION`
7. `LIGNE_PRESTATION`

## Tables prioritaires pour un dossier patient complet

| Table WinDev | Modèle MongoDB | Dépend de | Statut |
|--------------|--------------|-----------|--------|
| `ASSURANCE` | `Assurance` | - | Fait |
| `PARTIENT` | `Patient` | `Assurance` (optionnel) | Fait |
| `CONSULTATION` | `Consultation` | `Patient` | Fait |
| `FACTURATION` | `Facturation` | `Patient` | Fait |
| `ENCAISSEMENT_CAISSE` | `EncaissementCaisse` | `Patient` / `Facturation` / `Consultation` | Fait |
| `EXAMENS_HOSPITALISATION` | `ExamenHospitalisation` | `Patient` | Fait |
| `LIGNE_PRESTATION` | `LignePrestation` | `Patient`, `Facturation`/`ExamenHospitalisation` | Fait |
| `MEDECIN` | `Medecin` | - | Non fourni |
| `ACTE` / `ACTECLINIQUE` | `ActeClinique` | `TypeActe` (optionnel) | Non fourni |
| `TARIF_ASSURANCE` | `TarifAssurance` | `Assurance`, `ActeClinique` | Non fourni |
| `RENDEZ_VOUS` | `RendezVous` | `Patient`, `Medecin` | Non fourni |
| `COMPTE_PATIENT` | `ComptePatient` | `Patient` | Non fourni |
| `HONORAIREPAYE` | `HonorairePaye` | `Patient`, `Medecin` | Non fourni |
| `FACTUREASSUR` | `FactureAssur` | `Patient` | Non fourni |

## Fichiers attendus

Placer dans un même dossier les exports Excel (.xlsx) ou CSV (;, Windows-1252) :

```
exportation windev/
  ├── ASSURANCE.xlsx
  ├── patient.xlsx
  ├── consultation.xlsx
  ├── FACTURATION.xlsx
  ├── ENCAISSEMENT_CAISSE.xlsx
  ├── EXAMENS_HOSPITALISATION.xlsx
  ├── LIGNE_PRESTATION.xlsx
  └── ... (MEDECIN, ACTE, TARIF_ASSURANCE, etc. quand disponibles)
```

## Stratégie de mapping des identifiants

- `IDPARTIENT` (WinDev) → `maps.patientByWinDevId` → `Patient._id`
- `Code_dossier` (WinDev) → `maps.patientByCodeDossier` → `Patient._id`
- `IDCONSULTATION` (WinDev) → `maps.consultationByWinDevId` → `Consultation._id`
- `Code_Prestation` (WinDev) → `maps.consultationByCodePrestation` → `Consultation._id`
- `IDFACTURATION` (WinDev) → `maps.facturationByWinDevId` → `Facturation._id`
- `IDHOSPITALISATION` (WinDev) → `maps.hospitalisationByWinDevId` → `ExamenHospitalisation._id`

Les champs MongoDB `IdPatient`, `idFacturation`, `idHospitalisation`, etc. sont remplis avec les `ObjectId` correspondants. Les références vers des tables non encore importées (actes, médecins, sociétés d’assurance, partenaires) sont laissées vides.

## Points d’attention

- Les champs `IdPatient`, `idFacturation`, `idHospitalisation`, etc. reçoivent de vrais `ObjectId` MongoDB, jamais les numéros WinDev.
- Les dates Excel (format nombre) sont converties en `Date` JavaScript.
- Les heures Excel (fraction de jour) sont converties en chaîne `HH:MM:SS`.
- Les montants avec séparateur de milliers ou virgule sont normalisés en `Number`.
- Les enregistrements sans patient (ou sans parent résolu) sont ignorés et signalés.

## Limites actuelles

- Les tables `MEDECIN`, `ACTE`, `TARIF_ASSURANCE`, `RENDEZ_VOUS`, `COMPTE_PATIENT`, `HONORAIREPAYE`, `FACTUREASSUR` n’ont pas été fournies : leurs identifiants ne sont donc pas liés.
- Les relations inverses (liste des consultations dans `Patient`) ne sont pas créées automatiquement : elles se retrouvent via `IdPatient`.
- Les champs `idActe` des `LignePrestation` sont vides tant que `Acte` n’est pas importé.
