/**
 * Import de patients et consultations depuis des exports CSV WinDev
 * vers la base MongoDB du projet Easy Medical.
 *
 * Les fichiers WinDev (.fic/.ndx) étant binaires, ils doivent d'abord être
 * exportés en CSV. Ce script gère :
 *   - l'encodage Windows-1252
 *   - les retours à la ligne sauvages dans certains champs texte
 *   - le mapping des colonnes détaillé dans mapping.js
 *
 * Usage PowerShell :
 *   $env:MONGODB_URI="mongodb://localhost:27017/bd_esaymed"
 *   $env:ENTREPRISE_ID="<objectId_de_l_entreprise>"  # optionnel
 *   node scripts/import_windev/import.js `
 *     --patients "C:/Users/.../patient.csv" `
 *     --consultations "C:/Users/.../consultation.csv"
 *
 * Options :
 *   --encoding win1252|utf8     défaut: win1252
 *   --delimiter <char>          défaut: ;
 *   --skipPatients
 *   --skipConsultations
 *   --dryRun
 *   --format csv|xlsx           défaut: csv
 */

const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');
const { parse } = require('csv-parse/sync');
const xlsx = require('xlsx');
const mongoose = require('mongoose');
const {
  patientColumns,
  consultationColumns,
  mapPatient,
  mapConsultation,
} = require('./mapping');

// Modèles locaux (les fichiers du projet sont en TypeScript et ne sont pas
// directement chargeables par Node). Les schémas sont en strict:false pour
// accepter tous les champs du mapping.
const PatientSchema = new mongoose.Schema({
  Nom: { type: String, required: true },
  Prenoms: { type: String, required: true },
  sexe: { type: String, required: true },
  Age_partient: { type: Number, required: true },
  Date_naisse: { type: Date, required: true },
  Code_dossier: { type: String, required: true, unique: true },
  Situationgeo: { type: String },
  Contact: { type: String },
  AntecedentMedico: { type: String },
  AnteChirurgico: { type: String },
  AnteFamille: { type: String },
  AutreAnte: { type: String },
  Assurance: { type: String },
  SOCIETE_PATIENT: { type: String },
  Taux: { type: Number },
  Matricule: { type: String },
  Souscripteur: { type: String },
  AlergiePatient: { type: String },
  entrepriseId: { type: String },
}, { strict: false, timestamps: true });

const ConsultationSchema = new mongoose.Schema({
  designationC: { type: String, required: true },
  assurance: { type: String, required: true },
  Assure: { type: String, required: true },
  IDASSURANCE: { type: mongoose.Schema.Types.ObjectId, ref: 'Assurance' },
  Prix_Assurance: { type: Number, default: 0 },
  PrixClinique: { type: Number, default: 0 },
  Restapayer: { type: Number, default: 0 },
  montantapayer: { type: Number, default: 0 },
  ReliquatPatient: { type: Number, default: 0 },
  Code_dossier: { type: String },
  CodePrestation: { type: String },
  Date_consulation: { type: Date, default: Date.now },
  Heure_Consultation: { type: String },
  StatutC: { type: Boolean, default: false },
  StatutPaiement: { type: String, default: 'En cours de Paiement' },
  Toutencaisse: { type: Boolean, default: false },
  tauxAssurance: { type: Number, default: 0 },
  PartAssurance: { type: Number, default: 0 },
  tiket_moderateur: { type: Number, default: 0 },
  numero_carte: { type: String },
  NumBon: { type: String },
  Recupar: { type: String, required: true },
  IDACTE: { type: String, required: true },
  IdPatient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  Souscripteur: { type: String },
  PatientP: { type: String },
  SOCIETE_PATIENT: { type: String },
  IDSOCIETEASSURANCE: { type: String },
  Medecin: { type: String },
  IDMEDECIN: { type: mongoose.Schema.Types.ObjectId, ref: 'Medecin' },
  MontantMedecin: { type: Number, default: 0 },
  Sexe: { type: String },
  Diagnostic: { type: String },
  CodeAffection: { type: String },
  MotifConsultation: { type: String },
  ExamenParaclinique: { type: String },
  TraitementClinique: { type: String },
  ConclusionClinique: { type: String },
  Temperature: { type: String },
  Poids: { type: String },
  Tension: { type: String },
  Glycemie: { type: String },
  TailleCons: { type: String },
  AttenteAccueil: { type: Number, default: 0 },
  attenteMedecin: { type: Number, default: 0 },
  Montantencaisse: { type: Number },
  DateFacturation: { type: Date },
  Modepaiement: { type: String },
  Caissiere: { type: String },
  entrepriseId: { type: String },
  Statumed: { type: Number, default: 0 },
  StatutFacturation: { type: Boolean, default: false },
  StatutFacture: { type: Boolean, default: false },
  Numfacture: { type: String },
  Ordonnerlannulation: { type: Number, default: 0 },
  AnnulOrdonnerPar: { type: String },
  AnnulationOrdonneLe: { type: Date },
  StatutAnnulation: { type: String },
  MotifAnnulationFacture: { type: String },
  Annulerle: { type: Date },
  AnnulerPar: { type: String },
}, { strict: false, timestamps: true });

