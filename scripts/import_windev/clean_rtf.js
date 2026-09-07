const mongoose = require('mongoose');
const { rtfToText } = require('./rtf');
const uri = process.argv[2] || process.env.MONGODB_URI;
const dryRun = process.argv.includes('--dryRun');

function clean(value) {
  if (typeof value === 'string') {
    const decoded = rtfToText(value);
    return { value: decoded, changed: decoded !== value };
  }
  if (Array.isArray(value)) {
    let changed = false;
    const result = value.map(item => {
      const cleaned = clean(item);
      changed ||= cleaned.changed;
      return cleaned.value;
    });
    return { value: result, changed };
  }
  if (value && typeof value === 'object' && !(value instanceof Date) && !Buffer.isBuffer(value) && value._bsontype !== 'ObjectId') {
    let changed = false;
    const result = {};
    for (const [key, item] of Object.entries(value)) {
      const cleaned = clean(item);
      changed ||= cleaned.changed;
      result[key] = cleaned.value;
    }
    return { value: result, changed };
  }
  return { value, changed: false };
}

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  let total = 0;

  for (const { name } of collections) {
    const cursor = db.collection(name).find({});
    let operations = [];
    let count = 0;
    for await (const document of cursor) {
      const cleaned = clean(document);
      if (!cleaned.changed) continue;
      count++;
      total++;
      if (!dryRun) operations.push({ replaceOne: { filter: { _id: document._id }, replacement: cleaned.value } });
      if (operations.length === 500) {
        await db.collection(name).bulkWrite(operations, { ordered: false });
        operations = [];
      }
    }
    if (operations.length) await db.collection(name).bulkWrite(operations, { ordered: false });
    if (count) console.log(`${name}: ${count} document(s) RTF ${dryRun ? 'détecté(s)' : 'nettoyé(s)'}`);
  }

  console.log(`Total: ${total} document(s) ${dryRun ? 'à nettoyer' : 'nettoyé(s)'}`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
