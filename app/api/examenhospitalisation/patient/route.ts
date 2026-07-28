import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ExamenHospitalisation } from "@/models/examenHospit";
import { TypeActe } from "@/models/TypeActe";
import { Types } from "mongoose";
import { Chambre } from "@/models/chambre";
import { Lit } from "@/models/lit";

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
      .populate('IDCHAMBRE', 'numero type')
      .populate('litId', 'numero')
      .sort({ Entrele: -1 })
      .lean();

    const formattedHospitalisations = hospitalisations.map((h: any) => ({
      ...h,
      chambreNumero: h.IDCHAMBRE?.numero || h.Chambre || null,
      chambreType: h.IDCHAMBRE?.type || null,
      litNumero: h.litId?.numero || null,
    }));

    return NextResponse.json({
      success: true,
      data: formattedHospitalisations,
      total: formattedHospitalisations.length,
    });
  } catch (error: any) {
    console.error("Erreur GET /api/examenhospitalisation/patient:", error);
    return NextResponse.json(
      { error: "Erreur serveur", message: error.message || "Impossible de récupérer les hospitalisations" },
      { status: 500 }
    );
  }
}
