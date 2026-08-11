import { IMedecin } from "@/models/medecin";
import { UserCollection } from "@/models/users.model";
import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/utils/auth";
import { getImpersonateEntrepriseId } from "@/lib/auth";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";

const READ_ROLES = ["admin", "medecin", "accueil", "caisse", "comptable", "biologiste", "infirmier"];
const WRITE_ROLES = ["admin"];

export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, READ_ROLES);
  if (!context) return response;
  const Medecin = getTenantModel<IMedecin>(context.connection, "Medecin");
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

export async function POST(req: NextRequest) {
  const { context, response } = await withTenant(req, WRITE_ROLES);
  if (!context) return response;
  const Medecin = getTenantModel<IMedecin>(context.connection, "Medecin");
  try {
    const body = await req.json();
    const impersonatedEntrepriseId = await getImpersonateEntrepriseId(req);
    const tenantEntrepriseId = context.user.type === "adminsuper"
      ? (impersonatedEntrepriseId || context.user.entrepriseId)
      : context.user.entrepriseId;

    let entrepriseId = body.entrepriseId || req.headers.get("x-entreprise-id") || tenantEntrepriseId || null;

    if (context.user.type !== "adminsuper" && (!tenantEntrepriseId || !entrepriseId || String(tenantEntrepriseId) !== String(entrepriseId))) {
      return NextResponse.json(
        { error: "L'entreprise du médecin doit correspondre au tenant de l'utilisateur." },
        { status: 403 }
      );
    }

    if (context.user.type === "adminsuper" && tenantEntrepriseId && entrepriseId && String(tenantEntrepriseId) !== String(entrepriseId)) {
      return NextResponse.json(
        { error: "L'entreprise du médecin ne correspond pas au tenant courant." },
        { status: 403 }
      );
    }

    if (!entrepriseId) {
      return NextResponse.json({ error: "Une entreprise valide est requise pour créer un médecin." }, { status: 400 });
    }

    console.log("🏢 Création médecin avec entrepriseId:", entrepriseId);
    console.log("📧 Email utilisé comme mot de passe:", body.EmailMed);

    body.entrepriseId = entrepriseId;

    const newMedecin = await Medecin.create(body);

    if (!body.userId && body.EmailMed) {
      try {
        const existingUser = await UserCollection.findOne({
          email: body.EmailMed,
          entrepriseId: entrepriseId,
        });

        if (!existingUser) {
          const userType = body.specialite === "Radiologie" ? "radiologue" : "medecin";
          const hashedPassword = await hashPassword(body.EmailMed);

          const newUser = new UserCollection({
            nom: body.nom,
            prenom: body.prenoms,
            email: body.EmailMed,
            type: userType,
            entrepriseId: entrepriseId,
            uid: `medecin_${newMedecin._id}`,
            password: hashedPassword,
          });

          await newUser.save();
          await Medecin.findByIdAndUpdate(newMedecin._id, { userId: newUser._id });

          console.log(`✅ Utilisateur créé automatiquement pour le médecin ${body.EmailMed}`);
          console.log(`🔐 Mot de passe par défaut: ${body.EmailMed} (email = mot de passe, hashé et sécurisé)`);
        }
      } catch (userError) {
        console.error("❌ Erreur lors de la création de l'utilisateur associé:", userError);
      }
    }

    return NextResponse.json(newMedecin, { status: 201 });
  } catch (error) {
    console.error("Erreur ajout médecin:", error);
    return NextResponse.json({ error: "Erreur ajout médecin" }, { status: 500 });
  }
}
