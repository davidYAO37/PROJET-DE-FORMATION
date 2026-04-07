import { db } from "@/db/mongoConnect";
import { PlanningMed } from "@/models/PlanningMed";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  await db();
  try {
    const body = await req.json();
    const { planningId, increment, entrepriseId } = body;

    console.log('🔄 Mise à jour des totaux du planning:', planningId, 'increment:', increment);

    if (!planningId || increment === undefined) {
      return NextResponse.json({ 
        error: "Champs requis manquants: planningId, increment" 
      }, { status: 400 });
    }

    // Vérifier que le planning existe
    const existingPlanning = await PlanningMed.findById(planningId);
    if (!existingPlanning) {
      return NextResponse.json({ error: "Planning non trouvé" }, { status: 404 });
    }

    // Vérifier l'entreprise si spécifiée
    if (entrepriseId && existingPlanning.entrepriseId !== entrepriseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Mettre à jour les totaux
    const updatedPlanning = await PlanningMed.findByIdAndUpdate(
      planningId,
      {
        $inc: {
          TotalRDV: increment,
          ResteRDV: increment
        }
      },
      { new: true }
    );

    if (!updatedPlanning) {
      return NextResponse.json({ error: "Erreur lors de la mise à jour du planning" }, { status: 500 });
    }

    console.log('✅ Totaux du planning mis à jour avec succès:', {
      TotalRDV: updatedPlanning.TotalRDV,
      ResteRDV: updatedPlanning.ResteRDV
    });

    return NextResponse.json({ 
      message: "Totaux du planning mis à jour avec succès",
      planning: {
        _id: updatedPlanning._id,
        TotalRDV: updatedPlanning.TotalRDV,
        ResteRDV: updatedPlanning.ResteRDV
      }
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour des totaux du planning:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des totaux du planning", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
