import { db } from "@/db/mongoConnect";
import { RendezVous } from "@/models/RendezVous";
import { Patient } from "@/models/patient";
import { Medecin } from "@/models/medecin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  await db();
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const entrepriseId = searchParams.get('entrepriseId');

    console.log('🔍 Récupération des rendez-vous du', startDate, 'au', endDate);

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Dates de début et de fin requises" }, { status: 400 });
    }

    // Construire la requête de base avec DateDisponinibilite
    const query: any = {
      DateDisponinibilite: {
        $gte: startDate,
        $lte: endDate + 'T23:59:59.999Z' // Inclure toute la journée de fin
      },
      StatutRdv: { $in: ["1", "2", "3"] } // Afficher les rendez-vous avec StatutRdv >= 1 (1, 2, 3...)
    };

    

    // Récupérer les rendez-vous avec populate des patients et médecins
    const rendezVous = await RendezVous.find(query)
      .populate('IdPatient', 'Nom Prenoms')
      .populate('IDMEDECIN', 'nom prenoms')
      .sort({ DateDisponinibilite: 1 }) // Trier par DateDisponinibilite
      .lean();

    console.log(`📊 ${rendezVous.length} rendez-vous trouvés pour la période du ${startDate} au ${endDate} avec StatutRdv >= 1`);

    // Transformer les données pour correspondre à l'interface attendue
    const transformedRendezVous = rendezVous.map((rdv: any) => ({
      id: rdv._id,
      date: rdv.DateDisponinibilite,
      DateDisponinibilite: rdv.DateDisponinibilite, // Ajouter le champ DateDisponinibilite
      heure: rdv.DateDisponinibilite ? new Date(rdv.DateDisponinibilite).toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }) : '',
      patientNom: rdv.IdPatient ? `${rdv.IdPatient.Nom} ${rdv.IdPatient.Prenoms}` : rdv.PatientR || 'Non spécifié',
      medecinNom: rdv.IDMEDECIN ? `${rdv.IDMEDECIN.nom} ${rdv.IDMEDECIN.prenoms}` : rdv.Medecinr || 'Non spécifié',
      description: rdv.DESCRIPTION || rdv.LibelleRDV || 'Aucune description',
      statut: rdv.StatutRdv === "1" ? "en cours" : 
              rdv.StatutRdv === "2" ? "validé" : 
              rdv.StatutRdv === "3" ? "annulé" : 
              "non défini"
    }));

    return NextResponse.json(transformedRendezVous, { status: 200 });

  } catch (error) {
    console.error("❌ Erreur lors de la récupération des rendez-vous:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des rendez-vous", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
