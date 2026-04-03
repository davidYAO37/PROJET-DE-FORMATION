import { db } from "@/db/mongoConnect";
import { Entreprise } from "@/models/entreprise";
import { NextResponse } from "next/server";
import { buildLogoDataUrlFromUpload } from "@/lib/entrepriseLogo";

export async function GET() {
  await db();
  try {
    const entreprises = await Entreprise.find({});
    return NextResponse.json(entreprises);
  } catch {
    return NextResponse.json({ error: "Erreur récupération entreprises" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await db();
  try {
    const formData = await req.formData();
    
    // Extraire les données du formulaire
    const NomSociete = formData.get("NomSociete") as string;
    const EnteteSociete = formData.get("EnteteSociete") as string;
    const PiedPageSociete = formData.get("PiedPageSociete") as string;
    const LogoE = formData.get("LogoE") as string;
    const NCC = formData.get("NCC") as string;
    const logoFile = formData.get("logoFile") as File | null;

    let logoPath = LogoE; // Par défaut, utilise le nom du fichier

    // Logo : stockage data URL en base (Vercel n'a pas de disque persistant pour public/uploads)
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

    console.log("Données reçues pour ajout entreprise:", {
      NomSociete,
      EnteteSociete,
      PiedPageSociete,
      logoPath,
      NCC,
      hasLogoFile: !!logoFile
    });

    // Créer l'objet entreprise
    const entrepriseData = {
      NomSociete,
      EnteteSociete,
      PiedPageSociete,
      LogoE: logoPath,
      NCC,
    };

    const newEntreprise = await Entreprise.create(entrepriseData);
    console.log("Entreprise créé:", newEntreprise);
    
    return NextResponse.json(newEntreprise, { status: 201 });
  } catch (error) {
    console.error("Erreur ajout entreprise:", error);
    return NextResponse.json({ error: "Erreur ajout entreprise" }, { status: 500 });
  }
}
