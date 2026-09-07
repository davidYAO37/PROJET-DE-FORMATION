const path = require('path');
const xlsx = require('xlsx');
const mongoose = require('mongoose');
const { rtfToText } = require('./rtf');
const { parseDate, toNumber } = require('./mapping');

const args = process.argv.slice(2);
const option = name => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
const uri = option('--uri') || process.env.MONGODB_URI;
const dir = option('--dir');
const dryRun = args.includes('--dryRun');
const entrepriseId = process.env.ENTREPRISE_ID || undefined;

function read(name) {
  const workbook = xlsx.readFile(path.join(dir, `${name}.xlsx`), { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const headers = data[0].map(String);
  return data.slice(1).map(row => Object.fromEntries(headers.map((header, index) => [header, typeof row[index] === 'string' ? rtfToText(row[index]).trim() : row[index]])));
}

function excelTime(value) {
  const number = toNumber(value);
  if (!number || number >= 1) return String(value || '');
  const seconds = Math.round(number * 86400);
  return `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

async function main() {
  if (!uri || !dir) throw new Error('MONGODB_URI et --dir sont requis');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const now = new Date();

  const patients = new Map();
  for (const patient of await db.collection('patients').find({}, { projection: { _legacyId: 1, legacyId: 1, Code_dossier: 1 } }).toArray()) {
    const legacyId = patient._legacyId || patient.legacyId;
    if (legacyId) patients.set(String(legacyId), patient._id);
    if (patient.Code_dossier) patients.set(`code:${patient.Code_dossier}`, patient._id);
  }

  const medecins = new Map();
  for (const medecin of await db.collection('medecins').find({}, { projection: { legacyId: 1 } }).toArray()) if (medecin.legacyId) medecins.set(String(medecin.legacyId), medecin._id);

  const hospitalisations = new Map();
  const hospitalByCode = new Map();
  for (const hospitalisation of await db.collection('examenhospitalisations').find({}, { projection: { CodePrestation: 1 } }).toArray()) {
    if (hospitalisation.CodePrestation) hospitalByCode.set(String(hospitalisation.CodePrestation), hospitalisation._id);
  }
  for (const row of read('EXAMENS_HOSPITALISATION')) {
    const match = hospitalByCode.get(String(row.Code_Prestation));
    if (match) hospitalisations.set(String(row.IDHOSPITALISATION), match);
  }

  let affections = 0;
  const affectionMap = new Map();
  for (const row of read('AFFECTION')) {
    const legacyId = String(row.IDAFFECTION || '');
    const designation = String(row.Designation || '').trim();
    const lettreCle = String(row.LettreCle || '').trim();
    if (!legacyId || !designation || !lettreCle) continue;
    if (dryRun) affectionMap.set(legacyId, new mongoose.Types.ObjectId());
    else {
      const result = await db.collection('affections').findOneAndUpdate(
        { $or: [{ legacyId }, { designation, lettreCle }] },
        { $setOnInsert: { legacyId, designation, lettreCle, entrepriseId, createdAt: now, updatedAt: now } },
        { upsert: true, returnDocument: 'after' },
      );
      affectionMap.set(legacyId, result._id);
    }
    affections++;
  }

  let diagnostics = 0;
  let consultationsUpdated = 0;
  for (const row of read('DIAGNOSTICS_CODE_AFFECTION')) {
    const legacyId = String(row.IDDIAGNOSTIC_Codeaffect || '');
    if (!legacyId) continue;
    const patientId = patients.get(String(row.IDPARTIENT));
    const consultation = await db.collection('consultations').findOne({ CodePrestation: String(row.Code_Prestation || '') }, { projection: { _id: 1 } });
    const document = {
      legacyId, DateDiagnostic: parseDate(row.DATEDIAGNOSTIC), Affection: row.Affection, CodeAffection: String(row.CodeAffection || '').trim(),
      Medecin: row.Medecin, IDMEDECIN: medecins.get(String(row.IDMEDECIN)), PatientP: row.PatientP, IdPatient: patientId,
      Consultation: consultation?._id, CodePrestation: row.Code_Prestation, IDAFFECTION: affectionMap.get(String(row.IDAFFECTION)),
      entrepriseId, createdAt: now, updatedAt: now,
    };
    if (!dryRun) {
      await db.collection('diagnosticcodeaffections').updateOne({ legacyId }, { $setOnInsert: document }, { upsert: true });
      if (consultation) {
        await db.collection('consultations').updateOne({ _id: consultation._id }, { $set: { Diagnostic: row.Affection, CodeAffection: String(row.CodeAffection || '').trim() } });
        consultationsUpdated++;
      }
    }
    diagnostics++;
  }

  let documents = 0;
  let documentsWithoutPatient = 0;
  for (const row of read('DOCUMENT_FICHE_PATIENT')) {
    const legacyId = String(row.IDDOCUMENT_PATIENT || '');
    if (!legacyId) continue;
    const patientId = patients.get(String(row.IDPARTIENT)) || patients.get(`code:${String(row.CODEDOSSIER || '')}`);
    if (!patientId) documentsWithoutPatient++;
    const document = {
      legacyId, LibeleDocument: row.LibeleDocument, Date: parseDate(row.Date), Heure: excelTime(row.Heure), PatientP: row.PatientP,
      AjouterPar: row.AjouterPar, CODEDOSSIER: String(row.CODEDOSSIER || ''), Patient: patientId, ExtensionF: row.ExtensionF,
      DocumentSourceAbsent: !row.Document, entrepriseId, createdAt: now, updatedAt: now,
    };
    if (!dryRun) await db.collection('documentfichepatients').updateOne({ legacyId }, { $setOnInsert: document }, { upsert: true });
    documents++;
  }

  let observations = 0;
  let observationsWithoutHospitalisation = 0;
  for (const row of read('OBSERVATION_HOSPI')) {
    const legacyId = String(row.IDOBSERVATION_HOSPI || '');
    if (!legacyId) continue;
    const patientId = patients.get(`code:${String(row.Code_dossier || '')}`);
    const hospitalisationId = hospitalisations.get(String(row.IDHOSPITALISATION)) || hospitalByCode.get(String(row.Code_Prestation || ''));
    if (!hospitalisationId) observationsWithoutHospitalisation++;
    const document = {
      legacyId, Date: parseDate(row.Date), Heure: excelTime(row.Heure), Intervenant: row.Medecin, ObservationC: row.ObservationC,
      Patient: patientId, Hospitalisation: hospitalisationId, Poids: String(row.Poids || ''), Temperature: String(row['Température'] || ''),
      Tension: String(row.Tension || ''), Glycemie: String(row.Glycemie || ''), TailleCons: String(row.TailleCons || ''),
      Code_dossier: String(row.Code_dossier || ''), CodePrestation: String(row.Code_Prestation || ''), IDMEDECIN: medecins.get(String(row.IDMEDECIN)),
      entrepriseId, createdAt: now, updatedAt: now,
    };
    if (!dryRun) await db.collection('observationhospits').updateOne({ legacyId }, { $setOnInsert: document }, { upsert: true });
    observations++;
  }

  console.log({ dryRun, affections, diagnostics, consultationsUpdated, documents, documentsWithoutPatient, observations, observationsWithoutHospitalisation });
  await mongoose.disconnect();
}

main().catch(error => { console.error(error); process.exit(1); });
