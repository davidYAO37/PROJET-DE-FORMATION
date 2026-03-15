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

async function updateFirebaseUid() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGO_URI, {
      dbName: DB_NAME,
    });
    console.log("✅ Connecté à MongoDB");
    
    // Trouver l'utilisateur avec l'email ykdavid11@gmail.com
    const user = await User.findOne({ email: "ykdavid11@gmail.com" });
    
    if (!user) {
      console.log("❌ Utilisateur non trouvé avec l'email ykdavid11@gmail.com");
      return;
    }
    
    console.log("📋 Utilisateur trouvé:");
    console.log("   - Nom:", user.nom);
    console.log("   - Prénom:", user.prenom);
    console.log("   - Email:", user.email);
    console.log("   - Type:", user.type);
    console.log("   - UID actuel:", user.uid);
    
    // Liste tous les utilisateurs pour voir s'il y a des doublons
    const allUsers = await User.find({ email: "ykdavid11@gmail.com" });
    console.log("📊 Nombre d'utilisateurs avec cet email:", allUsers.length);
    
    if (allUsers.length > 1) {
      console.log("⚠️  Attention: Il y a plusieurs utilisateurs avec cet email");
      allUsers.forEach((u, index) => {
        console.log(`   ${index + 1}. UID: ${u.uid}, Type: ${u.type}`);
      });
    }
    
    console.log("");
    console.log("🔧 Pour résoudre le problème de connexion:");
    console.log("1. Connectez-vous à Firebase et récupérez l'UID de l'utilisateur ykdavid11@gmail.com");
    console.log("2. Exécutez cette commande MongoDB pour mettre à jour l'UID:");
    console.log(`   db.users.updateOne({email: "ykdavid11@gmail.com"}, {$set: {uid: "FIREBASE_UID_HERE"}})`);
    console.log("3. Ou utilisez l'API POST /api/check-users pour créer un nouvel utilisateur avec le bon UID");
    
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Connexion MongoDB fermée");
  }
}

// Exécuter le script
updateFirebaseUid()
  .then(() => {
    console.log("✅ Vérification terminée");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  });
