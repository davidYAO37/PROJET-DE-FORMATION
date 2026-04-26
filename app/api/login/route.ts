import { db } from "@/db/mongoConnect";
import { UserCollection } from "@/models/users.model";
import { NextResponse } from "next/server";
import { verifyPassword } from "@/utils/auth";

export const POST = async (req: Request) => {
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({ message: "Email et mot de passe requis" }, { status: 400 });
    }

    await db();
    
    // Rechercher l'utilisateur par email
    const user = await UserCollection.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "Email ou mot de passe incorrect" }, { status: 401 });
    }

    // Vérifier si le compte est verrouillé
    if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingTime = Math.ceil((user.lockedUntil.getTime() - new Date().getTime()) / (1000 * 60));
      return NextResponse.json({ 
        message: `Compte temporairement bloqué. Réessayez dans ${remainingTime} minutes.`,
        isLocked: true,
        lockedUntil: user.lockedUntil
      }, { status: 423 });
    }

    // Vérifier le mot de passe
    if (!user.password) {
      return NextResponse.json({ message: "Compte non configuré pour la connexion locale" }, { status: 401 });
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      // Incrémenter le nombre de tentatives échouées
      const newFailedAttempts = (user.failedAttempts || 0) + 1;
      const remainingAttempts = 4 - newFailedAttempts;
      
      // Mettre à jour l'utilisateur
      await UserCollection.findByIdAndUpdate(user._id, {
        failedAttempts: newFailedAttempts,
        remainingAttempts: remainingAttempts
      });

      // Si c'est la 4ème tentative, bloquer le compte pour 30 minutes
      if (newFailedAttempts >= 4) {
        const lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        await UserCollection.findByIdAndUpdate(user._id, {
          isLocked: true,
          lockedUntil: lockedUntil,
          failedAttempts: newFailedAttempts,
          remainingAttempts: 0
        });
        
        return NextResponse.json({ 
          message: "Compte bloqué après 4 tentatives échouées. Contactez un administrateur.",
          isLocked: true,
          remainingAttempts: 0,
          maxAttempts: 4
        }, { status: 423 });
      }

      return NextResponse.json({ 
        message: `Email ou mot de passe incorrect. ${remainingAttempts} tentative${remainingAttempts > 1 ? 's' : ''} restante${remainingAttempts > 1 ? 's' : ''}.`,
        remainingAttempts: remainingAttempts,
        maxAttempts: 4
      }, { status: 401 });
    }

    // Réinitialiser les compteurs en cas de succès
    await UserCollection.findByIdAndUpdate(user._id, {
      failedAttempts: 0,
      remainingAttempts: 4,
      isLocked: false,
      lockedUntil: null
    });

    // Retourner les informations utilisateur (sans le mot de passe)
    const userResponse = {
      _id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      type: user.type,
      entrepriseId: user.entrepriseId,
      uid: user.uid,
      isLocked: user.isLocked || false,
      failedAttempts: 0,
      remainingAttempts: 4
    };

    return NextResponse.json({ 
      message: "Connexion réussie", 
      user: userResponse 
    }, { status: 200 });
    
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
