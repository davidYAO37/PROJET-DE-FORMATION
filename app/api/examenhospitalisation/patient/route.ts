import { NextRequest, NextResponse } from "next/server";
import { IExamenHospitalisation } from "@/models/examenHospit";
import { ITypeActe } from "@/models/TypeActe";
import { Types } from "mongoose";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";

const READ_ROLES = ["admin", "medecin", "accueil", "caisse", "comptable", "biologiste", "infirmier"];

// GET /api/examenhospitalisation/patient?patientId=xxx
export async function GET(req: NextRequest) {
  try {
    const { context, response } = await withTenant(req, READ_ROLES);
    if (!context) return response;
    const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(context.connection, "ExamenHospitalisation");
    const TypeActe = getTenantModel<ITypeActe>(context.connection, "TypeActe");
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    const entrepriseId = searchParams.get("entrepriseId");

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

    if (entrepriseId) {
      query.entrepriseId = entrepriseId;
    }

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
