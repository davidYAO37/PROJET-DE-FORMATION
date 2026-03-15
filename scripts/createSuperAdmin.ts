import { db } from "@/db/mongoConnect";
import { UserCollection } from "@/models/users.model";
import { auth } from "@/firebase/configConnect";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

export const createSuperAdmin = async () => {
  try {
    await db();
    
    // Vérifier si l'utilisateur existe déjà dans MongoDB
    const existingUser = await UserCollection.findOne({ email: "ykdavid11@gmail.com" });
    if (existingUser) {
      console.log("ℹ️ Le super admin existe déjà dans MongoDB:", existingUser.email);
      return existingUser;
    }
    
    console.log("🚀 Création du super admin avec Firebase Auth...");
    
    try {
      // Créer le compte Firebase Auth
      const firebaseUser = await createUserWithEmailAndPassword(
        auth, 
        "ykdavid11@gmail.com", 
        "Yao2026!" // Mot de passe par défaut à changer
      );
      
      console.log("✅ Compte Firebase créé avec UID:", firebaseUser.user.uid);
      
      // Créer l'utilisateur dans MongoDB
      const superAdmin = new UserCollection({
        nom: "Yao",
        prenom: "Kouassi Davis",
        email: "ykdavid11@gmail.com",
        type: "adminsuper",
        uid: firebaseUser.user.uid
      });
      
      await superAdmin.save();
      console.log("✅ Super admin créé dans MongoDB avec succès!");
      console.log("   - Nom: Yao");
      console.log("   - Prénom: Kouassi Davis");
      console.log("   - Email: ykdavid11@gmail.com");
      console.log("   - Type: adminsuper");
      console.log("   - UID Firebase:", firebaseUser.user.uid);
      console.log("🔐 Mot de passe par défaut: Yao2026! (à changer immédiatement)") ;
      console.log("🎯 uid NmwIreiXOufZhsXgsKpX9izIVwI2");
      
      return superAdmin;
      
    } catch (firebaseError: any) {
      if (firebaseError.code === "auth/email-already-in-use") {
        console.log("ℹ️ Le compte Firebase existe déjà, tentative de connexion pour obtenir l'UID...");
        
        try {
          // Se connecter pour obtenir l'UID
          const userCredential = await signInWithEmailAndPassword(
            auth, 
            "ykdavid11@gmail.com", 
            "Yao2026!"
          );
          
          const superAdmin = new UserCollection({
            nom: "Yao",
            prenom: "Kouassi Davis",
            email: "ykdavid11@gmail.com",
            type: "adminsuper",
            uid: userCredential.user.uid
          });
          
          await superAdmin.save();
          console.log("✅ Super admin créé dans MongoDB avec UID Firebase existant!");
          console.log("   - UID Firebase:", userCredential.user.uid);
          return superAdmin;
          
        } catch (signInError) {
          console.error("❌ Impossible de se connecter au compte Firebase existant:", signInError);
          console.log("📝 Le compte Firebase existe mais le mot de passe est incorrect.");
          console.log("🔧 Veuillez réinitialiser le mot de passe Firebase ou utiliser un autre email.");
          throw new Error("Compte Firebase existe mais impossible d'obtenir l'UID");
        }
      }
      throw firebaseError;
    }
    
  } catch (error) {
    console.error("❌ Erreur lors de la création du super admin:", error);
    throw error;
  }
};

// Script pour exécution manuelle
const main = async () => {
  try {
    await createSuperAdmin();
    console.log("✅ Opération terminée avec succès");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  }
};

// Exécuter seulement si le fichier est appelé directement
if (require.main === module) {
  main();
}

export default createSuperAdmin;
