const { MongoClient } = require('mongodb');

// Remplacez avec votre URI MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = "bd_esaymed";

async function checkAndCreateSuperAdmin() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log("✅ Connecté à MongoDB");
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Vérifier si la collection est vide
    const userCount = await usersCollection.countDocuments();
    console.log(`📊 Nombre d'utilisateurs: ${userCount}`);
    
    if (userCount === 0) {
      console.log("🚀 Collection vide, création du super admin...");
      
      // Créer le super admin avec un UID temporaire
      const superAdmin = {
        nom: "Yao",
        prenom: "Kouassi Davis",
        email: "ykdavid11@gmail.com",
        type: "adminsuper",
        uid: "TEMP_UID_REPLACE_WITH_FIREBASE_UID", // À remplacer par le vrai UID
        createdAt: new Date()
      };
      
      const result = await usersCollection.insertOne(superAdmin);
     
      
      // Afficher les utilisateurs existants
      const users = await usersCollection.find({}, { 
        projection: { nom: 1, prenom: 1, email: 1, type: 1, uid: 1 } 
      }).toArray();
      
      console.log("👥 Utilisateurs existants:");
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.nom} ${user.prenom} - ${user.email} (${user.type}) - UID: ${user.uid}`);
      });
    }
    
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await client.close();
    console.log("🔌 Connexion fermée");
  }
}

checkAndCreateSuperAdmin();
