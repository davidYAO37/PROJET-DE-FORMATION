const path = require('path');
const xlsx = require('xlsx');
const mongoose = require('mongoose');
const { rtfToText } = require('./rtf');
const { parseDate, toNumber, toBoolean } = require('./mapping');

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
  const medecins = new Map();
  const prescriptions = new Map();
  for (const doc of await db.collection('medecins').find({}, { projection: { legacyId: 1 } }).toArray()) if (doc.legacyId) medecins.set(String(doc.legacyId), doc._id);
  for (const doc of await db.collection('prescriptions').find({}, { projection: { legacyId: 1 } }).toArray()) if (doc.legacyId) prescriptions.set(String(doc.legacyId), doc._id);

  const consultationsByCode = new Map();
  for (const doc of await db.collection('consultations').find({}, { projection: { CodePrestation: 1 } }).toArray()) if (doc.CodePrestation) consultationsByCode.set(String(doc.CodePrestation), doc._id);
  const consultations = new Map();
  for (const row of read('consultation')) {
    const match = consultationsByCode.get(String(row.Code_Prestation));
    if (match) consultations.set(String(row.IDCONSULTATION), match);
  }
  const hospitalByCode = new Map();
  for (const doc of await db.collection('examenhospitalisations').find({}, { projection: { CodePrestation: 1 } }).toArray()) if (doc.CodePrestation) hospitalByCode.set(String(doc.CodePrestation), doc._id);
  const hospitalisations = new Map();
  for (const row of read('EXAMENS_HOSPITALISATION')) {
    const match = hospitalByCode.get(String(row.Code_Prestation));
    if (match) hospitalisations.set(String(row.IDHOSPITALISATION), match);
  }

  async function importRows(file, collection, idField, mapper, outputMap) {
    let imported = 0;
    let operations = [];
    for (const row of read(file)) {
      const legacyId = String(row[idField] || '').trim();
      if (!legacyId) continue;
      const document = { legacyId, ...mapper(row), entrepriseId, createdAt: now, updatedAt: now };
      if (dryRun) outputMap?.set(legacyId, new mongoose.Types.ObjectId());
      else {
        const existing = await db.collection(collection).findOne({ legacyId }, { projection: { _id: 1 } });
        if (existing) outputMap?.set(legacyId, existing._id);
        else {
          const id = new mongoose.Types.ObjectId();
          document._id = id;
          outputMap?.set(legacyId, id);
          operations.push({ insertOne: { document } });
        }
      }
      imported++;
      if (operations.length === 500) {
        await db.collection(collection).bulkWrite(operations, { ordered: false });
        operations = [];
      }
    }
    if (operations.length) await db.collection(collection).bulkWrite(operations, { ordered: false });
    return imported;
  }

  const honoraires = new Map();
  const honorairesCount = await importRows('HonoraireMed', 'honorairemeds', 'IDHonoraireMed', row => ({
    date: parseDate(row.Date), Heure: excelTime(row.Heure), Montanttotal: toNumber(row.Montanttotal), MontantJour: toNumber(row.MontantJour),
    MontantPayé: toNumber(row['MontantPayé']), Restapayer: toNumber(row.Restapayer), Medecin: medecins.get(String(row.IDMEDECIN)),
    DEBUTD: parseDate(row.DEBUTD), FIND: parseDate(row.FIND), NBHONRAIRE: toNumber(row.NBHONRAIRE), montanttotalhono: toNumber(row.montanttotalhono),
    parthonoraire: toNumber(row.parthonoraire), NBPRESCRIPTION: toNumber(row.NBPRESCRIPTION), montanttaotalPrescrip: toNumber(row.montanttaotalPrescrip),
    partpres: toNumber(row.partpres), NBEXECUTANT: toNumber(row.NBEXECUTANT), MontanttotalExeut: toNumber(row.MontanttotalExeut),
    partexcu: toNumber(row.partexcu), Totalnetapayer: toNumber(row.Totalnetapayer), Totalretenue: toNumber(row.Totalretenue),
    NBAideOperatoire: toNumber(row.NBAideOperatoire), MontantAideTotal: toNumber(row.MontantAideTotal), ParAide: toNumber(row.ParAide),
    NBAnestesiste: toNumber(row.NBAnestesiste), MontantTotalAnestesiste: toNumber(row.MontantTotalAnestesiste), ParAnesthesiste: toNumber(row.ParAnesthesiste),
  }), honoraires);

  const lignesHonoraires = await importRows('LihgneHonoraireMed', 'lignehonorairemeds', 'IDLihgneHonoraireMed', row => ({
    DatePres: parseDate(row.DatePres), IdPres: row.IdPres, PrestationMed: row.PrestationMed, Montantpres: toNumber(row.Montantpres),
    Medecin: medecins.get(String(row.IDMEDECIN)), HonoraireMed: honoraires.get(String(row.IDHonoraireMed)), Totalacte: toNumber(row.Totalacte),
    TYPEACTE: row.TYPEACTE, TAXE: toNumber(row.TAXE), Netapayer: toNumber(row.Netapayer), Patient: row.Patient,
  }));

  const factures = new Map();
  const facturesCount = await importRows('FactureAssur', 'factureassurs', 'IDFactureAssur', row => ({
    Reference: row.Reference, Saisirpar: row.Saisirpar, Date: parseDate(row.Date), etat_facture: toBoolean(row.etat_facture),
    DateDepot: parseDate(row.DateDepot), DepotPar: row.DepotPar, DateRetrait: parseDate(row.DateRetrait), RetirePar: row['RetiréPar'],
    NumChèque: row['NumChèque'], MontantTotalFacture: toNumber(row.MontantTotalFacture), Partassure: toNumber(row['Partassuré']),
    PartAssurance: toNumber(row.PartAssurance), DebutF: parseDate(row.DebutF), FinF: parseDate(row.FinF), Assurance: row.Assuance,
    TYPEACTE: row.TYPEACTE, TotalPaye: toNumber(row.TotalPaye), Restapayer: toNumber(row.Restapayer),
  }), factures);

  const recapCount = await importRows('Facture_Recap', 'facturerecaps', 'IDFacture_Recap', row => ({
    Numfacture: row.Numfacture, ACTE: row.ACTE, montantacte: toNumber(row.montantacte), Partassure: toNumber(row['Partassuré']),
    PartAssurance: toNumber(row.PartAssurance), DebutF: parseDate(row.DebutF), FinF: parseDate(row.FinF), DateSaisie: parseDate(row.DateSaisie),
    FactureAssur: factures.get(String(row.IDFactureAssur)), Assurance: row.Assuance, CreePar: row.CreePar, NCC: row.NCC,
  }));

  const lignesFactures = await importRows('Lingne_Facture', 'lignefactures', 'IDLigneFacture', row => ({
    DateFacture: parseDate(row.DateFacture), TotalHT: toNumber(row.TotalHT), FactureAssur: factures.get(String(row.IDFactureAssur)), ACTEF: row.ACTEF,
    Partassure: toNumber(row['Partassuré']), PartAssurance: toNumber(row.PartAssurance), Totalacte: toNumber(row.Totalacte),
    SaisiLe: parseDate(row.SaisiLe), SaisiPar: row.SaisiPar, TYPEACTE: row.TYPEACTE, Matricule: row.Matricule, NumBon: row.NumBon,
    idHospitalisation: hospitalisations.get(String(row.IDHOSPITALISATION)), IDCONSULTATION: consultations.get(String(row.IDCONSULTATION)),
    IDPRESCRIPTION: prescriptions.get(String(row.IDPRESCRIPTION)), Beneficiaire: row.Beneficiaire, SOCIETE_PATIENT: row.SOCIETE_PATIENT,
    AHospitalisation: toNumber(row.AHospitalisation), IDANNALYSE_LEGACY: String(row.IDANNALYSE || ''), IDMAGERIE_LEGACY: String(row.IDMAGERIE || ''), IDCHIRURGIE_LEGACY: String(row.IDCHIRURGIE || ''),
  }));

  console.log({ dryRun, honoraires: honorairesCount, lignesHonoraires, facturesAssurance: facturesCount, facturesRecap: recapCount, lignesFactures });
  await mongoose.disconnect();
}

main().catch(error => { console.error(error); process.exit(1); });
