import { IPlanningMed } from "@/models/PlanningMed";
import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";

const READ_ROLES = ["admin", "medecin", "accueil", "caisse", "comptable", "infirmier"];

export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, READ_ROLES);
  if (!context) return response;
  const PlanningMed = getTenantModel<IPlanningMed>(context.connection, "PlanningMed");
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const entrepriseId = searchParams.get('entrepriseId');

    if (!date) {
      return NextResponse.json({ error: "Date requise" }, { status: 400 });
    }

    // Construire la requête pour récupérer tous les plannings de la date
    const query: any = {
      DateDebut: {
        $gte: date,
        $lte: date + 'T23:59:59.999Z'
      }
    };

    if (entrepriseId) {
      query.entrepriseId = entrepriseId;
    }

    // Récupérer tous les plannings de la date
    const plannings = await PlanningMed.find(query)
      .populate('IDMEDECIN', 'nom prenoms specialite')
      .sort({ heureDebut: 1 })
      .lean();

    console.log(`📊 ${plannings.length} plannings trouvés pour la date ${date}`);

    return NextResponse.json(plannings, { status: 200 });

  } catch (error) {
    console.error("❌ Erreur lors de la récupération des plannings:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des plannings", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
