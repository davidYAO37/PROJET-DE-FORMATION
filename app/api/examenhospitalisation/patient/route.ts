import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ExamenHospitalisation } from "@/models/examenHospit";
import { TypeActe } from "@/models/TypeActe";
import { Types } from "mongoose";

// GET /api/examenhospitalisation/patient?patientId=xxx
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

    // Types d'actes marqués comme hospitalisation
    const actesHospitalisation = await TypeActe.find({
      Hospitalisation: true,
    }).lean();
    const designationActes = actesHospitalisation.map((acte) => acte.Designation);

    let query: any = {
      Designationtypeacte: { $in: designationActes },
      Entrele: { $exists: true },
    };

    if (Types.ObjectId.isValid(patientId)) {
      query.IdPatient = new Types.ObjectId(patientId);
    } else {
      query.IdPatient = patientId;
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
    console.error("Erreur GET /api/examenhospitalisation/patient:", error);
    return NextResponse.json(
      { error: "Erreur serveur", message: error.message || "Impossible de récupérer les hospitalisations" },
      { status: 500 }
    );
  }
}
