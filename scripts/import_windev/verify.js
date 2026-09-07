const mongoose = require('mongoose');
const uri = process.argv[2] || process.env.MONGODB_URI;

async function main() {
  await mongoose.connect(uri);

  const collections = {
    patients: 'patients',
    consultations: 'consultations',
    facturations: 'facturations',
    encaissementcaisses: 'encaissementcaisses',
    examenhospitalisations: 'examenhospitalisations',
    ligneprestations: 'ligneprestations',
    assurances: 'assurances',
  };

  const counts = {};
  for (const [key, coll] of Object.entries(collections)) {
    counts[key] = await mongoose.connection.db.collection(coll).estimatedDocumentCount();
  }

  const patientWithRelations = await mongoose.connection.db.collection('patients').findOne();
  const patientId = patientWithRelations._id;
  const codeDossier = patientWithRelations.Code_dossier;
  const name = `${patientWithRelations.Nom} ${patientWithRelations.Prenoms}`;

  const consultations = await mongoose.connection.db.collection('consultations').find({ IdPatient: patientId }).toArray();
  const facturations = await mongoose.connection.db.collection('facturations').find({ IdPatient: patientId }).toArray();
  const examens = await mongoose.connection.db.collection('examenhospitalisations').find({ IdPatient: patientId }).toArray();
  const lignes = await mongoose.connection.db.collection('ligneprestations').find({ IdPatient: patientId }).toArray();
  const encaissements = await mongoose.connection.db.collection('encaissementcaisses').find({ IdPatient: String(patientId) }).toArray();

  console.log('Compteurs:', counts);
  console.log('\nPatient exemple:', name, '(', codeDossier, ')');
  console.log('  consultations:', consultations.length);
  console.log('  facturations:', facturations.length);
  console.log('  examens hospitalisation:', examens.length);
  console.log('  lignes prestation:', lignes.length);
  console.log('  encaissements caisse:', encaissements.length);

  // Vérifier quelques liens idHospitalisation/idFacturation des lignes
  const ligne = await mongoose.connection.db.collection('ligneprestations').findOne({ idHospitalisation: { $ne: null } });
  console.log('\nLigne liée à un examen hospitalisation:', ligne ? 'OUI' : 'AUCUNE');
  if (ligne) {
    const hospit = await mongoose.connection.db.collection('examenhospitalisations').findOne({ _id: ligne.idHospitalisation });
    console.log('  -> Examen trouvé:', hospit ? 'OUI' : 'NON');
  }

  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
