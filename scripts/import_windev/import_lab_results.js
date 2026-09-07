const path = require('path');
const xlsx = require('xlsx');
const mongoose = require('mongoose');
const { rtfToText } = require('./rtf');
const { toNumber, toBoolean } = require('./mapping');

const args = process.argv.slice(2);
const option = name => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
const uri = option('--uri') || process.env.MONGODB_URI;
const dir = option('--dir');
const dryRun = args.includes('--dryRun');
const entrepriseId = process.env.ENTREPRISE_ID || undefined;
const normalize = value => rtfToText(value).trim();
const key = (...values) => values.map(value => normalize(value).toLocaleLowerCase('fr')).join('|');

function read(name) {
  const workbook = xlsx.readFile(path.join(dir, `${name}.xlsx`), { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const headers = data[0].map(String);
  return data.slice(1).map(row => Object.fromEntries(headers.map((header, index) => [header, typeof row[index] === 'string' ? rtfToText(row[index]) : row[index]])));
}

async function main() {
  if (!uri || !dir) throw new Error('MONGODB_URI et --dir sont requis');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const now = new Date();

  const familyMap = new Map();
  for (const doc of await db.collection('familleactes').find({}).toArray()) if (doc.legacyId) familyMap.set(String(doc.legacyId), doc._id);

  const patientMap = new Map();
  for (const doc of await db.collection('patients').find({}, { projection: { _legacyId: 1, legacyId: 1 } }).toArray()) {
    const legacyId = doc._legacyId || doc.legacyId;
    if (legacyId) patientMap.set(String(legacyId), doc._id.toString());
  }

  const acteByName = new Map();
  for (const doc of await db.collection('actecliniques').find({}, { projection: { designationacte: 1 } }).toArray()) acteByName.set(key(doc.designationacte), doc._id);
  const acteMap = new Map();
  for (const row of read('Acte')) {
    const acteId = acteByName.get(key(row.Designation));
    if (acteId) acteMap.set(String(row.IDACTEP), acteId);
  }

  const lineByComposite = new Map();
  for (const doc of await db.collection('ligneprestations').find({}, { projection: { CodePrestation: 1, prestation: 1, IdPatient: 1 } }).toArray()) {
    const composite = key(doc.CodePrestation, doc.prestation, doc.IdPatient);
    if (!lineByComposite.has(composite)) lineByComposite.set(composite, []);
    lineByComposite.get(composite).push(doc._id);
  }
  const lineMap = new Map();
  const usedLines = new Set();
  for (const row of read('LIGNE_PRESTATION')) {
    const patientId = patientMap.get(String(row.IDPARTIENT));
    const candidates = lineByComposite.get(key(row.Code_Prestation, row.Prestation, patientId)) || [];
    const match = candidates.find(id => !usedLines.has(id.toString())) || candidates[0];
    if (match) {
      lineMap.set(String(row.IDLIGNE_PRESTATION), match);
      usedLines.add(match.toString());
    }
  }

  const hospitalByComposite = new Map();
  for (const doc of await db.collection('examenhospitalisations').find({}, { projection: { CodePrestation: 1, IdPatient: 1 } }).toArray()) hospitalByComposite.set(key(doc.CodePrestation, doc.IdPatient), doc._id);
  const hospitalMap = new Map();
  for (const row of read('EXAMENS_HOSPITALISATION')) {
    const patientId = patientMap.get(String(row.IDPARTIENT));
    const match = hospitalByComposite.get(key(row.Code_Prestation, patientId));
    if (match) hospitalMap.set(String(row.IDHOSPITALISATION), match);
  }

  const paramMap = new Map();
  let parameters = 0;
  for (const row of read('PARAM_LABO')) {
    const legacyId = String(row.IDPARAM_LABO || '');
    if (!legacyId) continue;
    const document = {
      legacyId, NUM_PARAM: toNumber(row.NUM_PARAM), ParamAbrege: normalize(row.ParamAbrege), Param_designation: normalize(row.Param_designation),
      PlageRefMinNe: toNumber(row.PlageRefMinNe), PlageRefMaxNé: toNumber(row['PlageRefMaxNé']), UnitéParam: normalize(row['UnitéParam']),
      IDFAMILLE_ACTE_BIOLOGIE: familyMap.get(String(row.IDFAMILLE_ACTE_BIOLOGIE)), PlageMinMaxNé: normalize(row['PlageMinMaxNé']),
      PlageMinEnfant: toNumber(row.PlageMinEnfant), PlageMaxEnfant: toNumber(row.PlageMaxEnfant), PlageMinMaxEnfant: normalize(row.PlageMinMaxEnfant),
      PLageMinFemme: toNumber(row.PLageMinFemme), PlageMaxFemme: toNumber(row.PlageMaxFemme), PlageMinMaxFemme: normalize(row.PlageMinMaxFemme),
      PlageMinHomme: toNumber(row.PlageMinHomme), PlageMaxHomme: toNumber(row.PlageMaxHomme), PlageMinMaxHomme: normalize(row.PlageMinMaxHomme),
      ValeurNormale: normalize(row.ValeurNormale), ValeurMinNormale: toNumber(row.ValeurMinNormale), ValeurMaxNormale: toNumber(row.ValeurMaxNormale),
      TypeTexte: toBoolean(row.TypeTexte), entrepriseId, createdAt: now, updatedAt: now,
    };
    if (dryRun) paramMap.set(legacyId, new mongoose.Types.ObjectId());
    else {
      const result = await db.collection('paramlabos').findOneAndUpdate({ legacyId }, { $setOnInsert: document }, { upsert: true, returnDocument: 'after' });
      paramMap.set(legacyId, result._id);
    }
    parameters++;
  }

  let results = 0;
  let unresolvedLines = 0;
  let operations = [];
  for (const row of read('RESULTAT_LIGNE_PRESTATION')) {
    const legacyId = String(row.IDRESULTATLIGNE || '');
    if (!legacyId) continue;
    const lineId = lineMap.get(String(row.IDLIGNE_PRESTATION));
    if (!lineId && toNumber(row.IDLIGNE_PRESTATION)) unresolvedLines++;
    const document = {
      legacyId, ParamAbrege: normalize(row.ParamAbrege), Param_designation: normalize(row.Param_designation), ValeurMinNormale: toNumber(row.PlageMin),
      ValeurMaxNormale: toNumber(row.PlageMax), ValeurNormale: normalize(row.ValeurNormale), ChampResultat: normalize(row.ChampResultat),
      IDPARAM_LABO: paramMap.get(String(row.IDPARAM_LABO)), IDLIGNE_PRESTATION: lineId, IDACTEP: acteMap.get(String(row.IDACTEP)),
      idHospitalisation: hospitalMap.get(String(row.IDHOSPITALISATION)), IDFAMILLE_ACTE_BIOLOGIE: familyMap.get(String(row.IDFAMILLE_ACTE_BIOLOGIE)),
      ACTE: normalize(row.ACTE), Interpretation: normalize(row.Interpretation), ProvenanceExamen: normalize(row.ProvenanceExamen),
      Externe_Interne: normalize(row.Externe_Interne), NIdentificationExamen: normalize(row.NIdentificationExamen), TypeTexte: toBoolean(row.TypeTexte),
      AlignerActe: toNumber(row.AlignerActe), unite: normalize(row.unite), ORdonnacementAffichage: toNumber(row.ORdonnacementAffichage),
      entrepriseId, createdAt: now, updatedAt: now,
    };
    if (!dryRun) operations.push({ updateOne: { filter: { legacyId }, update: { $setOnInsert: document }, upsert: true } });
    results++;
    if (operations.length === 1000) {
      await db.collection('resultatligneprestations').bulkWrite(operations, { ordered: false });
      operations = [];
    }
  }
  if (operations.length) await db.collection('resultatligneprestations').bulkWrite(operations, { ordered: false });

  // Import des liens Acte <-> Paramètre Labo
  let acteParamLaboOperations = [];
  let acteParamLabos = 0;
  let unresolvedActeParams = 0;
  for (const row of read('ACTE_PARAM_LABO')) {
    const legacyId = String(row.IDACTE_PARAMLABO || '').trim();
    if (!legacyId) continue;
    const idParam = paramMap.get(String(row.IDPARAM_LABO));
    const idActe = acteMap.get(String(row.IDACTEP));
    if (!idParam || !idActe) {
      unresolvedActeParams++;
      continue;
    }
    const document = {
      legacyId,
      IDPARAM_LABO: idParam,
      IDACTEP: idActe,
      PlageMaxEnfant: toNumber(row.PlageMaxEnfant),
      PlageMinEnfant: toNumber(row.PlageMinEnfant),
      PlageMinMaxEnfant: normalize(row.PlageMinMaxEnfant),
      PLageMinFemme: toNumber(row.PLageMinFemme),
      PlageMaxFemme: toNumber(row.PlageMaxFemme),
      PlageMinMaxFemme: normalize(row.PlageMinMaxFemme),
      PlageMinHomme: toNumber(row.PlageMinHomme),
      PlageMaxHomme: toNumber(row.PlageMaxHomme),
      PlageMinMaxHomme: normalize(row.PlageMinMaxHomme),
      PlageMinMaxNé: normalize(row.PlageMinMaxNé),
      PlageRefMinNe: toNumber(row.PlageRefMinNe),
      PlageRefMaxNé: toNumber(row.PlageRefMaxNé),
      NUM_PARAM: toNumber(row.NUM_PARAM),
      Param_designation: normalize(row.Param_designation),
      ParamAbrege: normalize(row.ParamAbrege),
      UnitéParam: normalize(row.UnitéParam),
      ValeurNormale: normalize(row.ValeurNormale),
      ValeurMinNormale: toNumber(row.ValeurMinNormale),
      ValeurMaxNormale: toNumber(row.ValeurMaxNormale),
      TypeTexte: toBoolean(row.TypeTexte),
      entrepriseId,
      createdAt: now,
      updatedAt: now,
    };
    if (!dryRun) acteParamLaboOperations.push({ updateOne: { filter: { legacyId }, update: { $setOnInsert: document }, upsert: true } });
    acteParamLabos++;
    if (acteParamLaboOperations.length === 500) {
      await db.collection('acteparamlabos').bulkWrite(acteParamLaboOperations, { ordered: false });
      acteParamLaboOperations = [];
    }
  }
  if (acteParamLaboOperations.length) await db.collection('acteparamlabos').bulkWrite(acteParamLaboOperations, { ordered: false });

  console.log({ dryRun, parameters, results, resolvedLines: lineMap.size, unresolvedLines, resolvedHospitalisations: hospitalMap.size, resolvedActes: acteMap.size, acteParamLabos, unresolvedActeParams });
  await mongoose.disconnect();
}

main().catch(error => { console.error(error); process.exit(1); });
