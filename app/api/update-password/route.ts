import { NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { UserCollection } from "@/models/users.model";
import { verifyPassword, hashPassword } from "@/utils/auth";

export const POST = async (req: Request) => {
  try {
    const { email, newPassword } = await req.json();
    
    if (!email || !newPassword) {
      return NextResponse.json({ message: "Email et nouveau mot de passe requis" }, { status: 400 });
    }

    await db();
    
    // Rechercher l'utilisateur par email
    const user = await UserCollection.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Valider le nouveau mot de passe
    if (newPassword.length < 6) {
      return NextResponse.json({ message: "Le mot de passe doit contenir au moins 6 caractères" }, { status: 400 });
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return NextResponse.json({ 
        message: "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre" 
      }, { status: 400 });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await hashPassword(newPassword);
    
    // Mettre à jour le mot de passe
    await UserCollection.updateOne(
      { email: email },
      { $set: { password: hashedPassword } }
    );

    return NextResponse.json({ 
      message: "Mot de passe mis à jour avec succès" 
    }, { status: 200 });
    
  } catch (error) {
    console.error("Erreur lors de la mise à jour du mot de passe:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
};
