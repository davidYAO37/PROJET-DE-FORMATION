// Vérification des liens automates : lit les configs en base et teste chaque URL.
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const envPath = path.join(process.cwd(), '.env');
const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const m = env.match(/^MONGODB_URI\s*=\s*(.+)$/m) || env.match(/^MONGO_URI\s*=\s*(.+)$/m);
const uri = m && m[1].trim().replace(/^["']|["']$/g, '');
if (!uri) { console.log('MONGODB_URI introuvable dans .env'); process.exit(1); }

function tenantUri(base, dbName) {
  const parsed = new URL(base);
  parsed.pathname = `/${dbName}`;
  return parsed.toString();
}

async function testLien(name, url) {
  if (!url) { console.log(`  ${name}: (non configure)`); return; }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    const body = await r.text();
    let jsonInfo = 'NON';
    try {
      const j = JSON.parse(body);
      jsonInfo = Array.isArray(j) ? `oui (${j.length} lignes)` : 'oui (objet)';
    } catch {}
    console.log(`  ${name}: HTTP ${r.status} - ${body.length} octets - JSON ${jsonInfo}`);
    console.log(`    ${url}`);
  } catch (e) {
    clearTimeout(t);
    console.log(`  ${name}: INJOIGNABLE - ${e.name === 'AbortError' ? 'timeout >8s' : e.message}`);
    console.log(`    ${url}`);
  }
}

(async () => {
  await mongoose.connect(uri, { dbName: 'bd_esaymed' });
  const entreprises = await mongoose.connection.db
    .collection('entreprises')
    .find({}, { projection: { NomSociete: 1, dbName: 1 } })
    .toArray();

  for (const e of entreprises) {
    if (!e.dbName) continue;
    const tconn = await mongoose.createConnection(tenantUri(uri, e.dbName)).asPromise();
    const docs = await tconn.db.collection('lienautomates').find({}).sort({ createdAt: -1 }).toArray();
    console.log(`\n=== ${e.NomSociete} (${e.dbName}) - ${docs.length} config(s) ===`);
    if (docs.length > 1) console.log('  ATTENTION: plusieurs documents LienAutomate - les routes ne lisent pas toutes le meme');
    const latest = docs[0];
    if (!latest) { console.log('  Aucun lien configure'); }
    else {
      await testLien('NFS      ', latest.nLienNFS);
      await testLien('Hormones ', latest.LienHormone);
      await testLien('VS       ', latest.LienVS);
      await testLien('Biochimie', latest.LienBiochimie);
    }
    await tconn.close();
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
