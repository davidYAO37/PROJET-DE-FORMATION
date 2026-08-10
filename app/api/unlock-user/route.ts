import { db } from "@/db/mongoConnect";
import { UserCollection } from "@/models/users.model";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export const POST = async (req: NextRequest) => {
  try {
    const { user: currentUser, error } = await requireAuth(req, ["admin"]);
    if (error) return error;

    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ message: "Email requis" }, { status: 400 });
    }

    await db();
    
    // Rechercher l'utilisateur par email
    const user = await UserCollection.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 });
    }

    if (
      currentUser!.type !== "adminsuper" &&
      String(user.entrepriseId) !== String(currentUser!.entrepriseId)
    ) {
      return NextResponse.json({ message: "Accès interdit" }, { status: 403 });
    }

    // Débloquer le compte
    await UserCollection.findByIdAndUpdate(user._id, {
      failedAttempts: 0,
      remainingAttempts: 4,
      isLocked: false,
      lockedUntil: null
    });

    console.log(`✅ Compte ${email} débloqué par l'administrateur`);

    return NextResponse.json({ 
      message: "Compte débloqué avec succès",
      user: {
        _id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        type: user.type,
        isLocked: false,
        remainingAttempts: 4
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error("Erreur lors du déblocage du compte :", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
