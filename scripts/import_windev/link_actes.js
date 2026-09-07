const mongoose = require('mongoose');
const uri = process.argv[2] || process.env.MONGODB_URI;

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const actes = await db.collection('actecliniques').find({}, { projection: { designationacte: 1 } }).toArray();
  const acteByName = new Map(actes.map(a => [String(a.designationacte || '').trim().toLocaleLowerCase('fr'), a._id]));
  const cursor = db.collection('ligneprestations').find({ $or: [{ idActe: null }, { idActe: { $exists: false } }] }, { projection: { prestation: 1 } });
  let matched = 0;
  let unresolved = 0;
  let operations = [];

  for await (const line of cursor) {
    const acteId = acteByName.get(String(line.prestation || '').trim().toLocaleLowerCase('fr'));
    if (!acteId) {
      unresolved++;
      continue;
    }
    operations.push({ updateOne: { filter: { _id: line._id }, update: { $set: { idActe: acteId } } } });
    if (operations.length === 1000) {
      const result = await db.collection('ligneprestations').bulkWrite(operations, { ordered: false });
      matched += result.modifiedCount;
      operations = [];
    }
  }

  if (operations.length) {
    const result = await db.collection('ligneprestations').bulkWrite(operations, { ordered: false });
    matched += result.modifiedCount;
  }

  console.log(`Lignes liées à un acte : ${matched}`);
  console.log(`Lignes sans acte correspondant : ${unresolved}`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
