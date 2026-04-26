import { db } from "@/db/mongoConnect";
import { Medecin } from "@/models/medecin";
import { UserCollection } from "@/models/users.model";
import { NextResponse } from "next/server";
import { hashPassword } from "@/utils/auth";

export async function GET(req: Request) {
  await db();
  try {
    const { searchParams } = new URL(req.url);
    const entrepriseId = searchParams.get("entrepriseId");

    let medecins;
    if (entrepriseId) {
      medecins = await Medecin.find({ entrepriseId });
    } else {
      medecins = await Medecin.find({});
    }
    
    return NextResponse.json(medecins);
  } catch (error) {
    console.error('Erreur API médecins:', error);
    return NextResponse.json({ error: "Erreur récupération médecins" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await db();
  try {
    const body = await req.json();
    
    // Récupérer l'entrepriseId depuis le corps ou le header
    let entrepriseId = body.entrepriseId;
    
    // Si pas dans le corps, essayer de le récupérer depuis les headers
    if (!entrepriseId) {
      entrepriseId = req.headers.get('x-entreprise-id');
    }
    
    // Si toujours pas trouvé, utiliser une valeur par défaut ou null
    if (!entrepriseId) {
      console.log("⚠️ Aucun entrepriseId trouvé, utilisateur créé sans entreprise");
      entrepriseId = null;
    }
    
    console.log("🏢 Création médecin avec entrepriseId:", entrepriseId);
    console.log("📧 Email utilisé comme mot de passe:", body.EmailMed);
    
    // Ajouter l'entrepriseId au corps pour utilisation ultérieure
    body.entrepriseId = entrepriseId;
    
    const newMedecin = await Medecin.create(body);

    // Synchronisation inverse : créer un utilisateur si le médecin n'a pas de userId
    if (!body.userId && body.EmailMed) {
      try {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await UserCollection.findOne({ email: body.EmailMed });
        if (!existingUser) {
          // Déterminer le type en fonction de la spécialité
          const userType = body.specialite === "Radiologie" ? "radiologue" : "medecin";
          
          // Hasher le mot de passe (utiliser l'email comme mot de passe par défaut)
          const hashedPassword = await hashPassword(body.EmailMed);
          
          const newUser = new UserCollection({
            nom: body.nom,
            prenom: body.prenoms,
            email: body.EmailMed,
            type: userType,
            entrepriseId: entrepriseId, // Utilise l'entrepriseId de la requête
            uid: `medecin_${newMedecin._id}`,
            password: hashedPassword // Mot de passe hashé = email
          });
          
          await newUser.save();
          
          // Mettre à jour le médecin avec le userId
          await Medecin.findByIdAndUpdate(newMedecin._id, { userId: newUser._id });
          
          console.log(`✅ Utilisateur créé automatiquement pour le médecin ${body.EmailMed}`);
          console.log(`🔐 Mot de passe par défaut: ${body.EmailMed} (email = mot de passe, hashé et sécurisé)`);
        }
      } catch (userError) {
        console.error("❌ Erreur lors de la création de l'utilisateur associé:", userError);
        // Ne pas bloquer la création du médecin
      }
    }

    return NextResponse.json(newMedecin, { status: 201 });
  } catch (error) {
    console.error("Erreur ajout médecin:", error);
    return NextResponse.json({ error: "Erreur ajout médecin" }, { status: 500 });
  }
}
