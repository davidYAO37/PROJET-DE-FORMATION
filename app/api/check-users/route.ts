import { NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { UserCollection } from "@/models/users.model";
import { hashPassword, generateLocalUID } from "@/utils/auth";

export const GET = async () => {
  try {
    await db();
    
    const userCount = await UserCollection.countDocuments();
    const users = await UserCollection.find({}, { 
      _id: 1, nom: 1, prenom: 1, email: 1, type: 1, uid: 1, entrepriseId: 1, 
      isLocked: 1, failedAttempts: 1, remainingAttempts: 1, lockedUntil: 1
    }).lean();
    
    return NextResponse.json({
      message: "État de la collection users",
      userCount,
      users: users.map(u => ({
        _id: (u._id as any)?.toString() || "",
        nom: u.nom,
        prenom: u.prenom,
        email: u.email,
        type: u.type,
        uid: u.uid,
        entrepriseId: u.entrepriseId || "",
        isLocked: u.isLocked || false,
        failedAttempts: u.failedAttempts || 0,
        remainingAttempts: u.remainingAttempts || 4,
        lockedUntil: u.lockedUntil || null
      }))
    });
  } catch (error) {
    console.error("❌ Erreur:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
};

export const POST = async () => {
  try {
    await db();
    
    const userCount = await UserCollection.countDocuments();
    
    if (userCount === 0) {
      console.log("🚀 Création automatique du super admin en local...");
      
      // Hasher le mot de passe et générer un UID local
      const hashedPassword = await hashPassword("Yao2026!");
      const localUID = generateLocalUID();
      
      // Créer le super admin avec authentification locale
      const superAdmin = new UserCollection({
        nom: "Yao",
        prenom: "Kouassi David",
        email: "ykdavid11@gmail.com",
        type: "adminsuper",
        uid: localUID,
        password: hashedPassword
      });
      
      await superAdmin.save();
      console.log("✅ Super admin créé en local avec succès!");
      
      return NextResponse.json({
        message: "Super admin créé automatiquement avec succès (authentification locale)",
        userCount: 1,
        createdUser: {
          nom: "Yao",
          prenom: "Kouassi David",
          email: "ykdavid11@gmail.com",
          type: "adminsuper",
          uid: localUID
        },
        authInfo: {
          message: "Compte créé avec authentification locale sécurisée",
          email: "ykdavid11@gmail.com",
          password: "Yao2026! (à changer immédiatement)"
        }
      });
      
    } else {
      return NextResponse.json({
        message: "La collection contient déjà des utilisateurs",
        userCount
      });
    }
  } catch (error) {
    console.error("❌ Erreur lors de la création du super admin:", error);
    return NextResponse.json({ message: "Erreur lors de la création du super admin" }, { status: 500 });
  }
};
