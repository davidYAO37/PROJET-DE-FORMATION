/**
 * Import complet WinDev → MongoDB (Easy Medical).
 *
 * Importe les tables : ASSURANCE, PARTIENT, CONSULTATION, FACTURATION,
 * ENCAISSEMENT_CAISSE, EXAMENS_HOSPITALISATION, LIGNE_PRESTATION.
 *
 * Usage :
 *   $env:MONGODB_URI="mongodb://localhost:27017/bd_esaymed"
 *   $env:ENTREPRISE_ID="<objectId_de_l_entreprise>"
 *   node scripts/import_windev/import_all.js --dir "C:/chemin/vers/exportation windev" [--dryRun]
 */

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const mongoose = require('mongoose');

const {
  patientColumns,
  consultationColumns,
  mapPatient,
  mapConsultation,
} = require('./mapping');

const {
  assuranceColumns,
  acteColumns,
  tarifAssuranceColumns,
  facturationColumns,
  encaissementColumns,
  examenHospitalisationColumns,
  lignePrestationColumns,
  mapAssurance,
  mapActe,
  mapTarifAssurance,
  mapFacturation,
  mapEncaissementCaisse,
  mapExamenHospitalisation,
  mapLignePrestation,
} = require('./mappingTables');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dir: null,
    dryRun: false,
    refresh: false,
    onlyReferences: false,
    uri: process.env.MONGODB_URI || process.env.MONGO_URI,
  };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dir': options.dir = args[++i]; break;
      case '--dryRun': options.dryRun = true; break;
      case '--refresh': options.refresh = true; break;
      case '--onlyReferences': options.onlyReferences = true; break;
      case '--uri': options.uri = args[++i]; break;
    }
  }
  return options;
}

