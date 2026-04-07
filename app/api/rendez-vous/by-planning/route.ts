import { db } from "@/db/mongoConnect";
import { RendezVous } from "@/models/RendezVous";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  await db();
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
