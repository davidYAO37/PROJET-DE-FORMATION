import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ExamenHospitalisation } from "@/models/examenHospit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await db();
    const { id } = await params;

    // Rechercher l'examen hospitalisation par ID
    const examen = await ExamenHospitalisation.findById(id).lean();

    if (!examen) {
      return NextResponse.json(
        { error: "Examen hospitalisation introuvable" },
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
