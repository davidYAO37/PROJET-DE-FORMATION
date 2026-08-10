import { db } from "@/db/mongoConnect";
import { UserCollection } from "@/models/users.model";
import { IMedecin } from "@/models/medecin";
import { NextRequest, NextResponse } from "next/server";
import { hashPassword, generateLocalUID } from "@/utils/auth";
import { requireAuth } from "@/lib/auth";
import { getTenantConnection } from "@/lib/tenantDb";
import { getTenantModel } from "@/lib/tenantModels";

export const POST = async (req: NextRequest) => {
  try {
    const { user: currentUser, error } = await requireAuth(req, ["admin"]);
    if (error) return error;

    await db();
    const user = await req.json();

    // Un admin (non super) ne peut créer des utilisateurs que pour sa propre entreprise
    if (currentUser!.type !== "adminsuper") {
      user.entrepriseId = currentUser!.entrepriseId;
    }

    // Vérifier si l'email existe déjà
    const exist = await UserCollection.findOne({ email: user.email });
    if (exist) {
      return NextResponse.json({ message: "Cet email est déjà enregistré" }, { status: 400 });
    }

    // Hasher le mot de passe et générer un UID local
    const hashedPassword = await hashPassword(user.password || user.email); // Utiliser l'email comme mot de passe par défaut
    const localUID = generateLocalUID();

    const newUser = new UserCollection({
      ...user,
      password: hashedPassword,
      uid: localUID
    });
    await newUser.save();

    // Si l'utilisateur est un médecin ou radiologue, créer automatiquement son profil médecin
    if (user.type === "medecin" || user.type === "radiologue") {
      try {
        const tenantConnection = await getTenantConnection(user.entrepriseId);
        const Medecin = getTenantModel<IMedecin>(tenantConnection, "Medecin");
        const newMedecin = new Medecin({
          nom: user.nom,
          prenoms: user.prenom,
          EmailMed: user.email,
          entrepriseId: user.entrepriseId,
          userId: newUser._id,
          specialite: user.type === "radiologue" ? "Radiologie" : undefined
        });
        await newMedecin.save();
        console.log(`✅ Profil médecin créé automatiquement pour ${user.email}`);
      } catch (medecinError) {
        console.error("❌ Erreur lors de la création du profil médecin:", medecinError);
        // Ne pas bloquer la création de l'utilisateur si le profil médecin échoue
      }
    }

    return NextResponse.json({ 
      message: "Utilisateur ajouté avec succès", 
      user: {
        nom: newUser.nom,
        prenom: newUser.prenom,
        email: newUser.email,
        type: newUser.type,
        uid: newUser.uid
      }
    }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
