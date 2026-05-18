import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ExamenHospitalisation } from "@/models/examenHospit";

export async function GET(req: NextRequest) {
  try {
    await db();
    const { searchParams } = new URL(req.url);
    const CodePrestation = searchParams.get("CodePrestation");
    const typeActe = searchParams.get("typeActe");
    const id = searchParams.get("id");

    // Si un ID est fourni, recherche par ID
    if (id) {
      const examen = await ExamenHospitalisation.findById(id).lean();
      
      if (!examen) {
        return NextResponse.json(
          { error: "Examen hospitalisation introuvable" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(examen);
    }

    // Recherche par CodePrestation et typeActe (logique existante)
    if (!CodePrestation || !typeActe) {
      return NextResponse.json(
        { 
          error: "Paramètres manquants", 
          message: "Code prestation et type acte requis, ou ID" 
        },
        { status: 400 }
      );
    }

    // Rechercher l'examen avec le code prestation et le type d'acte
    const examen = await ExamenHospitalisation.findOne({
      CodePrestation: CodePrestation,
      Designationtypeacte: typeActe
    }).lean();

    if (!examen) {
      return NextResponse.json(
        { error: "Examen introuvable avec les paramètres fournis" },
        { status: 404 }
      );
    }

    return NextResponse.json(examen);
  } catch (error: any) {
    console.error("Erreur lors de la récupération de l'examen hospitalisation:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération de l'examen hospitalisation" },
      { status: 500 }
    );
  }
}
