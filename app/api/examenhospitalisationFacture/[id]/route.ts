import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { ExamenHospitalisation } from "@/models/examenHospit";
import { LignePrestation } from "@/models/lignePrestation";
import { Facturation } from "@/models/Facturation";
import { Assurance } from "@/models/assurance";
import { db } from "@/db/mongoConnect";

// Fonction pour valider les ObjectIds
const isValidObjectId = (value: any): boolean => {
  if (!value) return false;
  if (typeof value !== 'string') return false;
  return mongoose.Types.ObjectId.isValid(value) && String(new mongoose.Types.ObjectId(value)) === value;
};

// Fonction pour nettoyer le payload et convertir les ObjectIds invalides
const cleanPayload = (payload: any): any => {
  const cleaned = { ...payload };

  // Liste des champs qui doivent être des ObjectIds
  const objectIdFields = [
    'IDASSURANCE',
    'IDSOCIETEASSURANCE',
    'IdPatient',
    'idMedecin',
    'IDSOCIETEPARTENAIRE',
    'IDCHAMBRE',
  ];

  objectIdFields.forEach((field) => {
    if (field in cleaned) {
      const value = cleaned[field];

      // Si la valeur est "RAS" ou autre string invalide, la supprimer
      if (value === "RAS" || value === "" || (typeof value === 'string' && !isValidObjectId(value))) {
        delete cleaned[field];
      }
      // Si c'est un ObjectId valide, le garder
      else if (typeof value === 'string' && isValidObjectId(value)) {
        cleaned[field] = new mongoose.Types.ObjectId(value);
      }
    }
  });

  return cleaned;
};


export async function GET(req: NextRequest) {
  try {
    await db();
    const { searchParams } = new URL(req.url);
    const codePrestation = searchParams.get("codePrestation");
    const typeActe = searchParams.get("typeActe");

    if (!codePrestation || !typeActe) {
      return NextResponse.json(
        { error: "Paramètres manquants", message: "Code prestation et type acte requis" },
        { status: 400 }
      );
    }

    const examen = await ExamenHospitalisation.findOne({
      Code_Prestation: codePrestation,
      Designationtypeacte: typeActe,
    }).lean();

    if (!examen) {
      return NextResponse.json({ error: "Examen introuvable" }, { status: 404 });
    }

    return NextResponse.json(examen);
  } catch (error: any) {
    console.error("Erreur GET examenhospitalisation:", error);
    return NextResponse.json({ error: "Erreur serveur", message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await db();
    const body = await req.json();
    const { header, lignes, Recupar } = body;

    if (!header || !Array.isArray(lignes) || lignes.length === 0) {
      return NextResponse.json(
        { error: "Payload invalide", message: "Header et lignes requis" },
        { status: 400 }
      );
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    // Nettoyer le header avant la mise à jour/création
    const cleanedHeader = cleanPayload(header);

    let savedExamen;
    if (header._id) {
      savedExamen = await ExamenHospitalisation.findByIdAndUpdate(
        header._id,
        { ...cleanedHeader, updatedAt: new Date() },
        { new: true, session }
      );
      if (!savedExamen) throw new Error("Examen introuvable pour mise à jour");
    } else {
      const created = await ExamenHospitalisation.create([cleanedHeader], { session });
      savedExamen = Array.isArray(created) ? created[0] : created;
    }

    const factData = {
      ...cleanedHeader,
      idHospitalisation: savedExamen._id,
      DateFacturation: new Date(),
      Heure_Facturation: new Date().toLocaleTimeString("fr-FR"),
      SaisiPar: Recupar,
    };

    const createdFacture = await Facturation.create([factData], { session });
    const factureSaved = Array.isArray(createdFacture) ? createdFacture[0] : createdFacture;

    // Enregistrement des lignes
    await Promise.all(
      lignes.map(async (l: any) => {
        const ligneDoc = {
          ...l,
          idHospitalisation: savedExamen._id,
          idFacturation: factureSaved._id,
          dateLignePrestation: new Date(),
        };
        if (l.IDLignePrestation) {
          await LignePrestation.findByIdAndUpdate(l.IDLignePrestation, ligneDoc, { session });
        } else {
          await LignePrestation.create([ligneDoc], { session });
        }
      })
    );

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({
      success: true,
      message: header._id ? "Examen mis à jour" : "Examen créé",
      id: savedExamen._id,
      lignesCount: lignes.length,
    });
  } catch (error: any) {
    console.error("Erreur POST /api/examenhospitalisationFacture:", error);
    return NextResponse.json(
      { error: "Erreur serveur", message: error.message || "Une erreur est survenue" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await db();
    const { id } = await params;
    const body = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID manquant", message: "L'identifiant de l'examen est requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'examen existe
    const existing = await ExamenHospitalisation.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Examen introuvable", message: "L'examen à mettre à jour n'existe pas" },
        { status: 404 }
      );
    }

    console.log("🔄 Mise à jour ExamenHospitalisation:", { id, bodyKeys: Object.keys(body) });

    // Nettoyer le payload pour éliminer les ObjectIds invalides
    const cleanedBody = cleanPayload(body);

    console.log("✨ Payload nettoyé:", { cleanedKeys: Object.keys(cleanedBody) });

    // Mettre à jour l'examen
    const updated = await ExamenHospitalisation.findByIdAndUpdate(
      id,
      { ...cleanedBody, updatedAt: new Date() },
      { new: true, runValidators: false }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Examen introuvable", message: "L'examen à mettre à jour n'existe pas après mise à jour" },
        { status: 404 }
      );
    }

    console.log("✅ Examen mis à jour avec succès:", updated._id);

    return NextResponse.json({
      success: true,
      message: "Examen mis à jour avec succès",
      id: updated._id,
      data: updated,
    });
  } catch (error: any) {
    console.error("Erreur PUT /api/examenhospitalisationFacture/[id]:", error);
    return NextResponse.json(
      { error: "Erreur serveur", message: error.message || "Une erreur est survenue lors de la mise à jour" },
      { status: 500 }
    );
  }
}