function filePath(dir, name, exts = ['.xlsx', '.csv']) {
  for (const ext of exts) {
    const p = path.join(dir, `${name}${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function readExcelFile(filePath) {
  const workbook = xlsx.readFile(filePath, { type: 'file', cellDates: true });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
}

function readCsvFile(filePath) {
  const iconv = require('iconv-lite');
  const { parse } = require('csv-parse/sync');
  const buffer = fs.readFileSync(filePath);
  const decoded = iconv.decode(buffer, 'windows-1252');
  return parse(decoded, {
    delimiter: ';',
    quote: '"',
    relax_quotes: true,
    relax_column_count: true,
    skip_empty_lines: true,
  });
}

function getRows(filePath) {
  if (filePath.toLowerCase().endsWith('.xlsx')) {
    const rows = readExcelFile(filePath);
    return rows
      .filter(r => r.length > 0 && r.some(c => c !== '' && c != null))
      .map(r => r.map(c => {
        if (c instanceof Date) return c.toISOString().split('T')[0];
        if (typeof c === 'number') return String(c);
        return String(c ?? '');
      }));
  }
  return readCsvFile(filePath);
}

async function importTable(Model, filePath, columns, mapFn, idColumn, idMap, maps, options) {
  console.log(`\n[Import ${Model.modelName}] ${filePath}`);
  const rows = getRows(filePath);
  console.log(`  ${rows.length} ligne(s) lue(s)`);

  let inserted = 0;
  let skipped = 0;
  const startIdx = rows.length > 0 && columns.some((c, i) => String(rows[0][i] || '').toUpperCase() === c.toUpperCase()) ? 1 : 0;

  for (let i = startIdx; i < rows.length; i++) {
    const row = rows[i];
    const doc = await mapFn(row, maps);
    if (!doc) {
      skipped++;
      continue;
    }

    const legacyId = doc._legacyId || getField(row, columns, idColumn);
    delete doc._legacyId;
    if (legacyId) doc.legacyId = String(legacyId);

    if (options.dryRun) {
      inserted++;
      if (idMap && legacyId) idMap.set(String(legacyId), new mongoose.Types.ObjectId().toString());
      continue;
    }

    try {
      let existing;
      if (legacyId) existing = await Model.findOne({ legacyId: String(legacyId) }).select('_id').lean();
      if (!existing && Model.modelName === 'Assurance') existing = await Model.findOne({ codeassurance: doc.codeassurance }).select('_id').lean();
      if (!existing && Model.modelName === 'ActeClinique') existing = await Model.findOne({ designationacte: doc.designationacte }).select('_id').lean();
      if (!existing && Model.modelName === 'TarifAssurance') existing = await Model.findOne({ assurance: doc.assurance, acteId: doc.acteId }).select('_id').lean();
      if (existing) {
        if (options.refresh) await Model.updateOne({ _id: existing._id }, { $set: doc });
        if (idMap && legacyId) idMap.set(String(legacyId), existing._id.toString());
        skipped++;
        continue;
      }
      const created = await new Model(doc).save();
      inserted++;
      if (idMap && legacyId) idMap.set(String(legacyId), created._id.toString());
    } catch (err) {
      console.error(`  Erreur ${Model.modelName} ${legacyId || ''}:`, err.message);
      skipped++;
    }
  }

  console.log(`  insérés: ${inserted}, ignorés/erreurs: ${skipped}`);
  return { inserted, skipped };
}

function getField(row, columns, name) {
  const idx = columns.indexOf(name);
  if (idx === -1) return undefined;
  return row[idx];
}

async function main() {
  const options = parseArgs();
  if (!options.uri) {
    console.error('Variable requise : MONGODB_URI ou MONGO_URI');
    process.exit(1);
  }
  if (!options.dir) {
    console.error('Argument requis : --dir <dossier>');
    process.exit(1);
  }

  console.log(`Connexion à ${options.uri}`);
  await mongoose.connect(options.uri);
  console.log('Connecté à MongoDB.');

  const schemas = {};

  // Schémas locaux (strict:false pour accepter les champs supplémentaires)
  schemas.Assurance = new mongoose.Schema({
    legacyId: Number,
    designationassurance: { type: String, required: true },
    codeassurance: { type: String, required: true, unique: true },
    telephone: { type: String },
    email: { type: String },
    NCC: { type: String },
    societes: [mongoose.Schema.Types.ObjectId],
    entrepriseId: String,
  }, { strict: false, timestamps: true });

  schemas.ActeClinique = new mongoose.Schema({
    designationacte: { type: String, required: true, unique: true },
    lettreCle: { type: String, required: true },
    coefficient: { type: Number, required: true },
    prixClinique: { type: Number, required: true },
    prixMutuel: Number,
    prixPreferentiel: Number,
    IDTYPE_ACTE: { type: mongoose.Schema.Types.ObjectId, ref: 'TypeActe' },
    montantacte: Number,
    TYPEACTE: String,
    MontantAuMed: Number,
    resultatacte: String,
    IDFAMILLE_ACTE_BIOLOGIE: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilleActe' },
    TypeResultat: Number,
    Interpretation: String,
    ORdonnacementAffichage: Number,
    consultationviste: { type: Boolean, default: false },
    MontantAnesthesiste: Number,
    MontantAideOperatoire: Number,
    ActeNonFacturable: { type: Boolean, default: false },
    entrepriseId: String,
  }, { strict: false, timestamps: true });

  schemas.TarifAssurance = new mongoose.Schema({
    acte: { type: String, required: true },
    acteId: { type: mongoose.Schema.Types.ObjectId, ref: 'ActeClinique', required: true },
    lettreCle: { type: String, required: true },
    coefficient: { type: Number, required: true },
    prixmutuel: { type: Number, required: true, default: 0 },
    prixpreferenciel: { type: Number, required: true, default: 0 },
    assurance: { type: mongoose.Schema.Types.ObjectId, ref: 'Assurance', required: true },
    entrepriseId: String,
  }, { strict: false, timestamps: true });
  schemas.TarifAssurance.index({ assurance: 1, acteId: 1 }, { unique: true });

  schemas.Patient = new mongoose.Schema({
    Nom: { type: String, required: true },
    Prenoms: { type: String, required: true },
    sexe: { type: String, required: true },
    Age_partient: { type: Number, required: true },
    Date_naisse: { type: Date, required: true },
    Code_dossier: { type: String, required: true, unique: true },
    Situationgeo: String,
    Contact: String,
    AntecedentMedico: String,
    AnteChirurgico: String,
    AnteFamille: String,
    AutreAnte: String,
    Assurance: String,
    SOCIETE_PATIENT: String,
    Taux: Number,
    Matricule: String,
    Souscripteur: String,
    AlergiePatient: String,
    entrepriseId: String,
  }, { strict: false, timestamps: true });

  schemas.Consultation = new mongoose.Schema({
    designationC: { type: String, required: true },
    assurance: { type: String, required: true },
    Assure: { type: String, required: true },
    IDASSURANCE: mongoose.Schema.Types.ObjectId,
    Prix_Assurance: { type: Number, default: 0 },
    PrixClinique: { type: Number, default: 0 },
    Restapayer: { type: Number, default: 0 },
    montantapayer: { type: Number, default: 0 },
    ReliquatPatient: { type: Number, default: 0 },
    Code_dossier: String,
    CodePrestation: String,
    Date_consulation: { type: Date, default: Date.now },
    Heure_Consultation: String,
    StatutC: { type: Boolean, default: false },
    StatutPaiement: { type: String, default: 'En cours de Paiement' },
    Toutencaisse: { type: Boolean, default: false },
    tauxAssurance: { type: Number, default: 0 },
    PartAssurance: { type: Number, default: 0 },
    tiket_moderateur: { type: Number, default: 0 },
    numero_carte: String,
    NumBon: String,
    Recupar: { type: String, required: true },
    IDACTE: { type: String, required: true },
    IdPatient: mongoose.Schema.Types.ObjectId,
    Souscripteur: String,
    PatientP: String,
    SOCIETE_PATIENT: String,
    IDSOCIETEASSURANCE: String,
    Medecin: String,
    MontantMedecin: { type: Number, default: 0 },
    Sexe: String,
    statutPrescriptionMedecin: { type: Number, default: 0 },
    Diagnostic: String,
    ExamenClinique: String,
    CodeAffection: String,
    MotifConsultation: String,
    ExamenParaclinique: String,
    TraitementClinique: String,
    ConclusionClinique: String,
    Temperature: String,
    Poids: String,
    Tension: String,
    Glycemie: String,
    TailleCons: String,
    AttenteAccueil: { type: Number, default: 0 },
    attenteMedecin: { type: Number, default: 0 },
    Montantencaisse: Number,
    DateFacturation: Date,
    Modepaiement: String,
    Caissiere: String,
    entrepriseId: String,
    Statumed: { type: Number, default: 0 },
    StatutFacturation: { type: Boolean, default: false },
    StatutFacture: { type: Boolean, default: false },
    Numfacture: String,
    Ordonnerlannulation: { type: Number, default: 0 },
    AnnulOrdonnerPar: String,
    AnnulationOrdonneLe: Date,
    StatutAnnulation: String,
    MotifAnnulationFacture: String,
    Annulerle: Date,
    AnnulerPar: String,
  }, { strict: false, timestamps: true });

  schemas.Consultation.pre('save', async function (next) {
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

  schemas.Facturation = new mongoose.Schema({
    CodePrestation: String,
    NomMed: String,
    PatientP: String,
    Code_dossier: String,
    DatePres: Date,
    SaisiPar: String,
    Rclinique: String,
    Montanttotal: Number,
    TotalPaye: Number,
    TotaleTaxe: Number,
    MontantRecu: Number,
    reduction: Number,
    tauxreduction: Number,
    MotifRemise: String,
    Restapayer: Number,
    TotalapayerPatient: Number,
    SocieteP: String,
    PartAssuranceP: Number,
    Partassure: Number,
    Taux: String,
    Assurance: String,
    IDTYPE_ACTE: String,
    FacturePar: String,
    IdPatient: mongoose.Schema.Types.ObjectId,
    CompteClient: Boolean,
    ModifierPar: String,
    DateModif: Date,
    HeureModif: String,
    IDAPPORTEUR: Number,
    Entrele: Date,
    SortieLe: Date,
    Chambre: String,
    nombreDeJours: Number,
    Numcarte: String,
    Designationtypeacte: String,
    StatutFacture: Boolean,
    Numfacture: String,
    NumBon: String,
    MontantMedecin: Number,
    PartApporteur: Number,
    Medecin: mongoose.Schema.Types.ObjectId,
    Statumed: String,
    BanqueC: String,
    NumCheque: String,
    Modepaiement: String,
    TotalReliquatPatient: Number,
    CautionPatient: Number,
    Assure: String,
    MontantMedecinExécutant: Number,
    NummedecinExécutant: String,
    MedecinExécutant: String,
    Payeoupas: Boolean,
    resultatacte: String,
    StatutApporteur: String,
    Statutexécutant: String,
    StatutLaboratoire: Number,
    ObservationC: String,
    Receptionnerpar: String,
    Datetransferbiologiste: Date,
    Transferepar: String,
    DATERECEPTIONNER: Date,
    Heurereception: String,
    Heure_service: String,
    dateretour: Date,
    ExtensionF: String,
    Souscripteur: String,
    Heure_Facturation: String,
    CONCLUSIONGENE: String,
    NumCarteVisa: String,
    NumCompteVisa: String,
    DateValidation: Date,
    ProvenanceExamen: String,
    NIdentificationExamen: String,
    Biologiste: String,
    Externe_Interne: String,
    factureannule: Boolean,
    StatutPrescriptionMedecin: Number,
    Fichedesuivipatient: String,
    Ordonnerlannulation: Number,
    AnnulOrdonnerPar: String,
    AnnulationOrdonneLe: Date,
    AnnulerPar: String,
    Annulerle: Date,
    StatutPaiement: String,
    MotifRetour: String,
    MotifAnnulationFacture: String,
    DateFacturation: Date,
    typefacture: String,
    IDSOCIETEASSURANCE: String,
    SOCIETE_PATIENT: String,
    StactFacPatient: Number,
    StactFactAssurance: Number,
    entrepriseId: String,
  }, { strict: false, timestamps: true });

  schemas.EncaissementCaisse = new mongoose.Schema({
    DatePrest: Date,
    Patient: String,
    Assurance: String,
    Designation: String,
    Totalacte: Number,
    Taux: Number,
    PartAssurance: Number,
    Partassure: Number,
    REMISE: Number,
    TotalPaye: Number,
    Restapayer: Number,
    Medecin: String,
    Utilisateur: String,
    DateEncaissement: Date,
    Montantencaisse: Number,
    HeureEncaissement: String,
    Modepaiement: String,
    BanqueC: String,
    NumCarteVisa: String,
    NumCheque: String,
    NumCompteVisa: String,
    IDFACTURATION: String,
    IDCONSULTATION: String,
    restapayerBilan: String,
    TotalapayerPatient: Number,
    Assure: String,
    IdPatient: String,
    AnnulationOrdonneLe: Date,
    annulationOrdonnepar: String,
    entrepriseId: String,
  }, { strict: false, timestamps: true });

  schemas.ExamenHospitalisation = new mongoose.Schema({
    CodePrestation: String,
    NomMed: String,
    PatientP: String,
    Code_dossier: String,
    DatePres: Date,
    SaisiPar: String,
    Rclinique: String,
    Montanttotal: Number,
    TotalPaye: Number,
    TotaleTaxe: Number,
    MontantRecu: Number,
    reduction: Number,
    tauxreduction: Number,
    MotifRemise: String,
    Restapayer: Number,
    DateEncaissement: Date,
    TotalapayerPatient: Number,
    SocieteP: String,
    PartAssuranceP: Number,
    Partassure: Number,
    Taux: String,
    Assurance: String,
    IDTYPE_ACTE: String,
    FacturePar: String,
    IdPatient: mongoose.Schema.Types.ObjectId,
    CompteClient: Boolean,
    ModifierPar: String,
    HeureModif: String,
    IDAPPORTEUR: Number,
    Entrele: Date,
    SortieLe: Date,
    Chambre: String,
    nombreDeJours: Number,
    Numcarte: String,
    Designationtypeacte: String,
    StatutFacture: Boolean,
    Numfacture: String,
    NumBon: String,
    MontantMedecin: Number,
    PartApporteur: Number,
    idMedecin: mongoose.Schema.Types.ObjectId,
    idMedecinAnesthesiste: mongoose.Schema.Types.ObjectId,
    Statumed: String,
    BanqueC: String,
    NumCheque: String,
    Modepaiement: String,
    TotalReliquatPatient: Number,
    CautionPatient: Number,
    Assure: String,
    MontantMedecinExécutant: Number,
    NummedecinExécutant: String,
    MedecinExécutant: String,
    Payeoupas: Boolean,
    resultatacte: String,
    StatutApporteur: String,
    Statutexécutant: String,
    StatutLaboratoire: Number,
    ObservationC: String,
    Receptionnerpar: String,
    Datetransferbiologiste: Date,
    Transferepar: String,
    DATERECEPTIONNER: Date,
    Heurereception: String,
    Heure_service: String,
    dateretour: Date,
    ExtensionF: String,
    Souscripteur: String,
    Heure_Facturation: String,
    CONCLUSIONGENE: String,
    NumCarteVisa: String,
    NumCompteVisa: String,
    DateValidation: Date,
    ProvenanceExamen: String,
    NIdentificationExamen: String,
    Biologiste: String,
    Externe_Interne: String,
    factureannule: Boolean,
    statutPrescriptionMedecin: Number,
    Fichedesuivipatient: String,
    Ordonnerlannulation: Number,
    AnnulOrdonnerPar: String,
    AnnulationOrdonneLe: Date,
    AnnulerPar: String,
    Annulerle: Date,
    StatutPaiement: String,
    MotifRetour: String,
    MotifAnnulationFacture: String,
    PartenaireBilan: String,
    ObservationHospitalisation: String,
    IDCHAMBRE: mongoose.Schema.Types.ObjectId,
    IDSOCIETEASSURANCE: String,
    SOCIETE_PATIENT: String,
    NomIntervention: String,
    entrepriseId: String,
  }, { strict: false, timestamps: true });

  schemas.LignePrestation = new mongoose.Schema({
    CodePrestation: { type: String, required: true },
    codeConsultation: String,
    dateLignePrestation: Date,
    prestation: { type: String, required: true },
    qte: { type: Number, required: true },
    prix: { type: Number, required: true },
    partAssurance: { type: Number, required: true },
    tauxAssurance: { type: Number, required: true },
    IdPatient: { type: mongoose.Schema.Types.ObjectId, required: true },
    idHospitalisation: mongoose.Schema.Types.ObjectId,
    partAssure: { type: Number, required: true },
    prixTotal: { type: Number, required: true },
    coefficientActe: { type: Number, required: true },
    reliquatCoefAssurance: { type: Number, required: true },
    lettreCle: { type: String, required: false },
    taxe: Number,
    idTypeActe: String,
    idActe: { type: mongoose.Schema.Types.ObjectId, required: false },
    idApporteur: String,
    reliquatPatient: Number,
    totalCoefficient: Number,
    prixClinique: Number,
    numMedecinExecutant: String,
    montantMedecinExecutant: Number,
    idMedecin: mongoose.Schema.Types.ObjectId,
    acteMedecin: String,
    resultatActe: String,
    observationExamen: String,
    exclusionActe: String,
    tarifAssurance: Number,
    coefficientAssur: Number,
    coefficientClinique: Number,
    montantTotalAPayer: Number,
    totalSurplus: Number,
    statutExecutant: String,
    nomPatient: String,
    dateSaisieResultat: Date,
    sexe: String,
    agePatient: Number,
    situationGeo: String,
    resultatSaisiePar: String,
    medecinPrescripteur: String,
    idFamilleActeBiologie: String,
    familleActe: String,
    prixAccepte: Number,
    prixRefuse: Number,
    biologiste: String,
    validerLe: Date,
    provenanceExamen: String,
    externeInterne: String,
    nIdentificationExamen: String,
    acteExecuter: Boolean,
    statutPrescriptionMedecin: Number,
    acteFacture: Boolean,
    resultatManuel: String,
    statutHonoraireMedecin: Number,
    typeResultat: Number,
    actePayeCaisse: String,
    datePaiementCaisse: Date,
    heurePaiement: String,
    payePar: String,
    compteRenduValidePar: String,
    compteRenduValideA: String,
    compteRenduValideLe: Date,
    medecinExecutant: String,
    idFacturation: mongoose.Schema.Types.ObjectId,
    SOCIETE_PATIENT: String,
    IDSOCIETEPARTENAIRE: String,
    ordonnancementAffichage: Number,
    entrepriseId: String,
  }, { strict: false, timestamps: true });

  const models = {
    Assurance: mongoose.model('Assurance', schemas.Assurance),
    ActeClinique: mongoose.model('ActeClinique', schemas.ActeClinique),
    TarifAssurance: mongoose.model('TarifAssurance', schemas.TarifAssurance),
    Patient: mongoose.model('Patient', schemas.Patient),
    Consultation: mongoose.model('Consultation', schemas.Consultation),
    Facturation: mongoose.model('Facturation', schemas.Facturation),
    EncaissementCaisse: mongoose.model('EncaissementCaisse', schemas.EncaissementCaisse),
    ExamenHospitalisation: mongoose.model('ExamenHospitalisation', schemas.ExamenHospitalisation),
    LignePrestation: mongoose.model('LignePrestation', schemas.LignePrestation),
  };

  const maps = {
    assuranceByWinDevId: new Map(),
    acteByWinDevId: new Map(),
    acteByDesignation: new Map(),
    tarifAssuranceByWinDevId: new Map(),
    patientByWinDevId: new Map(),
    patientCodeByWinDevId: new Map(),
    patientByCodeDossier: new Map(),
    consultationByWinDevId: new Map(),
    consultationByCodePrestation: new Map(),
    consultationPatientByWinDevId: new Map(),
    facturationByWinDevId: new Map(),
    facturationPatientByWinDevId: new Map(),
    hospitalisationByWinDevId: new Map(),
    medecinById: new Map(),
    typeActeById: new Map(),
    familleActeById: new Map(),
    apporteurById: new Map(),
    societePartenaireById: new Map(),
    societeAssuranceById: new Map(),
  };

  try {
    const db = mongoose.connection.db;
    for (const doc of await db.collection('typeactes').find({}, { projection: { legacyId: 1 } }).toArray()) {
      if (doc.legacyId) maps.typeActeById.set(String(doc.legacyId), doc._id.toString());
    }
    for (const doc of await db.collection('familleactes').find({}, { projection: { legacyId: 1 } }).toArray()) {
      if (doc.legacyId) maps.familleActeById.set(String(doc.legacyId), doc._id.toString());
    }
    for (const doc of await db.collection('medecins').find({}, { projection: { legacyId: 1 } }).toArray()) {
      if (doc.legacyId) maps.medecinById.set(String(doc.legacyId), doc._id.toString());
    }
    for (const doc of await db.collection('societepartenaires').find({}, { projection: { legacyId: 1 } }).toArray()) {
      if (doc.legacyId) maps.societePartenaireById.set(String(doc.legacyId), doc._id.toString());
    }
    for (const doc of await db.collection('societeassurances').find({}, { projection: { legacyId: 1 } }).toArray()) {
      if (doc.legacyId) maps.societeAssuranceById.set(String(doc.legacyId), doc._id.toString());
    }
    const assuranceFile = filePath(options.dir, 'ASSURANCE');
    if (assuranceFile) {
      await importTable(models.Assurance, assuranceFile, assuranceColumns, mapAssurance, 'IDASSURANCE', maps.assuranceByWinDevId, maps, options);
      if (!options.dryRun) {
        const assurances = await models.Assurance.find({}).select('_id codeassurance').lean();
        assurances.forEach(a => maps.assuranceByWinDevId.set(String(a.codeassurance), a._id.toString()));
      }
    }

    const acteFile = filePath(options.dir, 'Acte') || filePath(options.dir, 'ACTE');
    if (acteFile) {
      await importTable(models.ActeClinique, acteFile, acteColumns, mapActe, 'IDACTEP', maps.acteByWinDevId, maps, options);
      const acteRows = getRows(acteFile);
      if (options.dryRun) {
        for (let i = 1; i < acteRows.length; i++) {
          const legacyId = String(getField(acteRows[i], acteColumns, 'IDACTEP') || '').trim();
          const designation = String(getField(acteRows[i], acteColumns, 'Designation') || '').trim().toLocaleLowerCase('fr');
          const objectId = maps.acteByWinDevId.get(legacyId);
          if (designation && objectId) maps.acteByDesignation.set(designation, objectId);
        }
      } else {
        const actes = await models.ActeClinique.find({}).select('_id designationacte').lean();
        actes.forEach(a => maps.acteByDesignation.set(a.designationacte.trim().toLocaleLowerCase('fr'), a._id.toString()));
      }
    }

    const tarifFile = filePath(options.dir, 'TARIF_ASSURANCE');
    if (tarifFile) {
      await importTable(models.TarifAssurance, tarifFile, tarifAssuranceColumns, mapTarifAssurance, 'IDACTARIF', maps.tarifAssuranceByWinDevId, maps, options);
    }

    if (!options.onlyReferences) {
    const patientFile = filePath(options.dir, 'PARTIENT') || filePath(options.dir, 'patient');
    if (patientFile) {
      const rows = getRows(patientFile);
      console.log(`\n[Import Patient] ${patientFile} (${rows.length} lignes)`);
      let inserted = 0, skipped = 0;
      const startIdx = rows.length > 0 && String(rows[0][1] || '').toUpperCase() === 'IDPARTIENT' ? 1 : 0;
      for (let i = startIdx; i < rows.length; i++) {
        const doc = mapPatient(rows[i]);
        const legacyId = doc && doc._legacyId;
        if (!doc || !doc.Code_dossier) { skipped++; continue; }
        if (options.dryRun) {
          inserted++;
          const fakeId = new mongoose.Types.ObjectId().toString();
          maps.patientByWinDevId.set(String(legacyId), fakeId);
          maps.patientCodeByWinDevId.set(String(legacyId), doc.Code_dossier);
          maps.patientByCodeDossier.set(doc.Code_dossier, fakeId);
          continue;
        }
        try {
          const existing = await models.Patient.findOne({ Code_dossier: doc.Code_dossier }).lean();
          if (existing) {
            if (options.refresh) await models.Patient.updateOne({ _id: existing._id }, { $set: doc });
            maps.patientByWinDevId.set(String(legacyId), existing._id.toString());
            maps.patientCodeByWinDevId.set(String(legacyId), doc.Code_dossier);
            maps.patientByCodeDossier.set(doc.Code_dossier, existing._id.toString());
            skipped++;
            continue;
          }
          const created = await new models.Patient(doc).save();
          maps.patientByWinDevId.set(String(legacyId), created._id.toString());
          maps.patientCodeByWinDevId.set(String(legacyId), doc.Code_dossier);
          maps.patientByCodeDossier.set(doc.Code_dossier, created._id.toString());
          inserted++;
        } catch (err) {
          console.error(`  Erreur patient ${doc.Code_dossier}:`, err.message);
          skipped++;
        }
      }
      console.log(`  insérés: ${inserted}, ignorés/erreurs: ${skipped}`);
    }

    const consultationFile = filePath(options.dir, 'CONSULTATION') || filePath(options.dir, 'consultation');
    if (consultationFile) {
      const rows = getRows(consultationFile);
      console.log(`\n[Import Consultation] ${consultationFile} (${rows.length} lignes)`);
      let inserted = 0, skipped = 0;
      const startIdx = rows.length > 0 && String(rows[0][1] || '').toUpperCase() === 'IDCONSULTATION' ? 1 : 0;
      for (let i = startIdx; i < rows.length; i++) {
        const doc = mapConsultation(rows[i], maps);
        const legacyId = doc && doc._legacyId;
        if (!doc) { skipped++; continue; }
        maps.consultationPatientByWinDevId.set(String(legacyId), doc.IdPatient.toString());
        if (options.dryRun) {
          inserted++;
          const fakeId = new mongoose.Types.ObjectId().toString();
          maps.consultationByWinDevId.set(String(legacyId), fakeId);
          maps.consultationByCodePrestation.set(doc.CodePrestation, fakeId);
          continue;
        }
        try {
          const existing = await models.Consultation.findOne({
            $or: [{ _legacyId: legacyId }, { legacyId: String(legacyId) }, { CodePrestation: doc.CodePrestation }],
          }).select('_id').lean();
          if (existing) {
            if (options.refresh) await models.Consultation.updateOne({ _id: existing._id }, { $set: doc });
            maps.consultationByWinDevId.set(String(legacyId), existing._id.toString());
            maps.consultationByCodePrestation.set(doc.CodePrestation, existing._id.toString());
            skipped++;
            continue;
          }
          const created = await new models.Consultation(doc).save();
          maps.consultationByWinDevId.set(String(legacyId), created._id.toString());
          maps.consultationByCodePrestation.set(doc.CodePrestation, created._id.toString());
          inserted++;
        } catch (err) {
          console.error(`  Erreur consultation ${doc.Code_dossier}:`, err.message);
          skipped++;
        }
      }
      console.log(`  insérés: ${inserted}, ignorés/erreurs: ${skipped}`);
    }

    const facturationFile = filePath(options.dir, 'FACTURATION');
    if (facturationFile) {
      await importTable(models.Facturation, facturationFile, facturationColumns, mapFacturation, 'IDFACTURATION', maps.facturationByWinDevId, maps, options);
    }

    const encaissementFile = filePath(options.dir, 'ENCAISSEMENT_CAISSE');
    if (encaissementFile) {
      await importTable(models.EncaissementCaisse, encaissementFile, encaissementColumns, mapEncaissementCaisse, 'IDPOINT_CAISSE', null, maps, options);
    }

    const hospitFile = filePath(options.dir, 'EXAMENS_HOSPITALISATION');
    if (hospitFile) {
      await importTable(models.ExamenHospitalisation, hospitFile, examenHospitalisationColumns, mapExamenHospitalisation, 'IDHOSPITALISATION', maps.hospitalisationByWinDevId, maps, options);
    }

    const ligneFile = filePath(options.dir, 'LIGNE_PRESTATION');
    if (ligneFile) {
      await importTable(models.LignePrestation, ligneFile, lignePrestationColumns, mapLignePrestation, 'IDLIGNE_PRESTATION', null, maps, options);
    }
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
