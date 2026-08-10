import { db } from "@/db/mongoConnect";
import { Entreprise } from "@/models/entreprise";
import { User } from "@/models/users.model";
import { NextRequest, NextResponse } from "next/server";
import { buildLogoDataUrlFromUpload } from "@/lib/entrepriseLogo";
import { closeTenantConnection } from "@/lib/tenantDb";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Tout utilisateur authentifié peut consulter les infos (logo/entête) de SA PROPRE
  // entreprise (utilisé pour l'habillage du dashboard). Seul adminsuper peut consulter
  // n'importe quelle entreprise.
  const { user: currentUser, error } = await requireAuth(req);
  if (error) return error;

  const { id } = await params;

  if (currentUser!.type !== "adminsuper" && currentUser!.entrepriseId !== id) {
    return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
  }

  await db();
  try {
    const entreprise = await Entreprise.findById(id, { mongoUri: 0, licenceKey: 0 });
    if (!entreprise) return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });
    return NextResponse.json(entreprise);
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(req, ["adminsuper"]);
  if (error) return error;

  await db();
  const { id } = await params;
  try {
    // Vérifier si c'est du FormData ou du JSON
    const contentType = req.headers.get("content-type") || "";
    
    let updateData: any;
    
    if (contentType.includes("multipart/form-data")) {
      // Gérer FormData
      const formData = await req.formData();
      
      // Extraire les données du formulaire
      const NomSociete = formData.get("NomSociete") as string;
      const EnteteSociete = formData.get("EnteteSociete") as string;
      const PiedPageSociete = formData.get("PiedPageSociete") as string;
      const LogoE = formData.get("LogoE") as string;
      const NCC = formData.get("NCC") as string;
      const logoFile = formData.get("logoFile") as File | null;

      let logoPath = LogoE; // Par défaut, garde le chemin existant

      if (logoFile && typeof logoFile !== "string") {
        try {
          const bytes = await logoFile.arrayBuffer();
          const buffer = Buffer.from(bytes);
          logoPath = buildLogoDataUrlFromUpload(logoFile, buffer);
        } catch (fileError) {
          console.error("Erreur traitement logo:", fileError);
          return NextResponse.json(
            {
              error:
                fileError instanceof Error
                  ? fileError.message
                  : "Erreur lors du traitement du logo",
            },
            { status: 400 }
          );
        }
      }

      updateData = {
        NomSociete,
        EnteteSociete,
        PiedPageSociete,
        LogoE: logoPath,
        NCC
      };
     
    } else {
      // Gérer JSON (ancien format)
      const body = await req.json();
      updateData = body;
      console.log("Données JSON reçues pour modification entreprise:", body);
    }

    // dbName / mongoUri ne doivent jamais être modifiés après création
    // (changer la base d'une entreprise existante ferait perdre l'accès à ses données)
    delete updateData.dbName;
    delete updateData.mongoUri;

    const updated = await Entreprise.findByIdAndUpdate(id, updateData, {
      new: true,
      projection: { mongoUri: 0, licenceKey: 0 },
    });
    if (!updated) return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });
    
    console.log("Entreprise modifiée:", updated);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur update entreprise:", error);
    return NextResponse.json({ error: "Erreur update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(req, ["adminsuper"]);
  if (error) return error;

  await db();
  const { id } = await params;
  try {
    const usersCount = await User.countDocuments({ entrepriseId: id });
    if (usersCount > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer cette entreprise : ${usersCount} utilisateur(s) y sont encore rattaché(s). Réaffectez ou supprimez-les d'abord.`,
          usersCount,
        },
        { status: 409 }
      );
    }

    const deleted = await Entreprise.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });
    }

    await closeTenantConnection(id);

    return NextResponse.json({ message: "Entreprise supprimée" });
  } catch (error) {
    console.error("Erreur suppression entreprise:", error);
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
