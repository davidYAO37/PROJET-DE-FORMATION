import { IRendezVous } from "@/models/RendezVous";
import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";

const READ_ROLES = ["admin", "medecin", "accueil", "caisse", "comptable", "infirmier"];

export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, READ_ROLES);
  if (!context) return response;
  const RendezVous = getTenantModel<IRendezVous>(context.connection, "RendezVous");
  try {
    const { searchParams } = new URL(req.url);
    const planningIds = searchParams.get('planningIds');
    const entrepriseId = searchParams.get('entrepriseId');

    console.log('🔍 Récupération des rendez-vous par plannings:', planningIds);

    if (!planningIds) {
      return NextResponse.json({ error: "IDs des plannings requis" }, { status: 400 });
    }

    const planningIdArray = planningIds.split(',').filter(id => id.trim());
    
    if (planningIdArray.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Construire la requête
    const query: any = {
      IDPLANNING_MED: { $in: planningIdArray }
    };

    if (entrepriseId) {
      query.entrepriseId = entrepriseId;
    }

    // Récupérer les rendez-vous
    const rendezVous = await RendezVous.find(query)
      .sort({ HeureRDV: 1 }) // Trier par heure
      .lean();

    console.log(`📊 ${rendezVous.length} rendez-vous trouvés`);

    return NextResponse.json(rendezVous, { status: 200 });

  } catch (error) {
    console.error("❌ Erreur lors de la récupération des rendez-vous:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des rendez-vous", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
