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
    const planningId = searchParams.get('planningId');
    const entrepriseId = searchParams.get('entrepriseId');

    console.log('🔍 Récupération des rendez-vous pour un planning:', planningId);

    if (!planningId) {
      return NextResponse.json({ error: "ID du planning requis" }, { status: 400 });
    }

    // Construire la requête
    const query: any = {
      IDPLANNING_MED: planningId
    };

    if (entrepriseId) {
      query.entrepriseId = entrepriseId;
    }

    // Récupérer les rendez-vous pour ce planning spécifique
    const rendezVous = await RendezVous.find(query)
      .sort({ HeureRDV: 1 }) // Trier par heure
      .lean();

    console.log(`📊 ${rendezVous.length} rendez-vous trouvés pour le planning ${planningId}`);

    return NextResponse.json(rendezVous, { status: 200 });

  } catch (error) {
    console.error("❌ Erreur lors de la récupération des rendez-vous:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des rendez-vous", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
