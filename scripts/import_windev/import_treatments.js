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

function automateDate(value) {
  const text = String(value || '').trim();
  if (/^\d{14}$/.test(text)) return new Date(`${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}T${text.slice(8, 10)}:${text.slice(10, 12)}:${text.slice(12, 14)}`);
  return parseDate(value);
}

async function main() {
  if (!uri || !dir) throw new Error('MONGODB_URI et --dir sont requis');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const now = new Date();
  const families = new Map();
  const medecins = new Map();
  for (const doc of await db.collection('familleactes').find({}, { projection: { legacyId: 1 } }).toArray()) if (doc.legacyId) families.set(String(doc.legacyId), doc._id);
  for (const doc of await db.collection('medecins').find({}, { projection: { legacyId: 1 } }).toArray()) if (doc.legacyId) medecins.set(String(doc.legacyId), doc._id);

  async function importRows(file, collection, idField, mapper) {
    let imported = 0;
    let operations = [];
    for (const row of read(file)) {
      const legacyId = String(row[idField] || '').trim();
      if (!legacyId) continue;
      const document = { legacyId, ...mapper(row), entrepriseId, createdAt: now, updatedAt: now };
      if (!dryRun) operations.push({ updateOne: { filter: { legacyId }, update: { $setOnInsert: document }, upsert: true } });
      imported++;
      if (operations.length === 1000) {
        await db.collection(collection).bulkWrite(operations, { ordered: false });
        operations = [];
      }
    }
    if (operations.length) await db.collection(collection).bulkWrite(operations, { ordered: false });
    return imported;
  }

  const biochimie = await importRows('BIOCHIMIE_TRAITEMENT', 'biochimietraitements', 'IDBIOCHIMIE_TRAITEMENT', row => ({
    type_echantillon: row.type_echantillon, cdbar: String(row.cdbar || ''), service: row.service, Sexe: row.Sexe,
    Age_partient: toNumber(row.Age_partient), date_analyse: String(row.date_analyse || ''), dateAnalyseNormalisee: automateDate(row.date_analyse),
    Diagnostic: row.Diagnostic, id_patient: String(row.id_patient || ''), date_naissance: parseDate(row.date_naissance),
    IDMEDECIN: medecins.get(String(row.IDMEDECIN)), chim: row.chim, resultat: String(row.resultat || ''), unite: row.unite,
    marque: row.marque, plage: row.plage, data: row.data, id_biochimie: String(row.id_biochimie || ''), CodePrestation: String(row.Code_Prestation || ''),
  }));

  const nfs = await importRows('NFS_TRAITEMENT', 'nfstraitements', 'IDNFS_TRAITEMENT', row => ({
    Patient_Nom: row.Patient_Nom, Patient_prenom: row.Patient_prenom, PatientP: row.PatientP, Patient_ages: String(row.Patient_ages || ''),
    Patient_Sexe: row.Patient_Sexe, Patient_numDossier: String(row.Patient_numDossier || ''), NumNFs: String(row.NumNFs || ''),
    NFS_dateAnalyse: parseDate(row.NFS_dateAnalyse), NFS_service: row.NFS_service, NFS_idEchantillon: String(row.NFS_idEchantillon || ''),
    diagnostiQ: row.diagnostiQ, NFS_status: String(row.NFS_status || ''), NFS_unite: row.NFS_unite, NFS_parametres: row.NFS_parametres,
    NFS_resultat: String(row.NFS_resultat || ''), NFS_plageRef: row.NFS_plageRef, NFS_id: toNumber(row.NFS_id),
    CodePrestation: String(row.Code_Prestation || ''), IDFAMILLE_ACTE_BIOLOGIE: families.get(String(row.IDFAMILLE_ACTE_BIOLOGIE)),
    CodeAscii: toNumber(row.CodeAscii), ValeurMaxNormale: toNumber(row.ValeurMaxNormale), ValeurMinNormale: toNumber(row.ValeurMinNormale), DejaUtilise: toBoolean(row.DejaUtilise),
  }));

  const hormones = await importRows('HORMONE_TRAITEMENT', 'hormonetraitements', 'IDHORMONE_TRAITEMENT', row => ({
    status: String(row.status || ''), donnees: row.donnees, dateHormone: parseDate(row.dateHormone), id: String(row.id || ''),
    numPatient: String(row.numPatient || ''), article: row.article, echantillon: String(row.echantillon || ''), CodePrestation: String(row.Code_Prestation || ''),
    IDFAMILLE_ACTE_BIOLOGIE: families.get(String(row.IDFAMILLE_ACTE_BIOLOGIE)), plagehormone: row.plagehormone,
    resultathor: String(row.resultathor || ''), Param_designation: row.Param_designation, unitehorm: row.unitehorm,
    CodeAscii: toNumber(row.CodeAscii), ValeurMinNormale: toNumber(row.ValeurMinNormale), ValeurMaxNormale: toNumber(row.ValeurMaxNormale), DejaUtilise: toBoolean(row.DejaUtilise),
  }));

  const vitesses = await importRows('VITESSE_TRAITEMENT', 'vitessetraitements', 'IDVITESSE_TRAITEMENT', row => ({
    parametres: row.parametres, resultat: String(row.resultat || ''), id: String(row.id || ''), unite: row.unite,
    dateVitesse: parseDate(row.dateVitesse), status: String(row.status || ''), CodePrestation: String(row.Code_Prestation || ''),
    IDFAMILLE_ACTE_BIOLOGIE: families.get(String(row.IDFAMILLE_ACTE_BIOLOGIE)), CodeAscii: toNumber(row.CodeAscii),
    ValeurMaxNormale: toNumber(row.ValeurMaxNormale), ValeurMinNormale: toNumber(row.ValeurMinNormale), DejaUtilise: toBoolean(row.DejaUtilise),
  }));

  console.log({ dryRun, biochimie, nfs, hormones, vitesses });
  await mongoose.disconnect();
}

main().catch(error => { console.error(error); process.exit(1); });
