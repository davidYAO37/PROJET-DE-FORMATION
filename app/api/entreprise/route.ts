import { db } from "@/db/mongoConnect";
import { Entreprise } from "@/models/entreprise";
import { NextRequest, NextResponse } from "next/server";
import { buildLogoDataUrlFromUpload } from "@/lib/entrepriseLogo";
import { buildDbNameFromNomSociete, slugify } from "@/lib/slugify";
import { seedDefaultTenantData } from "@/lib/seedTenantData";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth(req, ["adminsuper"]);
  if (error) return error;

  await db();
  try {
    const entreprises = await Entreprise.find(
      {},
      { mongoUri: 0, licenceKey: 0 }
    );
    return NextResponse.json(entreprises);
  } catch {
    return NextResponse.json({ error: "Erreur récupération entreprises" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(req, ["adminsuper"]);
  if (error) return error;

  await db();
  try {
    const formData = await req.formData();
    
    // Extraire les données du formulaire
    const NomSociete = formData.get("NomSociete") as string;
    const EnteteSociete = formData.get("EnteteSociete") as string;
    const PiedPageSociete = formData.get("PiedPageSociete") as string;
    const LogoE = formData.get("LogoE") as string;
    const NCC = formData.get("NCC") as string;
    const requestedDbName = (formData.get("dbName") as string) || "";
    const logoFile = formData.get("logoFile") as File | null;

    let dbName = requestedDbName.trim()
      ? `bd_${slugify(requestedDbName.replace(/^bd_/, ""))}`
      : buildDbNameFromNomSociete(NomSociete);

    const existingWithDbName = await Entreprise.findOne({ dbName });
    if (existingWithDbName) {
      return NextResponse.json(
        { error: `Le nom de base "${dbName}" est déjà utilisé par une autre entreprise` },
        { status: 409 }
      );
    }

    let mongoUri: string | undefined;
    const baseMongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (baseMongoUri) {
      try {
        const url = new URL(baseMongoUri);
        url.pathname = `/${dbName}`;
        mongoUri = url.toString();
      } catch {
        mongoUri = undefined;
      }
    }

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
      dbName,
      mongoUri,
    };

    const newEntreprise = await Entreprise.create(entrepriseData);
    console.log("Entreprise créé:", newEntreprise);

    // Copier les données de paramétrage par défaut (bd_esaymed) vers la base
    // dédiée de la nouvelle entreprise, si celle-ci dispose de sa propre base.
    try {
      const seedResults = await seedDefaultTenantData(newEntreprise._id.toString());
      console.log("Seed des données par défaut:", seedResults);
    } catch (seedError) {
      console.error("Erreur lors du seed des données par défaut:", seedError);
      // Ne bloque pas la création de l'entreprise si le seed échoue
    }

    const { mongoUri: _omit, licenceKey: _omit2, ...safeEntreprise } = newEntreprise.toObject();
    return NextResponse.json(safeEntreprise, { status: 201 });
  } catch (error: any) {
    if (error?.code === 11000 && error?.keyPattern?.dbName) {
      return NextResponse.json(
        { error: "Le nom de base est déjà utilisé par une autre entreprise" },
        { status: 409 }
      );
    }
    console.error("Erreur ajout entreprise:", error);
    return NextResponse.json({ error: "Erreur ajout entreprise" }, { status: 500 });
  }
}
