import { db } from "@/db/mongoConnect";
import { RendezVous } from "@/models/RendezVous";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  await db();
  try {
    const body = await req.json();
    const { 
      IDMEDECIN, 
      IDPLANNING_MED, 
      DateDisponinibilite, 
      DatePlanning, 
      HeureRDV, 
      StatutRdv, 
      Statutrdvpris, 
      DESCRIPTION, 
      PatientR, 
      Contact, 
      entrepriseId 
    } = body;

    console.log('➕ Création d\'un nouveau rendez-vous pour le médecin:', IDMEDECIN);

    // Validation des données requises
    if (!IDMEDECIN || !IDPLANNING_MED || !DateDisponinibilite) {
      return NextResponse.json({ 
        error: "Champs requis manquants: IDMEDECIN, IDPLANNING_MED, DateDisponinibilite" 
      }, { status: 400 });
    }

    // Créer le nouveau rendez-vous
    const newRdv = new RendezVous({
      IDMEDECIN,
      IDPLANNING_MED,
      DateDisponinibilite,
      DatePlanning: DatePlanning || new Date(DateDisponinibilite),
      StatutRdv: StatutRdv || '0',
      Statutrdvpris: Statutrdvpris || false,
      DESCRIPTION: DESCRIPTION || '',
      PatientR: PatientR || '',
      Contact: Contact || '',
      LibelleRDV: DESCRIPTION || '',
      Medecinr: '',
      entrepriseId,
      DisponibiliteSaisiePar: 'system',
      RendezVousPrisPar: '',
      RENDEZVOUSLE: new Date()
    });

    const savedRdv = await newRdv.save();

    console.log('✅ Rendez-vous créé avec succès:', savedRdv._id);

    return NextResponse.json({ 
      message: "Rendez-vous créé avec succès",
      rdv: {
        _id: savedRdv._id,
        IDMEDECIN: savedRdv.IDMEDECIN,
        IDPLANNING_MED: savedRdv.IDPLANNING_MED,
        DateDisponinibilite: savedRdv.DateDisponinibilite,
        StatutRdv: savedRdv.StatutRdv,
        Statutrdvpris: savedRdv.Statutrdvpris
      }
    }, { status: 201 });

  } catch (error) {
    console.error("❌ Erreur lors de la création du rendez-vous:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du rendez-vous", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
