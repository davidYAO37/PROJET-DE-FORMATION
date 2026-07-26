/**
 * Script de migration / initialisation multi-tenant dans une seule base
 * Usage (PowerShell) :
 *   $env:NODE_OPTIONS="--max-old-space-size=4096"
 *   $env:MONGODB_URI="mongodb://localhost:27017/bd_esaymed"
 *   $env:MONGODB_SOURCE_URI="mongodb://localhost:27017/bd_esaymed_backup" # optionnel
 *   $env:ENTREPRISE_NAME="Clinique Principale"
 *   $env:ADMIN_EMAIL="admin@clinique.com"
 *   $env:ADMIN_PASSWORD="SuperMotDePasse123"
 *   node scripts/migrateToMultiTenant.js
 *
 * Options : ajouter "--drop" pour vider la base cible avant la copie.
 */

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

function extractDbNameFromUri(uri) {
  try {
    const url = new URL(uri);
    const pathname = url.pathname.replace(/^\/+/, '');
    return pathname || undefined;
  } catch {
    return undefined;
  }
}

async function main() {
  const targetUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const sourceUri = process.env.MONGODB_SOURCE_URI;
  const entrepriseName = process.env.ENTREPRISE_NAME || 'Entreprise par défaut';
  const shouldDrop = process.argv.includes('--drop');

  if (!targetUri) {
    console.error('Variable requise : MONGODB_URI ou MONGO_URI (base cible)');
    process.exit(1);
  }

  const targetDbName = extractDbNameFromUri(targetUri) || process.env.MONGO_DB_NAME || 'bd_esaymed';
  const targetClient = new MongoClient(targetUri);

  try {
    await targetClient.connect();
    const targetDb = targetClient.db(targetDbName);

    const sourceDbName = sourceUri ? (extractDbNameFromUri(sourceUri) || process.env.MONGO_SOURCE_DB_NAME || 'test') : undefined;
    const sameSource = !sourceUri || (sourceUri === targetUri && sourceDbName === targetDbName);

    // 1. Copie depuis une source optionnelle
    if (sourceUri && !sameSource) {
      const sourceClient = new MongoClient(sourceUri);
      try {
        await sourceClient.connect();
        const sourceDb = sourceClient.db(sourceDbName);
        const sourceCollections = await sourceDb.collections();
        const systemCollections = ['system.indexes', 'system.profile', 'system.js'];

        for (const coll of sourceCollections) {
          const name = coll.collectionName;
          if (systemCollections.includes(name)) continue;

          console.log(`Copie de ${name} ...`);
          if (shouldDrop) {
            await targetDb.collection(name).drop().catch(() => {});
          }

          const docs = await sourceDb.collection(name).find({}).toArray();
          if (docs.length === 0) {
            console.log(`  ${name} : aucun document`);
            continue;
          }

          try {
            await targetDb.collection(name).insertMany(docs, { ordered: false });
            console.log(`  ${name} : ${docs.length} documents copiés`);
          } catch (err) {
            if (err && err.writeErrors && err.writeErrors.length > 0) {
              console.log(
                `  ${name} : ${docs.length - err.writeErrors.length} insérés, ${err.writeErrors.length} doublons ignorés`
              );
            } else {
              console.error(`  Erreur ${name} :`, err.message);
            }
          }
        }
      } finally {
        await sourceClient.close();
      }
    } else if (shouldDrop && sameSource) {
      console.warn('"--drop" ignoré car la source et la cible sont identiques.');
    }

    // 2. S'assurer qu'une entreprise existe
    const entreprises = targetDb.collection('entreprises');
    let entreprise = await entreprises.findOne({});
    let entrepriseId;

    if (entreprise) {
      entrepriseId = entreprise._id;
      console.log(`Entreprise existante : ${entrepriseId}`);

      await entreprises.updateOne(
        { _id: entrepriseId },
        {
          $set: {
            isActive: true,
            statut: 'active',
            mongoUri: targetUri,
            dbName: targetDbName,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            dateExpiration: new Date('2099-12-31T23:59:59.000Z'),
            createdAt: new Date(),
          },
        }
      );
    } else {
      const result = await entreprises.insertOne({
        NomSociete: entrepriseName,
        nomSociete: entrepriseName,
        isActive: true,
        statut: 'active',
        mongoUri: targetUri,
        dbName: targetDbName,
        dateExpiration: new Date('2099-12-31T23:59:59.000Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      entrepriseId = result.insertedId;
      console.log(`Entreprise créée : ${entrepriseId}`);
    }

    // 3. S'assurer qu'au moins un admin existe
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const users = targetDb.collection('users');

    if (adminEmail && adminPassword) {
      const existingUser = await users.findOne({ email: adminEmail.toLowerCase().trim() });
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const userResult = await users.insertOne({
          nom: 'Administrateur',
          prenom: entrepriseName,
          email: adminEmail.toLowerCase().trim(),
          type: 'admin',
          uid: `admin-${Date.now()}`,
          password: hashedPassword,
          entrepriseId,
          failedAttempts: 0,
          remainingAttempts: 4,
          isLocked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`Utilisateur admin créé : ${userResult.insertedId}`);
      } else {
        console.log(`Utilisateur admin déjà existant : ${existingUser._id}`);
      }
    }

    // 4. Normalise les anciens utilisateurs sans entrepriseId
    await users.updateMany(
      { entrepriseId: { $exists: false } },
      { $set: { entrepriseId } }
    );

    console.log('Migration terminée.');
  } finally {
    await targetClient.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
