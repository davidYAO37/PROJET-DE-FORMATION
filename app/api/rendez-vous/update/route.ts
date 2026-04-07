import { db } from "@/db/mongoConnect";
import { RendezVous } from "@/models/RendezVous";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  await db();
  try {
    const body = await req.json();
    const { rdvId, PatientR, Contact, DESCRIPTION, StatutRdv, Statutrdvpris, entrepriseId } = body;

    console.log('✏️ Mise à jour du rendez-vous:', rdvId);

    if (!rdvId) {
      return NextResponse.json({ error: "ID du rendez-vous requis" }, { status: 400 });
    }

    // Vérifier que le rendez-vous existe
    const existingRdv = await RendezVous.findById(rdvId);
    if (!existingRdv) {
      return NextResponse.json({ error: "Rendez-vous non trouvé" }, { status: 404 });
    }

    // Vérifier l'entreprise si spécifiée
    if (entrepriseId && existingRdv.entrepriseId !== entrepriseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Permettre la mise à jour des rendez-vous validés (suppression de la vérification)
    // Les rendez-vous peuvent être modifiés s'ils ne sont pas dans le passé
    // Utiliser la date de disponibilité comme référence
    const rdvDate = new Date(existingRdv.DateDisponinibilite);
    rdvDate.setHours(23, 59, 59, 999); // Fin de journée
    const now = new Date();
    
    if (rdvDate < now) {
      return NextResponse.json({ 
        error: "Ce rendez-vous est dans le passé",
        details: "Impossible de modifier un rendez-vous passé"
      }, { status: 400 });
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      ...(PatientR && { PatientR }),
      ...(Contact && { Contact }),
      ...(DESCRIPTION && { DESCRIPTION }),
      ...(StatutRdv && { StatutRdv }),
      ...(Statutrdvpris !== undefined && { Statutrdvpris }),
      RENDEZVOUSLE: new Date() // Date de prise du rendez-vous
    };

    // Mettre à jour le rendez-vous
    const updatedRdv = await RendezVous.findByIdAndUpdate(
      rdvId,
      updateData,
      { new: true }
    );

    if (!updatedRdv) {
      return NextResponse.json({ error: "Erreur lors de la mise à jour du rendez-vous" }, { status: 500 });
    }

    const message = `✅ Rendez-vous validé avec succès!\n📋 Patient: ${PatientR}\n📞 Contact: ${Contact}\n🏥 Type: ${DESCRIPTION}`;

    console.log(message);

    return NextResponse.json({ 
      message: "Rendez-vous mis à jour avec succès",
      details: {
        rdvId,
        PatientR: updatedRdv.PatientR,
        Contact: updatedRdv.Contact,
        DESCRIPTION: updatedRdv.DESCRIPTION,
        StatutRdv: updatedRdv.StatutRdv,
        Statutrdvpris: updatedRdv.Statutrdvpris,
        RENDEZVOUSLE: updatedRdv.RENDEZVOUSLE
      }
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du rendez-vous:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du rendez-vous", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
