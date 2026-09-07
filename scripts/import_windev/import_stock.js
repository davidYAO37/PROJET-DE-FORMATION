const fs = require('fs');
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

function resolveFile(name) {
  const exact = path.join(dir, `${name}.xlsx`);
  if (fs.existsSync(exact)) return exact;
  const match = fs.readdirSync(dir).find(file => file.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === `${name}.xlsx`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase());
  if (!match) throw new Error(`Fichier absent: ${name}.xlsx`);
  return path.join(dir, match);
}

function read(name) {
  const workbook = xlsx.readFile(resolveFile(name), { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const headers = data[0].map(String);
  return data.slice(1).map(row => Object.fromEntries(headers.map((header, index) => [header, typeof row[index] === 'string' ? rtfToText(row[index]).trim() : row[index]])));
}

async function main() {
  if (!uri || !dir) throw new Error('MONGODB_URI et --dir sont requis');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const now = new Date();
  const medicinesByLegacy = new Map();
  const medicinesByReference = new Map();
  const prescriptions = new Map();
  const patientPrescriptions = new Map();

  for (const doc of await db.collection('pharmacies').find({}, { projection: { legacyId: 1, Reference: 1 } }).toArray()) {
    if (doc.legacyId) medicinesByLegacy.set(String(doc.legacyId), doc._id);
    if (doc.Reference) medicinesByReference.set(String(doc.Reference).trim().toLowerCase(), doc._id);
  }
  for (const doc of await db.collection('prescriptions').find({}, { projection: { legacyId: 1 } }).toArray()) if (doc.legacyId) prescriptions.set(String(doc.legacyId), doc._id);
  for (const doc of await db.collection('patientprescriptions').find({}, { projection: { legacyId: 1, IdPatient: 1 } }).toArray()) if (doc.legacyId) patientPrescriptions.set(String(doc.legacyId), doc);

  async function importRows(file, collection, idField, mapper) {
    let imported = 0;
    let unresolvedMedicaments = 0;
    let operations = [];
    for (const row of read(file)) {
      const legacyId = String(row[idField] || '').trim();
      if (!legacyId) continue;
      const document = mapper(row);
      if ('IDMEDICAMENT' in document && !document.IDMEDICAMENT) unresolvedMedicaments++;
      if (!dryRun) operations.push({ updateOne: { filter: { legacyId }, update: { $setOnInsert: { legacyId, ...document, entrepriseId, createdAt: now, updatedAt: now } }, upsert: true } });
      imported++;
      if (operations.length === 500) {
        await db.collection(collection).bulkWrite(operations, { ordered: false });
        operations = [];
      }
    }
    if (operations.length) await db.collection(collection).bulkWrite(operations, { ordered: false });
    return { imported, unresolvedMedicaments };
  }

  const fournisseurs = await importRows('FOURNISSEUR', 'fournisseurs', 'IDFOURNISSEUR', row => ({
    Nom: row.NOMPREN, Contact: row.NOMPREN, Telephone: row['Téléphone'] || row.Portable, Email: row.Mail,
    Adresse: row['AdresseGéo'] || row.AdresseP, Observations: row.Observation, Actif: true, DateCreationLegacy: parseDate(row['CréerLe']), CreeParLegacy: row['CréerPar'],
  }));

  const stocks = await importRows('Stock', 'stocks', 'IDDSTOCK', row => ({
    Reference: row.Reference, QteEnStock: toNumber(row.QteEnStock), QteStockVirtuel: toNumber(row.QteStockVirtuel),
    QteMinimum: toNumber(row.StocArlete), QteMaximum: toNumber(row.StocAleteax), AuteurModif: row.AuteurModif,
    DateModif: parseDate(row.DateModif), Medicament: row.Medicament, IDMEDICAMENT: medicinesByLegacy.get(String(row.IDMEDICAMENT)),
    DatePeremptionLegacy: parseDate(row.Peromption),
  }));

  const entrees = await importRows('EntreeStock', 'entreestocks', 'IDEntree', row => ({
    DateAppro: parseDate(row.DateAppro), Quantite: toNumber(row.Quantite), PrixAchat: toNumber(row.PrixAchat), PRIXTHT: toNumber(row.PRIXTHT),
    TVAEntree: toNumber(row.TVAEntree), MontantTTCE: toNumber(row.MontantTTCE), SaisiPar: row.SaisiPar, SaisiLe: parseDate(row.SaisiLe),
    Observations: row.Observations, Reference: row.Reference, PrixVente: toNumber(row.PrixVente), Medicament: row.Medicament,
    IDMEDICAMENT: medicinesByLegacy.get(String(row.IDMEDICAMENT)), QteMinimum: toNumber(row.StocArlete), QteMaximum: toNumber(row.StocAleteax),
    DatePeremption: parseDate(row.Peromption), IDFOURNISSEUR_LEGACY: String(row.IDFOURNISSEUR || ''), IDAPPRO_LEGACY: String(row.IDAppro || ''),
  }));

  const sorties = await importRows('SortieStock', 'sortiestocks', 'IDSORTIE', row => {
    const patientPrescription = patientPrescriptions.get(String(row.IDPATIENTPRESCRIT));
    return {
      DateSortie: parseDate(row.DateSortie), Reference: row.Reference, Quantite: toNumber(row.Quantite), Prix_unitaire: toNumber(row.Prix_unitaire),
      Prix_TotalS: toNumber(row.Prix_TotalS), Motif: row.Motif, Observations: row.Observations, SaisiPar: row.SaisiPar,
      SaisiLe: parseDate(row.SaisiLe), ArticleS: row.ArticleS, TypeMouvement: row.Motif, IDMEDICAMENT: medicinesByReference.get(String(row.Reference || '').trim().toLowerCase()),
      Prescription: prescriptions.get(String(row.IDPRESCRIPTION)), Patient: patientPrescription?.IdPatient && mongoose.isValidObjectId(patientPrescription.IdPatient) ? new mongoose.Types.ObjectId(patientPrescription.IdPatient) : undefined,
      IDPATIENTPRESCRIT_LEGACY: String(row.IDPATIENTPRESCRIT || ''),
    };
  });

  console.log({ dryRun, fournisseurs, stocks, entrees, sorties });
  await mongoose.disconnect();
}

main().catch(error => { console.error(error); process.exit(1); });
