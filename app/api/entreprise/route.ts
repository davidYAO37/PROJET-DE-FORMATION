  import { db } from "@/db/mongoConnect";
import { Entreprise } from "@/models/entreprise";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

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

    // Si un fichier est fourni, le sauvegarder
    if (logoFile) {
      try {
        // Créer le répertoire uploads/logos s'il n'existe pas
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'logos');
        await mkdir(uploadsDir, { recursive: true });

        // Générer un nom de fichier unique
        const timestamp = Date.now();
        const fileExtension = logoFile.name.split('.').pop();
        const fileName = `${timestamp}_${logoFile.name}`;
        const filePath = join(uploadsDir, fileName);

        // Sauvegarder le fichier
        const bytes = await logoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Stocker le chemin relatif pour l'affichage
        logoPath = `/uploads/logos/${fileName}`;
        
        console.log("Fichier logo sauvegardé:", logoPath);
      } catch (fileError) {
        console.error("Erreur sauvegarde fichier:", fileError);
        // Continuer avec le nom du fichier si la sauvegarde échoue
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
