import { NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { UserCollection } from "@/models/users.model";

export const GET = async () => {
  try {
    await db();
    
    const userCount = await UserCollection.countDocuments();
    const users = await UserCollection.find({}, { 
      nom: 1, prenom: 1, email: 1, type: 1, uid: 1 
    }).lean();
    
    return NextResponse.json({
      message: "État de la collection users",
      userCount,
      users: users.map(u => ({
        nom: u.nom,
        prenom: u.prenom,
        email: u.email,
        type: u.type,
        uid: u.uid
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
      // Créer le super admin avec un UID temporaire
      // IMPORTANT: Ce UID doit être remplacé par le vrai UID Firebase Auth
      const superAdmin = {
        nom: "Yao",
        prenom: "Kouassi Davis",
        email: "ykdavid11@gmail.com",
        type: "adminsuper",
        uid: "TEMP_UID_REPLACE_WITH_FIREBASE_UID", // À remplacer par le vrai UID
      };
      
      const newUser = new UserCollection(superAdmin);
      await newUser.save();
      
      return NextResponse.json({
        message: "Super admin créé avec succès (UID temporaire)",
        warning: "IMPORTANT: Utilisez le script scripts/createSuperAdmin.ts pour créer le compte Firebase Auth complet",
        userCount: 1,
        createdUser: {
          nom: superAdmin.nom,
          prenom: superAdmin.prenom,
          email: superAdmin.email,
          type: superAdmin.type,
          uid: superAdmin.uid
        }
      });
    } else {
      return NextResponse.json({
        message: "La collection contient déjà des utilisateurs",
        userCount
      });
    }
  } catch (error) {
    console.error("❌ Erreur:", error);
    return NextResponse.json({ message: "Erreur lors de la création du super admin" }, { status: 500 });
  }
};
