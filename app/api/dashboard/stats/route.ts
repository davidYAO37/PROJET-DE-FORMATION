import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IPatient } from "@/models/patient";
import { IRendezVous } from "@/models/RendezVous";

const ROLES = ["admin", "medecin", "accueil", "caisse", "comptable", "infirmier", "biologiste", "radiologue", "pharmacien", "technicienlabo", "facturation"];

export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, ROLES);
  if (!context) return response;

  const Patient = getTenantModel<IPatient>(context.connection, "Patient");
  const RendezVous = getTenantModel<IRendezVous>(context.connection, "RendezVous");

  try {
    const totalPatients = await Patient.countDocuments({});

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayEnd = `${todayStr}T23:59:59.999Z`;

    const rendezVousAujourdhui = await RendezVous.countDocuments({
      DateDisponinibilite: { $gte: todayStr, $lte: todayEnd },
      StatutRdv: { $in: ["1", "2"] }
    });

    return NextResponse.json({
      totalPatients,
      rendezVousAujourdhui,
    });
  } catch (error) {
    console.error("Erreur API /api/dashboard/stats:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des statistiques" },
      { status: 500 }
    );
  }
}
