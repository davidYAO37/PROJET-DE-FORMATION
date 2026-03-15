const mongoose = require('mongoose');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = "bd_esaymed";

// Schéma User simplifié pour ce script
const UserSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  entrepriseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Entreprise', required: false },
  uid: { type: String, required: true },
}, { collection: 'users' });

const User = mongoose.model('User', UserSchema);

async function createSuperAdmin() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGO_URI, {
      dbName: DB_NAME,
    });
    console.log("✅ Connecté à MongoDB");
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: "ykdavid11@gmail.com" });
    if (existingUser) {
      console.log("ℹ️ Le super admin existe déjà:", existingUser.email);
      console.log("   - Nom:", existingUser.nom);
      console.log("   - Prénom:", existingUser.prenom);
      console.log("   - Type:", existingUser.type);
      console.log("   - UID:", existingUser.uid);
      return existingUser;
    }
    
    console.log("🚀 Création du super admin...");
    console.log("⚠️  ATTENTION: Ce script crée seulement l'enregistrement MongoDB");
    console.log("📝 Vous devez créer manuellement le compte Firebase Auth pour ykdavid11@gmail.com");
    console.log("🔗 Puis mettez à jour l'UID avec celui de Firebase");
    
    // Créer le super admin avec un UID temporaire
    const superAdmin = new User({
      nom: "Yao",
      prenom: "Kouassi Davis",
      email: "ykdavid11@gmail.com",
      type: "adminsuper",
      uid: "TEMP_UID_" + Date.now(), // UID temporaire
    });
    
    await superAdmin.save();
    console.log("✅ Super admin créé dans MongoDB avec succès!");
    console.log("   - Nom: Yao");
    console.log("   - Prénom: Kouassi Davis");
    console.log("   - Email: ykdavid11@gmail.com");
    console.log("   - Type: adminsuper");
    console.log("   - UID temporaire:", superAdmin.uid);
    console.log("");
    console.log("🔧 ÉTAPES SUIVANTES:");
    console.log("1. Créez le compte Firebase Auth pour ykdavid11@gmail.com");
    console.log("2. Récupérez l'UID Firebase");
    console.log("3. Mettez à jour l'UID dans MongoDB avec la commande:");
    console.log(`   db.users.updateOne({email: "ykdavid11@gmail.com"}, {$set: {uid: "FIREBASE_UID_HERE"}})`);
    
    return superAdmin;
    
  } catch (error) {
    console.error("❌ Erreur lors de la création du super admin:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Connexion MongoDB fermée");
  }
}

// Exécuter le script
createSuperAdmin()
  .then(() => {
    console.log("✅ Opération terminée avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  });
