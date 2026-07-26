/**
 * Création / restauration du super administrateur dans bd_esaymed
 *
 * Usage (PowerShell) :
 *   $env:MONGO_URI="mongodb://localhost:27017"
 *   $env:SUPER_ADMIN_EMAIL="ykdavid11@gmail.com"
 *   $env:SUPER_ADMIN_PASSWORD="Yao2026!"
 *   node check-users.js
 */

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const DEFAULT_EMAIL = 'ykdavid11@gmail.com';

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
  const rawUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const dbName = extractDbNameFromUri(rawUri) || process.env.MONGO_DB_NAME || 'bd_esaymed';
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || DEFAULT_EMAIL).toLowerCase().trim();
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Yao2026!';
  const entrepriseName = process.env.ENTREPRISE_NAME || 'Entreprise par défaut';

  const client = new MongoClient(rawUri);

  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');

    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    const entreprisesCollection = db.collection('entreprises');

    // 1. S'assurer qu'une entreprise existe
    let entreprise = await entreprisesCollection.findOne({});
    let entrepriseId;

    if (entreprise) {
      entrepriseId = entreprise._id;
      console.log(`🏢 Entreprise existante : ${entrepriseId}`);

      await entreprisesCollection.updateOne(
        { _id: entrepriseId },
        {
          $set: {
            isActive: true,
            statut: 'active',
            mongoUri: rawUri,
            dbName,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            NomSociete: entrepriseName,
            nomSociete: entrepriseName,
            dateExpiration: new Date('2099-12-31T23:59:59.000Z'),
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
    } else {
      const result = await entreprisesCollection.insertOne({
        NomSociete: entrepriseName,
        nomSociete: entrepriseName,
        isActive: true,
        statut: 'active',
        mongoUri: rawUri,
        dbName,
        dateExpiration: new Date('2099-12-31T23:59:59.000Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      entrepriseId = result.insertedId;
      console.log(`🏢 Entreprise créée : ${entrepriseId}`);
    }

    // 2. Normaliser les utilisateurs sans entrepriseId (sauf super admins)
    const orphanUpdate = await usersCollection.updateMany(
      { entrepriseId: { $exists: false }, type: { $ne: 'adminsuper' } },
      { $set: { entrepriseId } }
    );
    if (orphanUpdate.modifiedCount > 0) {
      console.log(`🔗 ${orphanUpdate.modifiedCount} utilisateur(s) lié(s) à l'entreprise`);
    }

    // 2b. S'assurer que les super admins n'ont pas d'entreprise liée
    const superAdminUnlink = await usersCollection.updateMany(
      { type: 'adminsuper', entrepriseId: { $exists: true } },
      { $unset: { entrepriseId: 1 } }
    );
    if (superAdminUnlink.modifiedCount > 0) {
      console.log(`🔓 ${superAdminUnlink.modifiedCount} super admin(s) délié(s) de l'entreprise`);
    }

    // 3. Vérifier / créer le super admin
    const existingUser = await usersCollection.findOne({ email: superAdminEmail });

    if (existingUser) {
      // Forcer le type adminsuper et retirer l'entreprise du super admin
      const updates = {};
      if (existingUser.type !== 'adminsuper') updates.type = 'adminsuper';

      const updateDoc = { $set: { updatedAt: new Date() } };
      if (Object.keys(updates).length > 0) updateDoc.$set = { ...updateDoc.$set, ...updates };

      if (existingUser.entrepriseId) {
        updateDoc.$unset = { entrepriseId: 1 };
      }

      if (Object.keys(updateDoc.$set).length > 1 || updateDoc.$unset) {
        await usersCollection.updateOne({ _id: existingUser._id }, updateDoc);
      }

      // Mettre à jour le mot de passe si fourni en variable d'environnement
      if (process.env.SUPER_ADMIN_PASSWORD) {
        const hashedPassword = await bcrypt.hash(superAdminPassword, 10);
        await usersCollection.updateOne(
          { _id: existingUser._id },
          { $set: { password: hashedPassword, updatedAt: new Date() } }
        );
      }
      console.log(`👤 Super admin existant : ${existingUser._id}`);
    } else {
      const hashedPassword = await bcrypt.hash(superAdminPassword, 10);
      const result = await usersCollection.insertOne({
        nom: 'Yao',
        prenom: 'Kouassi David',
        email: superAdminEmail,
        type: 'adminsuper',
        uid: `superadmin-${Date.now()}`,
        password: hashedPassword,
        failedAttempts: 0,
        remainingAttempts: 4,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`🚀 Super admin créé : ${result.insertedId}`);
    }

    // 4. Afficher les utilisateurs existants
    const users = await usersCollection
      .find({}, { projection: { nom: 1, prenom: 1, email: 1, type: 1, uid: 1, entrepriseId: 1 } })
      .toArray();

    console.log('\n👥 Utilisateurs existants :');
    users.forEach((user, index) => {
      console.log(
        `   ${index + 1}. ${user.nom} ${user.prenom} - ${user.email} (${user.type}) - UID: ${user.uid}`
      );
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Connexion fermée');
  }
}

main();
