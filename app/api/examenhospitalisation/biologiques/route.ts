import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ExamenHospitalisation } from "@/models/examenHospit";
import { Types } from "mongoose";

// GET /api/examenhospitalisation/biologiques?patientId=xxx
// Retourne les examens biologiques d'un patient
export async function GET(req: NextRequest) {
  try {
    await db();
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { error: "Paramètre manquant", message: "patientId est requis" },
        { status: 400 }
      );
    }

    let query: any = {
      Designationtypeacte: "EXAMEN BIOLOGIQUE",
    };

    if (Types.ObjectId.isValid(patientId)) {
      query.IdPatient = new Types.ObjectId(patientId);
    } else {
      query.IdPatient = patientId;
    }

    const examensBiologiques = await ExamenHospitalisation.find(query)
      .sort({ DatePres: -1, Entrele: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: examensBiologiques,
      total: examensBiologiques.length,
    });
  } catch (error: any) {
    console.error("Erreur GET /api/examenhospitalisation/biologiques:", error);
    return NextResponse.json(
      { error: "Erreur serveur", message: error.message || "Impossible de récupérer les examens biologiques" },
      { status: 500 }
    );
  }
}
