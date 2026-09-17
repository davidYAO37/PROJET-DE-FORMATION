import { IRendezVous } from "@/models/RendezVous";
import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";

const READ_ROLES = ["admin", "medecin", "accueil", "caisse", "comptable", "infirmier", "radiologue"];

export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, READ_ROLES);
  if (!context) return response;
  const RendezVous = getTenantModel<IRendezVous>(context.connection, "RendezVous");
  try {
    const { searchParams } = new URL(req.url);
    const planningId = searchParams.get('planningId');

    console.log('🔍 Récupération des rendez-vous pour un planning:', planningId);

    if (!planningId) {
      return NextResponse.json({ error: "ID du planning requis" }, { status: 400 });
    }

    // Récupérer les rendez-vous pour ce planning spécifique (tenant isolé par connexion)
    const rendezVous = await RendezVous.find({ IDPLANNING_MED: planningId })
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
