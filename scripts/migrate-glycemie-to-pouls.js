/**
 * Migration : renomme les anciens champs glycémie en Pouls/pouls.
 *
 * Collections concernées :
 *  - consultations          : Glycemie -> Pouls
 *  - observationhospits     : Glycemie -> Pouls
 *  - constantesHospitalisation : glycemie -> pouls (si pouls absent)
 *
 * Usage avec la base principale (MONGODB_URI pointe directement sur la BDD) :
 *   $env:MONGODB_URI="mongodb+srv://.../bd_esaymed"
 *   node scripts/migrate-glycemie-to-pouls.js
 *
 * Usage multi-bases (automatique) :
 *   Le script liste toutes les bases dont le nom contient "esaymed", "easy_medical"
 *   ou "tenant", plus la base indiquée dans l'URI.
 *
 * Pour cibler explicitement une liste de bases :
 *   node scripts/migrate-glycemie-to-pouls.js --dbs=bd_esaymed,tenant_a,tenant_b
 */

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
const dryRun = process.argv.includes('--dryRun');

const dbsArg = process.argv.find((arg) => arg.startsWith('--dbs='));
const explicitDbs = dbsArg ? dbsArg.split('=')[1].split(',') : null;

function extractDefaultDbName(connectionString) {
  try {
    const match = connectionString.match(/\/([^/?]+)(?:\?|$)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function migrate() {
  if (!uri) {
    console.error('Variable requise : MONGODB_URI ou MONGO_URI');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connecté à MongoDB');

    let dbNames = explicitDbs;

    if (!dbNames) {
      const admin = client.db().admin();
      const { databases } = await admin.listDatabases();
      dbNames = databases
        .map((db) => db.name)
        .filter((name) => /esaymed|easy_medical|tenant/i.test(name));

      const defaultDb = extractDefaultDbName(uri);
      if (defaultDb && !dbNames.includes(defaultDb)) {
        dbNames.push(defaultDb);
      }
    }

    if (dbNames.length === 0) {
      console.log('Aucune base de données cible trouvée.');
      return;
    }

    console.log(`Bases cibles : ${dbNames.join(', ')}`);
    if (dryRun) {
      console.log('Mode dryRun : aucune modification ne sera effectuée.');
    }

    for (const dbName of dbNames) {
      const db = client.db(dbName);
      const collections = (await db.listCollections().toArray()).map((c) => c.name);

      // consultations : Glycemie -> Pouls
      if (collections.includes('consultations')) {
        const count = await db.collection('consultations').countDocuments({ Glycemie: { $exists: true } });
        if (dryRun) {
          console.log(`[${dbName}] consultations : ${count} documents à migrer`);
        } else if (count > 0) {
          const result = await db.collection('consultations').updateMany(
            { Glycemie: { $exists: true } },
            [{ $set: { Pouls: '$Glycemie' } }, { $unset: 'Glycemie' }]
          );
          console.log(`[${dbName}] consultations : ${result.modifiedCount} documents migrés`);
        } else {
          console.log(`[${dbName}] consultations : aucun document à migrer`);
        }
      }

      // observationhospits : Glycemie -> Pouls
      if (collections.includes('observationhospits')) {
        const count = await db.collection('observationhospits').countDocuments({ Glycemie: { $exists: true } });
        if (dryRun) {
          console.log(`[${dbName}] observationhospits : ${count} documents à migrer`);
        } else if (count > 0) {
          const result = await db.collection('observationhospits').updateMany(
            { Glycemie: { $exists: true } },
            [{ $set: { Pouls: '$Glycemie' } }, { $unset: 'Glycemie' }]
          );
          console.log(`[${dbName}] observationhospits : ${result.modifiedCount} documents migrés`);
        } else {
          console.log(`[${dbName}] observationhospits : aucun document à migrer`);
        }
      }

      // constantesHospitalisation : glycemie -> pouls (sans écraser un pouls existant)
      if (collections.includes('constantesHospitalisation')) {
        const count = await db.collection('constantesHospitalisation').countDocuments({ glycemie: { $exists: true } });
        if (dryRun) {
          console.log(`[${dbName}] constantesHospitalisation : ${count} documents à migrer`);
        } else if (count > 0) {
          const result = await db.collection('constantesHospitalisation').updateMany(
            { glycemie: { $exists: true } },
            [
              {
                $set: {
                  pouls: {
                    $cond: {
                      if: { $or: [{ $eq: ['$pouls', null] }, { $not: ['$pouls'] }] },
                      then: '$glycemie',
                      else: '$pouls',
                    },
                  },
                },
              },
              { $unset: 'glycemie' },
            ]
          );
          console.log(`[${dbName}] constantesHospitalisation : ${result.modifiedCount} documents migrés`);
        } else {
          console.log(`[${dbName}] constantesHospitalisation : aucun document à migrer`);
        }
      }
    }

    console.log('Migration terminée.');
  } catch (error) {
    console.error('Erreur lors de la migration :', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

migrate();
