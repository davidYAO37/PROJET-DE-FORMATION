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

async function recreateSuperAdmin() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGO_URI, {
      dbName: DB_NAME,
    });
    console.log("✅ Connecté à MongoDB");
    
    // Supprimer l'ancien utilisateur avec UID temporaire
    const deleteResult = await User.deleteOne({ email: "ykdavid11@gmail.com" });
    console.log("🗑️  Suppression de l'ancien utilisateur:", deleteResult.deletedCount, "document(s)");
    
    // Créer le nouvel utilisateur avec l'UID Firebase
    const firebaseUid = process.argv[2];
    
    if (!firebaseUid) {
      console.log("❌ Veuillez fournir l'UID Firebase:");
      console.log("   Usage: node recreateSuperAdmin.js VOTRE_UID_FIREBASE");
      console.log("   Exemple: node recreateSuperAdmin.js abc123def456ghi789");
      return;
    }
    
    const superAdmin = new User({
      nom: "Yao",
      prenom: "Kouassi Davis",
      email: "ykdavid11@gmail.com",
      type: "adminsuper",
      uid: firebaseUid,
    });
    
    await superAdmin.save();
    console.log("✅ Super admin recréé avec succès!");
    console.log("   - Nom: Yao");
    console.log("   - Prénom: Kouassi Davis");
    console.log("   - Email: ykdavid11@gmail.com");
    console.log("   - Type: adminsuper");
    console.log("   - UID Firebase:", firebaseUid);
    console.log("");
    console.log("🎯 Le super admin est maintenant prêt pour la connexion!");
    
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Connexion MongoDB fermée");
  }
}

// Exécuter le script
recreateSuperAdmin()
  .then(() => {
    console.log("✅ Opération terminée");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  });
