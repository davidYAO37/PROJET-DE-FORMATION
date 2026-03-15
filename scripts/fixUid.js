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

async function fixUid() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGO_URI, {
      dbName: DB_NAME,
    });
    console.log("✅ Connecté à MongoDB");
    
    // Récupérer l'UID depuis la ligne de commande ou utiliser une valeur par défaut
    const firebaseUid = process.argv[2] || "FIREBASE_UID_HERE";
    
    if (firebaseUid === "FIREBASE_UID_HERE") {
      console.log("❌ Veuillez fournir l'UID Firebase:");
      console.log("   Usage: node fixUid.js VOTRE_UID_FIREBASE");
      console.log("   Exemple: node fixUid.js abc123def456ghi789");
      return;
    }
    
    // Mettre à jour l'UID
    const result = await User.updateOne(
      { email: "ykdavid11@gmail.com" },
      { $set: { uid: firebaseUid } }
    );
    
    if (result.modifiedCount > 0) {
      console.log("✅ UID mis à jour avec succès!");
      console.log("   - Email: ykdavid11@gmail.com");
      console.log("   - Nouvel UID:", firebaseUid);
      
      // Vérifier la mise à jour
      const user = await User.findOne({ email: "ykdavid11@gmail.com" });
      console.log("   - Vérification: UID actuel =", user.uid);
    } else {
      console.log("❌ Aucune modification effectuée. Utilisateur non trouvé?");
    }
    
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Connexion MongoDB fermée");
  }
}

// Exécuter le script
fixUid()
  .then(() => {
    console.log("✅ Opération terminée");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  });
