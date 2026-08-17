import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { UserCollection } from "@/models/users.model";
import { verifyPassword, hashPassword } from "@/utils/auth";
import { requireAuth } from "@/lib/auth";

// IMPORTANT : ce endpoint ne doit JAMAIS être appelable sans authentification.
// Auparavant il ne vérifiait ni session ni ancien mot de passe côté serveur
// (la vérification de l'ancien mot de passe n'existait que côté client via un
// appel séparé à /api/login) : n'importe qui connaissant l'email d'un compte
// (y compris admin/adminsuper) pouvait réinitialiser son mot de passe et en
// prendre le contrôle. Désormais :
//  - un utilisateur ne peut changer QUE son propre mot de passe, et doit
//    fournir son ancien mot de passe (vérifié côté serveur) ;
//  - un admin/adminsuper peut réinitialiser le mot de passe d'un autre
//    utilisateur de SA propre entreprise, sans ancien mot de passe.
export const POST = async (req: NextRequest) => {
  try {
    const { user: currentUser, error } = await requireAuth(req);
    if (error) return error;

    const { email, oldPassword, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json({ message: "Email et nouveau mot de passe requis" }, { status: 400 });
    }

    await db();

    // Rechercher l'utilisateur cible par email
    const targetUser = await UserCollection.findOne({ email: String(email).toLowerCase().trim() });
    if (!targetUser) {
      return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 });
    }

    const isSelf = String(targetUser._id) === String(currentUser!._id);
    const isAdminOfSameEntreprise =
      (currentUser!.type === "admin" &&
        targetUser.entrepriseId &&
        String(targetUser.entrepriseId) === String(currentUser!.entrepriseId)) ||
      currentUser!.type === "adminsuper";

    if (!isSelf && !isAdminOfSameEntreprise) {
      return NextResponse.json({ message: "Accès interdit" }, { status: 403 });
    }

    if (isSelf) {
      // Un utilisateur qui change son propre mot de passe doit prouver
      // l'ancien, vérifié ici côté serveur (jamais côté client uniquement).
      if (!oldPassword || !targetUser.password) {
        return NextResponse.json({ message: "Ancien mot de passe requis" }, { status: 400 });
      }
      const validOldPassword = await verifyPassword(oldPassword, targetUser.password);
      if (!validOldPassword) {
        return NextResponse.json({ message: "Ancien mot de passe incorrect" }, { status: 401 });
      }
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
      { _id: targetUser._id },
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
