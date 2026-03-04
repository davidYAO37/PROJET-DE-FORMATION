import { db } from "@/db/mongoConnect";
import { Entreprise } from "@/models/entreprise";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await db();
  const { id } = await params;
  try {
    const entreprise = await Entreprise.findById(id);
    if (!entreprise) return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });
    return NextResponse.json(entreprise);
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

      // Si un nouveau fichier est fourni, le sauvegarder
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
          
          console.log("Nouveau fichier logo sauvegardé:", logoPath);
        } catch (fileError) {
          console.error("Erreur sauvegarde fichier:", fileError);
          // Continuer avec le chemin existant si la sauvegarde échoue
        }
      }

      updateData = {
        NomSociete,
        EnteteSociete,
        PiedPageSociete,
        LogoE: logoPath,
        NCC
      };
      
      console.log("Données FormData reçues pour modification entreprise:", {
        ...updateData,
        hasNewLogoFile: !!logoFile
      });
    } else {
      // Gérer JSON (ancien format)
      const body = await req.json();
      updateData = body;
      console.log("Données JSON reçues pour modification entreprise:", body);
    }
    
    const updated = await Entreprise.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });
    
    console.log("Entreprise modifiée:", updated);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur update entreprise:", error);
    return NextResponse.json({ error: "Erreur update" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await db();
  const { id } = await params;
  try {
    await Entreprise.findByIdAndDelete(id);
    return NextResponse.json({ message: "Entreprise supprimée" });
  } catch {
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
