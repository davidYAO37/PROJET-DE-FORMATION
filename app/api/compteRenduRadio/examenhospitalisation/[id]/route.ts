import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IExamenHospitalisation } from "@/models/examenHospit";

const ROLES = ["admin", "medecin", "accueil", "infirmier", "radiologue"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { context, response } = await withTenant(req, ROLES);
  if (!context) return response;
  const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(context.connection, "ExamenHospitalisation");

  try {
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
