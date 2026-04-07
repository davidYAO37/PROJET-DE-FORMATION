import { db } from "@/db/mongoConnect";
import { PlanningMed } from "@/models/PlanningMed";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  await db();
  try {
    const body = await req.json();
    const { planningId, decrement, entrepriseId } = body;

    console.log('🔄 Mise à jour du ResteRDV du planning:', planningId, 'décrément:', decrement);

    if (!planningId || decrement === undefined) {
      return NextResponse.json({ error: "ID du planning et décrément requis" }, { status: 400 });
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

    // Calculer le nouveau ResteRDV (équivalent de ResteRDV -= 1)
    const currentResteRDV = existingPlanning.ResteRDV || 0;
    const newResteRDV = Math.max(0, currentResteRDV - decrement);

    // Mettre à jour le planning (équivalent de HModifie(PLANNING_MED))
    const updatedPlanning = await PlanningMed.findByIdAndUpdate(
      planningId,
      { 
        ResteRDV: newResteRDV,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedPlanning) {
      return NextResponse.json({ error: "Erreur lors de la mise à jour du planning" }, { status: 500 });
    }

    console.log(`✅ ResteRDV mis à jour: ${currentResteRDV} → ${newResteRDV}`);

    return NextResponse.json({ 
      message: "ResteRDV mis à jour avec succès",
      details: {
        planningId,
        ancienResteRDV: currentResteRDV,
        nouveauResteRDV: newResteRDV,
        decrement
      }
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du ResteRDV:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du ResteRDV", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