ConsultationSchema.pre('save', async function (next) {
  if (!this.isNew || this.CodePrestation) return next();
  try {
    const initials = `${(this.Nom || 'X').substring(0, 1).toUpperCase()}${(this.Prenoms || 'X').substring(0, 1).toUpperCase()}`;
    const count = await mongoose.model('Consultation').countDocuments();
    const numero = (count + 1).toString().padStart(3, '0');
    this.CodePrestation = `${initials}${numero}`;
    next();
  } catch (err) {
    next(err);
  }
});

const Patient = mongoose.model('Patient', PatientSchema);
const Consultation = mongoose.model('Consultation', ConsultationSchema);

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    patients: null,
    consultations: null,
    encoding: 'win1252',
    delimiter: ';',
    format: 'csv',
    skipPatients: false,
    skipConsultations: false,
    dryRun: false,
  };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--patients': options.patients = args[++i]; break;
      case '--consultations': options.consultations = args[++i]; break;
      case '--encoding': options.encoding = args[++i]; break;
      case '--delimiter': options.delimiter = args[++i]; break;
      case '--format': options.format = args[++i]; break;
      case '--skipPatients': options.skipPatients = true; break;
      case '--skipConsultations': options.skipConsultations = true; break;
      case '--dryRun': options.dryRun = true; break;
    }
  }
  return options;
}

function readCsvFile(filePath, options) {
  const buffer = fs.readFileSync(filePath);
  const decoded = options.encoding === 'win1252'
    ? iconv.decode(buffer, 'windows-1252')
    : iconv.decode(buffer, 'utf-8');
  return decoded;
}

