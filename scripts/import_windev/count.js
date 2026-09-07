const mongoose = require('mongoose');
const uri = process.argv[2] || process.env.MONGODB_URI;

async function main() {
  await mongoose.connect(uri);
  const collections = ['patients', 'consultations', 'facturations', 'encaissementcaisses', 'examenhospitalisations', 'ligneprestations', 'assurances'];
  for (const coll of collections) {
    const count = await mongoose.connection.db.collection(coll).estimatedDocumentCount();
    console.log(`${coll}: ${count}`);
  }
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
