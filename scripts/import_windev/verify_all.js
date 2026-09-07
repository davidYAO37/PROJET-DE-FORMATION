const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.argv[2];

async function checkRelation(label, childCollection, childField, parentCollection) {
  const total = await mongoose.connection.db.collection(childCollection).countDocuments();
  const withRef = await mongoose.connection.db.collection(childCollection).countDocuments({ [childField]: { $ne: null } });
  const orphans = await mongoose.connection.db.collection(childCollection).aggregate([
    { $match: { [childField]: { $ne: null } } },
    {
      $lookup: {
        from: parentCollection,
        localField: childField,
        foreignField: '_id',
        as: 'parent',
      },
    },
    { $match: { parent: { $size: 0 } } },
    { $count: 'orphans' },
  ]).toArray();

  const orphanCount = orphans.length ? orphans[0].orphans : 0;
  console.log(`${label}: ${withRef} lié(s) sur ${total} ; ${orphanCount} orphelin(s)`);
  return orphanCount;
}

async function main() {
  await mongoose.connect(uri);

  console.log('=== Compteurs ===');
  const collections = {
    patients: 'patients',
    consultations: 'consultations',
    facturations: 'facturations',
    encaissementcaisses: 'encaissementcaisses',
    examenhospitalisations: 'examenhospitalisations',
    ligneprestations: 'ligneprestations',
    assurances: 'assurances',
    actecliniques: 'actecliniques',
    tarifassurances: 'tarifassurances',
    prescriptions: 'prescriptions',
    patientprescriptions: 'patientprescriptions',
    pharmacies: 'pharmacies',
    medecins: 'medecins',
    typeactes: 'typeactes',
    familleactes: 'familleactes',
    societeassurances: 'societeassurances',
    societepartenaires: 'societepartenaires',
    paramlabos: 'paramlabos',
    resultatligneprestations: 'resultatligneprestations',
    affections: 'affections',
    diagnosticcodeaffections: 'diagnosticcodeaffections',
    documentfichepatients: 'documentfichepatients',
    observationhospits: 'observationhospits',
    biochimietraitements: 'biochimietraitements',
    nfstraitements: 'nfstraitements',
    hormonetraitements: 'hormonetraitements',
    vitessetraitements: 'vitessetraitements',
    fournisseurs: 'fournisseurs',
    stocks: 'stocks',
    entreestocks: 'entreestocks',
    sortiestocks: 'sortiestocks',
    honorairemeds: 'honorairemeds',
    lignehonorairemeds: 'lignehonorairemeds',
    factureassurs: 'factureassurs',
    facturerecaps: 'facturerecaps',
    lignefactures: 'lignefactures',
    caisses: 'caisses',
    operations: 'operations',
    modedepaiements: 'modedepaiements',
    parambiochimies: 'parambiochimies',
    parametrenfs: 'parametrenfs',
    parametrecrendus: 'parametrecrendus',
    acteparametres: 'acteparametres',
    actesocietepartenaires: 'actesocietepartenaires',
  };
  for (const [key, coll] of Object.entries(collections)) {
    const count = await mongoose.connection.db.collection(coll).estimatedDocumentCount();
    console.log(`${key}: ${count}`);
  }

  console.log('\n=== Cohérence des relations ===');
  let totalOrphans = 0;
  totalOrphans += await checkRelation('Consultation -> Patient', 'consultations', 'IdPatient', 'patients');
  totalOrphans += await checkRelation('Facturation -> Patient', 'facturations', 'IdPatient', 'patients');
  totalOrphans += await checkRelation('ExamenHospitalisation -> Patient', 'examenhospitalisations', 'IdPatient', 'patients');
  totalOrphans += await checkRelation('LignePrestation -> Patient', 'ligneprestations', 'IdPatient', 'patients');
  totalOrphans += await checkRelation('LignePrestation -> Facturation', 'ligneprestations', 'idFacturation', 'facturations');
  totalOrphans += await checkRelation('LignePrestation -> ExamenHospitalisation', 'ligneprestations', 'idHospitalisation', 'examenhospitalisations');
  totalOrphans += await checkRelation('LignePrestation -> ActeClinique', 'ligneprestations', 'idActe', 'actecliniques');
  totalOrphans += await checkRelation('TarifAssurance -> Assurance', 'tarifassurances', 'assurance', 'assurances');
  totalOrphans += await checkRelation('TarifAssurance -> ActeClinique', 'tarifassurances', 'acteId', 'actecliniques');
  totalOrphans += await checkRelation('Prescription -> Patient', 'prescriptions', 'IdPatient', 'patients');
  totalOrphans += await checkRelation('Prescription -> Assurance', 'prescriptions', 'IDASSURANCE', 'assurances');
  totalOrphans += await checkRelation('Prescription -> Medecin', 'prescriptions', 'IDMEDECIN', 'medecins');
  totalOrphans += await checkRelation('PatientPrescription -> Medicament', 'patientprescriptions', 'medicament', 'pharmacies');
  totalOrphans += await checkRelation('PatientPrescription -> Facturation', 'patientprescriptions', 'facturation', 'facturations');
  totalOrphans += await checkRelation('Résultat labo -> Paramètre', 'resultatligneprestations', 'IDPARAM_LABO', 'paramlabos');
  totalOrphans += await checkRelation('Résultat labo -> LignePrestation', 'resultatligneprestations', 'IDLIGNE_PRESTATION', 'ligneprestations');
  totalOrphans += await checkRelation('Résultat labo -> ActeClinique', 'resultatligneprestations', 'IDACTEP', 'actecliniques');
  totalOrphans += await checkRelation('Résultat labo -> Hospitalisation', 'resultatligneprestations', 'idHospitalisation', 'examenhospitalisations');
  totalOrphans += await checkRelation('Résultat labo -> FamilleActe', 'resultatligneprestations', 'IDFAMILLE_ACTE_BIOLOGIE', 'familleactes');
  totalOrphans += await checkRelation('Diagnostic -> Patient', 'diagnosticcodeaffections', 'IdPatient', 'patients');
  totalOrphans += await checkRelation('Diagnostic -> Consultation', 'diagnosticcodeaffections', 'Consultation', 'consultations');
  totalOrphans += await checkRelation('Diagnostic -> Affection', 'diagnosticcodeaffections', 'IDAFFECTION', 'affections');
  totalOrphans += await checkRelation('Document patient -> Patient', 'documentfichepatients', 'Patient', 'patients');
  totalOrphans += await checkRelation('Observation -> Patient', 'observationhospits', 'Patient', 'patients');
  totalOrphans += await checkRelation('Observation -> Hospitalisation', 'observationhospits', 'Hospitalisation', 'examenhospitalisations');
  totalOrphans += await checkRelation('Biochimie -> Médecin', 'biochimietraitements', 'IDMEDECIN', 'medecins');
  totalOrphans += await checkRelation('NFS -> FamilleActe', 'nfstraitements', 'IDFAMILLE_ACTE_BIOLOGIE', 'familleactes');
  totalOrphans += await checkRelation('Hormone -> FamilleActe', 'hormonetraitements', 'IDFAMILLE_ACTE_BIOLOGIE', 'familleactes');
  totalOrphans += await checkRelation('Vitesse -> FamilleActe', 'vitessetraitements', 'IDFAMILLE_ACTE_BIOLOGIE', 'familleactes');
  totalOrphans += await checkRelation('Stock -> Médicament', 'stocks', 'IDMEDICAMENT', 'pharmacies');
  totalOrphans += await checkRelation('Entrée stock -> Médicament', 'entreestocks', 'IDMEDICAMENT', 'pharmacies');
  totalOrphans += await checkRelation('Sortie stock -> Médicament', 'sortiestocks', 'IDMEDICAMENT', 'pharmacies');
  totalOrphans += await checkRelation('Sortie stock -> Prescription', 'sortiestocks', 'Prescription', 'prescriptions');
  totalOrphans += await checkRelation('Sortie stock -> Patient', 'sortiestocks', 'Patient', 'patients');
  totalOrphans += await checkRelation('Honoraire -> Médecin', 'honorairemeds', 'Medecin', 'medecins');
  totalOrphans += await checkRelation('Ligne honoraire -> Médecin', 'lignehonorairemeds', 'Medecin', 'medecins');
  totalOrphans += await checkRelation('Ligne honoraire -> Honoraire', 'lignehonorairemeds', 'HonoraireMed', 'honorairemeds');
  totalOrphans += await checkRelation('Récap facture -> Facture assurance', 'facturerecaps', 'FactureAssur', 'factureassurs');
  totalOrphans += await checkRelation('Ligne facture -> Facture assurance', 'lignefactures', 'FactureAssur', 'factureassurs');
  totalOrphans += await checkRelation('Ligne facture -> Consultation', 'lignefactures', 'IDCONSULTATION', 'consultations');
  totalOrphans += await checkRelation('Ligne facture -> Prescription', 'lignefactures', 'IDPRESCRIPTION', 'prescriptions');
  totalOrphans += await checkRelation('Ligne facture -> Hospitalisation', 'lignefactures', 'idHospitalisation', 'examenhospitalisations');
  totalOrphans += await checkRelation('Caisse -> Honoraire', 'caisses', 'IDHonoraireMed', 'honorairemeds');
  totalOrphans += await checkRelation('Caisse -> Médecin', 'caisses', 'IDMEDECIN', 'medecins');
  totalOrphans += await checkRelation('Acte partenaire -> Société', 'actesocietepartenaires', 'IDSOCIETEPARTENAIRE', 'societepartenaires');
  totalOrphans += await checkRelation('Acte partenaire -> Acte', 'actesocietepartenaires', 'IDACTEP', 'actecliniques');
  totalOrphans += await checkRelation('Acte partenaire -> Famille', 'actesocietepartenaires', 'IDFAMILLE_ACTE_BIOLOGIE', 'familleactes');

  const invalidPatientPrescriptionLinks = await mongoose.connection.db.collection('patientprescriptions').aggregate([
    { $match: { IdPatient: { $type: 'string' } } },
    { $set: { patientObjectId: { $convert: { input: '$IdPatient', to: 'objectId', onError: null, onNull: null } } } },
    { $lookup: { from: 'patients', localField: 'patientObjectId', foreignField: '_id', as: 'patient' } },
    { $match: { patient: { $size: 0 } } },
    { $count: 'count' },
  ]).toArray();
  const invalidPatientPrescriptionCount = invalidPatientPrescriptionLinks[0]?.count || 0;
  totalOrphans += invalidPatientPrescriptionCount;
  console.log(`PatientPrescription -> Patient: ${invalidPatientPrescriptionCount} orphelin(s)`);

  const facturationsSansPrescription = await mongoose.connection.db.collection('facturations').countDocuments({
    typefacture: { $regex: /pharm/i },
    $or: [{ IDPRESCRIPTION: null }, { IDPRESCRIPTION: { $exists: false } }],
  });
  const facturationsSansHospitalisation = await mongoose.connection.db.collection('facturations').countDocuments({
    typefacture: { $regex: /hospital/i },
    $or: [{ idHospitalisation: null }, { idHospitalisation: { $exists: false } }],
  });
  const prestationsSansActe = await mongoose.connection.db.collection('ligneprestations').countDocuments({
    $or: [{ idActe: null }, { idActe: { $exists: false } }],
  });
  const facturationsNonSoldees = await mongoose.connection.db.collection('facturations').countDocuments({ Restapayer: { $gt: 0 } });
  const prescriptionsEnAttente = await mongoose.connection.db.collection('prescriptions').countDocuments({
    StatuPrescriptionMedecin: 2,
    Payéoupas: { $ne: true },
  });
  console.log('\n=== Cohérence métier ===');
  console.log(`Facturations pharmacie sans prescription : ${facturationsSansPrescription}`);
  console.log(`Facturations hospitalisation sans hospitalisation : ${facturationsSansHospitalisation}`);
  console.log(`Prestations sans acte : ${prestationsSansActe}`);
  console.log(`Facturations à solder : ${facturationsNonSoldees}`);
  console.log(`Prescriptions en attente de paiement : ${prescriptionsEnAttente}`);

  const encaissements = await mongoose.connection.db.collection('encaissementcaisses').find({}).limit(5).toArray();
  console.log('\n=== Exemple encaissements ===');
  encaissements.forEach(e => console.log(`- ${e.Patient || e.Designation} : ${e.Montantencaisse} (${e.Modepaiement})`));

  const lignes = await mongoose.connection.db.collection('ligneprestations').find({ idHospitalisation: { $ne: null } }).limit(5).toArray();
  console.log('\n=== Exemples lignes liées à un examen hospitalisation ===');
  lignes.forEach(l => console.log(`- ${l.prestation} (patient ${l.IdPatient})`));

  console.log(`\nTotal orphelins : ${totalOrphans}`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
