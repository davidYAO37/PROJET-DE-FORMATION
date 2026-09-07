const path = require('path');
const xlsx = require('xlsx');
const mongoose = require('mongoose');
const { parseDate, toNumber, toBoolean } = require('./mapping');
const { rtfToText } = require('./rtf');

const args = process.argv.slice(2);
const value = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const dir = value('--dir');
const uri = value('--uri') || process.env.MONGODB_URI;
const dryRun = args.includes('--dryRun');
const referencesOnly = args.includes('--referencesOnly');
const skipReferences = args.includes('--skipReferences');
const entrepriseId = process.env.ENTREPRISE_ID || undefined;

function rows(name) {
  const workbook = xlsx.readFile(path.join(dir, `${name}.xlsx`), { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const headers = data[0].map(String);
  return data.slice(1).map(row => Object.fromEntries(headers.map((h, i) => [h, typeof row[i] === 'string' ? rtfToText(row[i]) : row[i]])));
}

function oid(value) {
  return value ? new mongoose.Types.ObjectId(value) : undefined;
}

async function upsert(collection, filter, document) {
  if (dryRun) return { _id: new mongoose.Types.ObjectId(), inserted: true };
  const { createdAt, ...fields } = document;
  const result = await collection.findOneAndUpdate(
    filter,
    { $set: fields, $setOnInsert: { createdAt } },
    { upsert: true, returnDocument: 'after' },
  );
  return { _id: result._id, inserted: result.createdAt?.getTime?.() === result.updatedAt?.getTime?.() };
}

async function main() {
  if (!uri || !dir) throw new Error('MONGODB_URI et --dir sont requis');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const now = new Date();
  const counts = {};
  const maps = {
    patient: new Map(), patientCode: new Map(), assurance: new Map(), typeActe: new Map(), famille: new Map(),
    medecin: new Map(), medicament: new Map(), prescription: new Map(), facturation: new Map(), hospitalisation: new Map(),
  };

  for (const p of await db.collection('patients').find({}, { projection: { _legacyId: 1, legacyId: 1, Code_dossier: 1 } }).toArray()) {
    const id = p._legacyId || p.legacyId;
    if (id) {
      maps.patient.set(String(id), p._id.toString());
      maps.patientCode.set(String(id), String(p.Code_dossier || ''));
    }
  }
  for (const a of await db.collection('assurances').find({}, { projection: { codeassurance: 1 } }).toArray()) maps.assurance.set(String(a.codeassurance), a._id.toString());
  for (const f of await db.collection('facturations').find({}, { projection: { legacyId: 1 } }).toArray()) if (f.legacyId) maps.facturation.set(String(f.legacyId), f._id.toString());
  for (const p of await db.collection('prescriptions').find({}, { projection: { legacyId: 1 } }).toArray()) if (p.legacyId) maps.prescription.set(String(p.legacyId), p._id.toString());
  for (const h of await db.collection('examenhospitalisations').find({}, { projection: { legacyId: 1 } }).toArray()) if (h.legacyId) maps.hospitalisation.set(String(h.legacyId), h._id.toString());
  for (const m of await db.collection('medecins').find({}, { projection: { legacyId: 1 } }).toArray()) if (m.legacyId) maps.medecin.set(String(m.legacyId), m._id.toString());
  for (const m of await db.collection('pharmacies').find({}, { projection: { legacyId: 1 } }).toArray()) if (m.legacyId) maps.medicament.set(String(m.legacyId), m._id.toString());

  const importSimple = async (name, collectionName, idField, mapper, map, filterBuilder) => {
    let imported = 0, skipped = 0;
    for (const row of rows(name)) {
      const legacyId = String(row[idField] || '').trim();
      const doc = mapper(row);
      if (!legacyId || !doc) { skipped++; continue; }
      const filter = filterBuilder ? filterBuilder(legacyId, doc) : { legacyId };
      const result = await upsert(db.collection(collectionName), filter, { ...doc, legacyId, entrepriseId, createdAt: now, updatedAt: now });
      map?.set(legacyId, result._id.toString());
      imported++;
    }
    counts[name] = { imported, skipped };
  };

  if (!skipReferences) {
    await importSimple(
      'TYPE_ACTE',
      'typeactes',
      'IDTYPE_ACTE',
      r => ({ Designation: String(r.Designation || '').trim(), Hospitalisation: toBoolean(r.ActeHospitalise) }),
      maps.typeActe,
      (legacyId, doc) => ({ $or: [{ legacyId }, { Designation: doc.Designation }] }),
    );
    await importSimple('FAMILLE_ACTE_BIOLOGIE', 'familleactes', 'IDFAMILLE_ACTE_BIOLOGIE', r => ({ Description: String(r.DESCRIPTION || '') }), maps.famille);
    await importSimple('MEDECIN', 'medecins', 'IDMEDECIN', r => {
      const full = String(r.Nom || '').trim();
      if (!full) return null;
      const parts = full.split(/\s+/);
      return { nom: parts.shift() || '(non renseigné)', prenoms: parts.join(' ') || '(non renseigné)', specialite: r.Specialite, EmailMed: '', Contact: r.Contact, TauxHonoraire: toNumber(r.TauxHonoraire), TauxPrescription: toNumber(r.TauxPrescription), TauxExecution: toNumber(r['TauxExécution']), TauxAnesthesiste: toNumber(r['TauxAnesthésiste']), TauxAideOperatoire: toNumber(r['TauxAideOpératoire']) };
    }, maps.medecin);
    await importSimple('SOCIETEASSUANCE', 'societeassurances', 'IDSOCIETEASSUANCE', r => ({ Designation: String(r.SOCIETE_PATIENT || ''), IDASSURANCE: oid(maps.assurance.get(String(r.IDASSURANCE))) }), null);
    await importSimple('SOCIETE_PARTENAIRE', 'societepartenaires', 'IDSOCIETEPARTENAIRE', r => ({ Designation: String(r.Designation || '') }), null);
    await importSimple('PHARMACIE', 'pharmacies', 'IDMEDICAMENT', r => {
      if (!r.Designation) return null;
      return { Reference: String(r.Reference || ''), Designation: String(r.Designation), PrixAchat: toNumber(r.Prix), PrixVente: toNumber(r.PrixVente), TypeArticle: 'PHARMACIE', Ajouter: parseDate(r.Ajouter), IDFOURNISSEUR_LEGACY: String(r.IDFOURNISSEUR || ''), IDFAMILLE_LEGACY: String(r.IDFamille || '') };
    }, maps.medicament);
  }

  if (referencesOnly) {
    console.log(JSON.stringify({ dryRun, referencesOnly, counts }, null, 2));
    await mongoose.disconnect();
    return;
  }

  const patientPrescriptionRows = rows('PARTIENT_PRESCRIPTION');
  const patientByPrescription = new Map();
  for (const r of patientPrescriptionRows) if (r.IDPRESCRIPTION && r.IDPARTIENT) patientByPrescription.set(String(r.IDPRESCRIPTION), String(r.IDPARTIENT));

  await importSimple('PRESCRIPTION', 'prescriptions', 'IDPRESCRIPTION', r => {
    const legacyPrescription = String(r.IDPRESCRIPTION || '');
    const patientId = maps.patient.get(patientByPrescription.get(legacyPrescription));
    return { Designation: r.Designation, CodePrestation: r.Code_Prestation, PatientP: r.PatientP, IdPatient: oid(patientId), DatePres: parseDate(r.DatePres), SaisiPar: r.SaisiPar, Rclinique: r.Rclinique, Montanttotal: toNumber(r.Montanttotal), Taux: toNumber(r.Taux), PartAssurance: toNumber(r.PartAssuranceP), PartAssure: toNumber(r['Partassuré']), Remise: toNumber(r.REMISE), MotifRemise: r.MotifRemise, Assurance: r.Assuance, IDASSURANCE: oid(maps.assurance.get(String(r.IDASSURANCE))), MontantRecu: toNumber(r.MontantRecu), Restapayer: toNumber(r.Restapayer), IDMEDECIN: oid(maps.medecin.get(String(r.IDMEDECIN))), NomMed: r.NomMed, StatutFacture: toBoolean(r.StatutFacture), Numfacture: r.Numfacture, NumBon: r.NumBon, Numcarte: r.Numcarte, Modepaiement: r.Modepaiement, Souscripteur: r.Souscripteur, StatutPaiement: r.StatutPaiement, Ordonnerlannulation: toNumber(r.Ordonnerlannulation), AnnulationOrdonneLe: parseDate(r.AnnulationOrdonneLe), AnnulationOrdonnePar: r.annulationOrdonnepar, IDSOCIETEASSURANCE: String(r.IDSOCIETEASSUANCE || ''), SOCIETE_PATIENT: r.SOCIETE_PATIENT, StatuPrescriptionMedecin: toNumber(r.StatuPrescriptionMedecin), Payéoupas: toBoolean(r['Payéoupas']), Payele: String(r.Payele || ''), Heure: String(r.Heure || ''), TotalapayerPatient: toNumber(r.TotalapayerPatient), IDpriseCharge: String(r.IDpriseCharge || ''), Caissiere: r.Caissiere };
  }, maps.prescription);

  let imported = 0, skipped = 0, unresolvedPatients = 0, unresolvedMedicaments = 0;
  for (const r of patientPrescriptionRows) {
    const legacyId = String(r.IDPATIENTPRESCRIT || '').trim();
    const patientId = maps.patient.get(String(r.IDPARTIENT));
    const medicamentId = maps.medicament.get(String(r.IDMEDICAMENT));
    if (!legacyId || !patientId) { skipped++; unresolvedPatients++; continue; }
    if (!medicamentId) unresolvedMedicaments++;
    await upsert(db.collection('patientprescriptions'), { legacyId }, {
      legacyId, IDPRESCRIPTION: maps.prescription.get(String(r.IDPRESCRIPTION)) || String(r.IDPRESCRIPTION || ''),
      PatientP: '', IdPatient: patientId, QteP: toNumber(r['QtéP']), posologie: String(r.Posologie || ''),
      DatePres: parseDate(r.DatePres), heureFacturation: String(r.Heure_Facturation || ''), prixUnitaire: toNumber(r.prixunitaire),
      prixTotal: toNumber(r.PrixTotal), nomMedicament: String(r.nomMedicament || ''), partAssurance: toNumber(r.PartAssurance),
      partAssure: toNumber(r['Partassuré']), CodePrestation: String(r.Code_Prestation || ''), medicament: oid(medicamentId),
      priseCharge: toNumber(r.IDpriseCharge), reference: String(r.Reference || ''), exclusionActe: String(r.ExclusionActae || ''),
      StatutPrescriptionMedecin: toNumber(r.StatuPrescriptionMedecin), actePayeCaisse: String(r.ACTEPAYECAISSE || ''),
      payeLe: parseDate(r.Payele), payePar: r['PayéPar'], datePaiement: parseDate(r.DatePaiement), heure: String(r.Heure || ''),
      facturation: oid(maps.facturation.get(String(r.IDFACTURATION))), IDSOCIETEASSURANCE: String(r.IDSOCIETEASSUANCE || ''),
      SOCIETE_PATIENT: r.SOCIETE_PATIENT, entrepriseId, createdAt: now, updatedAt: now,
    });
    imported++;
  }
  counts.PARTIENT_PRESCRIPTION = { imported, skipped, unresolvedPatients, unresolvedMedicaments };

  let reconciledFacturations = 0;
  const facturationOperations = [];
  for (const row of rows('FACTURATION')) {
    const facturationId = maps.facturation.get(String(row.IDFACTURATION || ''));
    if (!facturationId) continue;
    const update = {
      Code_dossier: maps.patientCode.get(String(row.IDPARTIENT || '')) || '',
    };
    const prescriptionId = maps.prescription.get(String(row.IDPRESCRIPTION || ''));
    const hospitalisationId = maps.hospitalisation.get(String(row.IDHOSPITALISATION || ''));
    if (prescriptionId) update.IDPRESCRIPTION = oid(prescriptionId);
    if (hospitalisationId) update.idHospitalisation = oid(hospitalisationId);
    facturationOperations.push({ updateOne: { filter: { _id: oid(facturationId) }, update: { $set: update } } });
  }
  if (dryRun) {
    reconciledFacturations = facturationOperations.length;
  } else if (facturationOperations.length) {
    const result = await db.collection('facturations').bulkWrite(facturationOperations, { ordered: false });
    reconciledFacturations = result.modifiedCount;
  }
  counts.FACTURATION_RELATIONS = { candidates: facturationOperations.length, updated: reconciledFacturations };

  console.log(JSON.stringify({ dryRun, counts }, null, 2));
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
