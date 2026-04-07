import { db } from "@/db/mongoConnect";
import { PlanningMed } from "@/models/PlanningMed";
import { RendezVous } from "@/models/RendezVous";
import { Medecin } from "@/models/medecin";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  await db();
  try {
    const { searchParams } = new URL(req.url);
    const planningId = searchParams.get('planningId');
    const entrepriseId = searchParams.get('entrepriseId');

    console.log('🗑️ Suppression du planning:', planningId);

    if (!planningId) {
      return NextResponse.json({ error: "ID du planning requis" }, { status: 400 });
    }

    // Vérifier que le planning existe
    const planning = await PlanningMed.findById(planningId);
    if (!planning) {
      return NextResponse.json({ error: "Planning non trouvé" }, { status: 404 });
    }

    // Vérifier l'entreprise si spécifiée
    if (entrepriseId && planning.entrepriseId !== entrepriseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Vérifier que le planning est dans le futur (en cours)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Début de journée
    
    const planningDate = new Date(planning.DateDebut);
    planningDate.setHours(0, 0, 0, 0);

    if (planningDate < today) {
      return NextResponse.json({ 
        error: "Impossible de supprimer un planning passé",
        details: "Seuls les plannings futurs ou en cours peuvent être supprimés"
      }, { status: 400 });
    }

    // Compter les rendez-vous à supprimer
    const rdvCount = await RendezVous.countDocuments({
      IDPLANNING_MED: planningId,
      entrepriseId: planning.entrepriseId
    });

    console.log(`📊 Suppression de ${rdvCount} rendez-vous associés`);

    // Supprimer d'abord tous les rendez-vous associés
    const deleteRdvResult = await RendezVous.deleteMany({
      IDPLANNING_MED: planningId,
      entrepriseId: planning.entrepriseId
    });

    // Supprimer le planning
    const deletePlanningResult = await PlanningMed.findByIdAndDelete(planningId);

    if (!deletePlanningResult) {
      return NextResponse.json({ error: "Erreur lors de la suppression du planning" }, { status: 500 });
    }

    const message = `✅ Planning du ${planningDate.toLocaleDateString('fr-FR')} supprimé avec succès!\n📊 ${deleteRdvResult.deletedCount} rendez-vous associés supprimés`;

    console.log(message);

    return NextResponse.json({ 
      message: "Planning et rendez-vous supprimés avec succès",
      details: {
        planningSupprime: 1,
        rdvSupprimes: deleteRdvResult.deletedCount,
        datePlanning: planningDate.toLocaleDateString('fr-FR')
      }
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Erreur lors de la suppression du planning:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du planning", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
