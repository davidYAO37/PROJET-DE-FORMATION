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

function file(name) {
  const normalized = `${name}.xlsx`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const match = fs.readdirSync(dir).find(item => item.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === normalized);
  if (!match) throw new Error(`Fichier absent: ${name}.xlsx`);
  return path.join(dir, match);
}

function read(name) {
  const workbook = xlsx.readFile(file(name), { cellDates: true });
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
  const maps = { medecin: new Map(), honoraire: new Map(), acte: new Map(), famille: new Map(), societe: new Map() };
  for (const [collection, map] of [['medecins', maps.medecin], ['honorairemeds', maps.honoraire], ['familleactes', maps.famille], ['societepartenaires', maps.societe]]) {
    for (const doc of await db.collection(collection).find({}, { projection: { legacyId: 1 } }).toArray()) if (doc.legacyId) map.set(String(doc.legacyId), doc._id);
  }
  const acteByName = new Map();
  for (const doc of await db.collection('actecliniques').find({}, { projection: { designationacte: 1 } }).toArray()) acteByName.set(String(doc.designationacte || '').trim().toLowerCase(), doc._id);
  for (const row of read('Acte')) {
    const match = acteByName.get(String(row.Designation || '').trim().toLowerCase());
    if (match) maps.acte.set(String(row.IDACTEP), match);
  }

  async function importRows(source, collection, idField, mapper, keyField = null) {
    let count = 0;
    let operations = [];
    for (const row of read(source)) {
      const legacyId = String(row[idField] || '').trim();
      if (!legacyId) continue;
      const doc = { legacyId, ...mapper(row), entrepriseId, createdAt: now, updatedAt: now };
      const filter = keyField && doc[keyField] !== undefined ? { [keyField]: doc[keyField] } : { legacyId };
      if (!dryRun) operations.push({ updateOne: { filter, update: { $setOnInsert: doc }, upsert: true } });
      count++;
      if (operations.length === 500) {
        try {
          await db.collection(collection).bulkWrite(operations, { ordered: false });
        } catch (err) {
          if (err.code === 11000) console.error(`  Doublon ignoré dans ${collection}:`, err.message);
          else throw err;
        }
        operations = [];
      }
    }
    if (operations.length) {
      try {
        await db.collection(collection).bulkWrite(operations, { ordered: false });
      } catch (err) {
        if (err.code === 11000) console.error(`  Doublon ignoré dans ${collection}:`, err.message);
        else throw err;
      }
    }
    return count;
  }

  const operations = await importRows('Operation', 'operations', 'IDOpération', row => ({ Libeleo: row.Libeleo, TYPEOP: row.TYPEOP }));
  const modesPaiement = await importRows('ModedePaiement', 'modedepaiements', 'IDModedePaiement', row => ({ Modepaiement: row.Modepaiement }));
  const parametresBiochimie = await importRows('PARAM_BIOCHIME', 'parambiochimies', 'IDPARAM_BIOCHIME', row => ({ CodeB: row.CodeB, LibelleB: row.LibelleB }), 'CodeB');
  const parametresNfs = await importRows('PARAMETRE_NFS', 'parametrenfs', 'IDPARAMETRE_NFS', row => ({ PARAMETRE: row.PARAMETRE, DESCRIPTION: row.DESCRIPTION }));
  const parametresCompteRendu = await importRows('Parametre_CRendu', 'parametrecrendus', 'IDParametre_CRendu', row => ({ LettreCle: row.LettreCle, Date: parseDate(row.Date), AjouterPar: row.AjouterPar, HeureAjoute: excelTime(row.HeureAjoute) }));
  const actesParametres = await importRows('Acte_Parametre', 'acteparametres', 'IDActe_Parametre', row => ({ Designation: row.Designation }));
  const actesPartenaires = await importRows('ACTE_SOCIETE_PARTENAIRE', 'actesocietepartenaires', 'IDACTEPARTENAIRE', row => ({
    IDSOCIETEPARTENAIRE: maps.societe.get(String(row.IDSOCIETEPARTENAIRE)), IDACTEP: maps.acte.get(String(row.IDACTEP)),
    LettreCle: row.LettreCle, Prix: toNumber(row.Prix), CoefficientActe: toNumber(row.CoefficientActe), PrixTotal: toNumber(row.PrixTotal),
    IDFAMILLE_ACTE_BIOLOGIE: maps.famille.get(String(row.IDFAMILLE_ACTE_BIOLOGIE)), IDTYPE_ACTE_LEGACY: String(row.IDTYPE_ACTE || ''), OrdonnacementAffichage: toNumber(row.OrdonnacementAffichage),
  }));
  const caisses = await importRows('CAISSE', 'caisses', 'IDCaisse', row => ({
    typeC: row.typeC, Operation: row.Operation, MOtif: row.MOtif, MOntantC: toNumber(row.MOntantC), dAteC: parseDate(row.dAteC),
    HeureC: excelTime(row.HeureC), NomPrenoms: row.NomPrenoms, Contact: row.Contact, serviceC: row.serviceC, solde: toNumber(row.solde),
    AjouterParC: row.AjouterParC, FonctionC: row.FonctionC, MODifieParC: row.MODifieParC, MODifLe: parseDate(row.MODifLe),
    IDOpération: toNumber(row['IDOpération']), IDHonoraireMed: maps.honoraire.get(String(row.IDHonoraireMed)), IDMEDECIN: maps.medecin.get(String(row.IDMEDECIN)),
  }));

  // Import des liens Acte <-> Paramètre Biochimie
  const paramBiochimieByCodeB = new Map();
  for (const doc of await db.collection('parambiochimies').find({}).toArray()) {
    if (doc.CodeB) paramBiochimieByCodeB.set(String(doc.CodeB), doc._id);
  }
  const biochimieRows = read('PARAM_BIOCHIME');
  const paramBiochimieMap = new Map();
  for (const row of biochimieRows) {
    const legacyId = String(row.IDPARAM_BIOCHIME || '').trim();
    const codeB = String(row.CodeB || '').trim();
    const paramId = paramBiochimieByCodeB.get(codeB);
    if (paramId) paramBiochimieMap.set(legacyId, paramId);
  }

  let acteParamBioOperations = [];
  let acteParamBiochimies = 0;
  let unresolvedActeBioParams = 0;
  for (const row of read('ACTE_PARAM_BIOCHIME')) {
    const idParam = paramBiochimieMap.get(String(row.IDPARAM_BIOCHIME));
    const idActe = maps.acte.get(String(row.IDACTEP));
    if (!idParam || !idActe) {
      unresolvedActeBioParams++;
      continue;
    }
    const legacyId = `${idActe}-${idParam}`;
    const document = {
      legacyId,
      IDPARAM_BIOCHIME: idParam,
      IDACTEP: idActe,
      param_designb: String(row.param_designb || '').trim(),
      entrepriseId,
      createdAt: now,
      updatedAt: now,
    };
    if (!dryRun) acteParamBioOperations.push({ updateOne: { filter: { legacyId }, update: { $setOnInsert: document }, upsert: true } });
    acteParamBiochimies++;
    if (acteParamBioOperations.length === 500) {
      await db.collection('acteparambiochimies').bulkWrite(acteParamBioOperations, { ordered: false });
      acteParamBioOperations = [];
    }
  }
  if (acteParamBioOperations.length) await db.collection('acteparambiochimies').bulkWrite(acteParamBioOperations, { ordered: false });

  console.log({ dryRun, operations, modesPaiement, parametresBiochimie, parametresNfs, parametresCompteRendu, actesParametres, actesPartenaires, caisses, acteParamBiochimies, unresolvedActeBioParams });
  await mongoose.disconnect();
}

main().catch(error => { console.error(error); process.exit(1); });
