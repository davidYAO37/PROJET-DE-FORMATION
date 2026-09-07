const path = require('path');
const { spawn } = require('child_process');
const mongoose = require('mongoose');

const [enterpriseId, jobId] = process.argv.slice(2);
const centralUri = process.env.MONGODB_URI || process.env.MONGO_URI;
const exportDir = process.env.WINDEV_EXPORT_DIR;

function tenantUri(uri, dbName) {
  const parsed = new URL(uri);
  parsed.pathname = `/${dbName}`;
  return parsed.toString();
}

function runChild(script, extraArgs, childEnv, db, jobObjectId) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, script), '--dir', exportDir, ...extraArgs], {
      env: { ...process.env, MONGODB_URI: childEnv.MONGODB_URI, ENTREPRISE_ID: childEnv.ENTREPRISE_ID },
    });

    db.collection('windevimportjobs').updateOne(
      { _id: jobObjectId },
      { $set: { childPid: child.pid } },
    ).catch(() => undefined);

    const outChunks = [];
    const errChunks = [];
    child.stdout.on('data', (d) => outChunks.push(d));
    child.stderr.on('data', (d) => errChunks.push(d));

    const cancelCheck = setInterval(async () => {
      try {
        const job = await db.collection('windevimportjobs').findOne(
          { _id: jobObjectId },
          { projection: { status: 1 } },
        );
        if (job?.status === 'cancelled') {
          clearInterval(cancelCheck);
          try { child.kill(); } catch {}
          setTimeout(() => { try { child.kill('SIGKILL'); } catch {} }, 3000);
        }
      } catch {}
    }, 2000);

    child.on('error', (err) => {
      clearInterval(cancelCheck);
      reject(err);
    });

    child.on('close', (code) => {
      clearInterval(cancelCheck);
      const out = Buffer.concat(outChunks).toString('utf8');
      const err = Buffer.concat(errChunks).toString('utf8');
      if (code !== 0) reject(new Error(`${script} a échoué (code ${code}): ${err || out}`));
      else resolve({ script, out, err });
    });
  });
}

async function main() {
  if (!centralUri || !exportDir || !enterpriseId || !jobId) throw new Error('Configuration de mise à jour incomplète');
  await mongoose.connect(centralUri, { dbName: 'bd_esaymed' });
  const centralDb = mongoose.connection.db;
  const jobObjectId = new mongoose.Types.ObjectId(jobId);
  const enterprise = await centralDb.collection('entreprises').findOne({ _id: new mongoose.Types.ObjectId(enterpriseId) });
  if (!enterprise?.dbName || !/^[a-zA-Z0-9_-]+$/.test(enterprise.dbName)) throw new Error('Base entreprise invalide');
  const targetUri = enterprise.mongoUri ? tenantUri(enterprise.mongoUri, enterprise.dbName) : tenantUri(centralUri, enterprise.dbName);

  await centralDb.collection('windevimportjobs').updateOne(
    { _id: jobObjectId },
    { $set: { status: 'running', startedAt: new Date(), dbName: enterprise.dbName, pid: process.pid } },
  );

  const scripts = [
    ['import_additional.js', '--referencesOnly'],
    ['import_all.js', '--refresh'],
    ['import_additional.js', '--skipReferences'],
    ['import_lab_results.js'],
    ['import_clinical_metadata.js'],
    ['import_treatments.js'],
    ['import_stock.js'],
    ['import_accounting_history.js'],
    ['import_configuration.js'],
    ['verify_all.js'],
  ];
  const logs = [];

  for (let index = 0; index < scripts.length; index++) {
    const [script, ...extra] = scripts[index];
    await centralDb.collection('windevimportjobs').updateOne(
      { _id: jobObjectId },
      { $set: { currentStep: script, progress: Math.round(index * 100 / scripts.length) } },
    );
    const result = await runChild(script, extra, { MONGODB_URI: targetUri, ENTREPRISE_ID: enterpriseId }, centralDb, jobObjectId);
    logs.push(`${result.script}\n${result.out || ''}\n${result.err || ''}`);
  }

  await centralDb.collection('windevimportjobs').updateOne(
    { _id: jobObjectId },
    { $set: { status: 'completed', progress: 100, currentStep: '', finishedAt: new Date(), logs: logs.join('\n') } },
  );
  await mongoose.disconnect();
}

main().catch(async (error) => {
  try {
    if (mongoose.connection.readyState) {
      const job = await mongoose.connection.db.collection('windevimportjobs').findOne(
        { _id: new mongoose.Types.ObjectId(jobId) },
        { projection: { status: 1 } },
      );
      if (job?.status !== 'cancelled') {
        await mongoose.connection.db.collection('windevimportjobs').updateOne(
          { _id: new mongoose.Types.ObjectId(jobId) },
          { $set: { status: 'failed', finishedAt: new Date(), error: String(error.message || error).slice(0, 10000) } },
        );
      }
    }
  } finally {
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  }
});