function readExcelFile(filePath) {
  const workbook = xlsx.readFile(filePath, { type: 'file', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  // header: 1 retourne un tableau de tableaux (lignes de cellules brutes)
  const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  return rows;
}

/**
 * Recolle les lignes physiques cassées par des retours à la ligne sauvages.
 * Un nouvel enregistrement logique commence par :
 *   - un chemin C:\... suivi de ;<nombre>;  (fichier exporté depuis WinDev)
 *   - ou simplement ;<nombre>;              (ligne sans image)
 */
function logicalLines(csvText) {
  const rawLines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const records = [];
  let current = '';

  const startsRecord = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (/^C:\\[^;]*;\d+;/.test(trimmed)) return true;
    if (/^;\d+;/.test(trimmed)) return true;
    return false;
  };

  for (const line of rawLines) {
    if (startsRecord(line)) {
      if (current) records.push(current);
      current = line;
    } else {
      if (current) {
        current += ' ' + line.trim();
      } else if (line.trim()) {
        current = line;
      }
    }
  }
  if (current) records.push(current);

  return records;
}

function parseRecords(csvText, delimiter) {
  const records = logicalLines(csvText);
  const rows = [];
  for (const rec of records) {
    try {
      const parsed = parse(rec, {
        delimiter,
        quote: '"',
        relax_quotes: true,
        relax_column_count: true,
        skip_empty_lines: true,
      });
      if (parsed && parsed.length > 0) {
        rows.push(parsed[0]);
      }
    } catch (err) {
      console.warn('Ligne ignorée (parse CSV) :', err.message);
      console.warn(rec.substring(0, 200));
    }
  }
  return rows;
}

function getRows(filePath, options) {
  if (options.format === 'xlsx' || filePath.toLowerCase().endsWith('.xlsx')) {
    const rows = readExcelFile(filePath);
    // Convertit les dates en string ISO si nécessaire et assure que chaque
    // cellule est une chaîne ou une valeur utilisable.
    return rows
      .filter(r => r.length > 0 && r.some(c => c !== '' && c != null))
      .map(r => r.map(c => {
        if (c instanceof Date) return c.toISOString().split('T')[0];
        if (typeof c === 'number') return String(c);
        return String(c ?? '');
      }));
  }
  const csvText = readCsvFile(filePath, options);
  return parseRecords(csvText, options.delimiter);
}

async function importPatients(filePath, options) {
  console.log(`\n[Import Patients] ${filePath}`);
  const rows = getRows(filePath, options);
  console.log(`  ${rows.length} ligne(s) logique(s) lue(s)`);

  const patientMap = new Map(); // Code_dossier -> _id
  let inserted = 0;
  let skipped = 0;

  // Saute la première ligne si elle ressemble à un header
  const startIdx = rows.length > 0 && String(rows[0][1] || '').toUpperCase() === 'IDPARTIENT' ? 1 : 0;

  for (let i = startIdx; i < rows.length; i++) {
    const row = rows[i];
    const doc = mapPatient(row);
    if (!doc || !doc.Code_dossier) {
      skipped++;
      continue;
    }

    if (options.dryRun) {
      console.log(`  [DRY-RUN] ${doc.Nom} ${doc.Prenoms} (${doc.Code_dossier})`);
      inserted++;
      // ObjectId factice valide pour pouvoir tester la liaison consultation
      patientMap.set(doc.Code_dossier, new mongoose.Types.ObjectId().toString());
      continue;
    }

    try {
      const existing = await Patient.findOne({ Code_dossier: doc.Code_dossier }).lean();
      if (existing) {
        patientMap.set(doc.Code_dossier, existing._id.toString());
        skipped++;
        continue;
      }
      const created = await new Patient(doc).save();
      patientMap.set(doc.Code_dossier, created._id.toString());
      inserted++;
    } catch (err) {
      console.error(`  Erreur patient ${doc.Code_dossier} :`, err.message);
      skipped++;
    }
  }

  console.log(`  insérés: ${inserted}, ignorés/erreurs: ${skipped}`);
  return { inserted, skipped, map: patientMap };
}

async function importConsultations(filePath, patientMap, options) {
  console.log(`\n[Import Consultations] ${filePath}`);
  const rows = getRows(filePath, options);
  console.log(`  ${rows.length} ligne(s) logique(s) lue(s)`);

  let inserted = 0;
  let skipped = 0;

  // Saute la première ligne si elle ressemble à un header
  const startIdx = rows.length > 0 && String(rows[0][1] || '').toUpperCase() === 'IDCONSULTATION' ? 1 : 0;

  for (let i = startIdx; i < rows.length; i++) {
    const row = rows[i];
    const doc = mapConsultation(row, patientMap);
    if (!doc) {
      skipped++;
      continue;
    }

    if (options.dryRun) {
      console.log(`  [DRY-RUN] ${doc.Code_dossier} - ${doc.Date_consulation.toISOString()}`);
      inserted++;
      continue;
    }

    try {
      await new Consultation(doc).save();
      inserted++;
    } catch (err) {
      console.error(`  Erreur consultation ${doc.Code_dossier} :`, err.message);
      skipped++;
    }
  }

  console.log(`  insérées: ${inserted}, ignorées/erreurs: ${skipped}`);
  return { inserted, skipped };
}

async function main() {
  const options = parseArgs();
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('Variable requise : MONGODB_URI ou MONGO_URI');
    process.exit(1);
  }

  if (!options.skipPatients && !options.patients) {
    console.warn('Aucun fichier patients fourni (--patients).');
  }
  if (!options.skipConsultations && !options.consultations) {
    console.warn('Aucun fichier consultations fourni (--consultations).');
  }

  console.log(`Connexion à ${mongoUri}`);
  await mongoose.connect(mongoUri);
  console.log('Connecté à MongoDB.');

  try {
    let patientMap = new Map();
    if (!options.skipPatients && options.patients) {
      const result = await importPatients(options.patients, options);
      patientMap = result.map;
    }

    if (!options.skipConsultations && options.consultations) {
      await importConsultations(options.consultations, patientMap, options);
    }

    console.log('\nImport terminé.');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(err => {
  console.error('Erreur fatale :', err);
  process.exit(1);
});
