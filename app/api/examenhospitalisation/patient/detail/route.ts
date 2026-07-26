import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ExamenHospitalisation } from "@/models/examenHospit";
import { Types } from "mongoose";

// GET /api/examenhospitalisation/patient/detail?patientId=xxx
// Retourne TOUS les examenhospit d'un patient sans filtrer par type d'acte
export async function GET(req: NextRequest) {
  try {
    await db();
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    const codePrestation = searchParams.get("codePrestation");

    if (!patientId && !codePrestation) {
      return NextResponse.json(
        { error: "Paramètre manquant", message: "patientId ou codePrestation requis" },
        { status: 400 }
      );
    }

    let query: any = {
      Entrele: { $exists: true },
    };

    if (patientId) {
      if (Types.ObjectId.isValid(patientId)) {
        query.IdPatient = new Types.ObjectId(patientId);
      } else {
        query.IdPatient = patientId;
      }
    }

    if (codePrestation) {
      query.CodePrestation = codePrestation;
    }

    const hospitalisations = await ExamenHospitalisation.find(query)
      .sort({ Entrele: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: hospitalisations,
      total: hospitalisations.length,
    });
  } catch (error: any) {
    console.error("Erreur GET /api/examenhospitalisation/patient/detail:", error);
    return NextResponse.json(
      { error: "Erreur serveur", message: error.message || "Impossible de récupérer les données" },
      { status: 500 }
    );
  }
}
