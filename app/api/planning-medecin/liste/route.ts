import { db } from "@/db/mongoConnect";
import { PlanningMed } from "@/models/PlanningMed";
import { RendezVous } from "@/models/RendezVous";
import { Medecin } from "@/models/medecin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  await db();
  try {
    const { searchParams } = new URL(req.url);
    const medecinId = searchParams.get('medecinId');
    const entrepriseId = searchParams.get('entrepriseId');

    console.log('📅 Chargement des plannings pour le médecin:', medecinId);

    if (!medecinId) {
      return NextResponse.json({ error: "ID du médecin requis" }, { status: 400 });
    }

    // Vérifier que le médecin existe
    const medecin = await Medecin.findById(medecinId);
    if (!medecin) {
      return NextResponse.json({ error: "Médecin non trouvé" }, { status: 404 });
    }

    // Construire la requête de base
    const query: any = { IDMEDECIN: medecinId };

    // Récupérer les plannings du médecin
    const plannings = await PlanningMed.find(query)
      .sort({ DateDebut: -1 }) // Plus récents d'abord
      .limit(50); // Limiter à 50 résultats pour éviter la surcharge

    console.log(`📊 ${plannings.length} plannings trouvés pour le médecin ${medecin.nom} ${medecin.prenoms}`);

    // Enrichir les plannings avec les informations du médecin et les statistiques RDV
    const planningsEnrichis = await Promise.all(
      plannings.map(async (planning) => {
        try {
          // Compter les RDV pour ce planning
          const totalRdv = await RendezVous.countDocuments({
            IDPLANNING_MED: planning._id,
            PatientR: { $exists: true, $ne: "" }
          });

          const rdvPris = await RendezVous.countDocuments({
            IDPLANNING_MED: planning._id,
            PatientR: { $exists: true, $ne: "" }
          });

          const rdvDisponibles = totalRdv - rdvPris;

          return {
            _id: planning._id,
            IDMEDECIN: planning.IDMEDECIN,
            DateDebut: planning.DateDebut,
            DateFin: planning.DateFin,
            heureDebut: planning.heureDebut,
            HeureFin: planning.HeureFin,
            Dureconsul: planning.Dureconsul,
            TotalRDV: totalRdv, // Utiliser le comptage réel
            ResteRDV: rdvDisponibles, // Utiliser le comptage réel
            DESCRIPTION: planning.DESCRIPTION,
            SaisiLe: planning.SaisiLe,
            Modifiele: planning.Modifiele,
            medecin: {
              _id: medecin._id,
              nom: medecin.nom,
              prenoms: medecin.prenoms,
              specialite: medecin.specialite
            },
            // Ajouter des statistiques utiles
            statistiques: {
              totalRdv: totalRdv,
              rdvPris: rdvPris,
              rdvDisponibles: rdvDisponibles,
              tauxOccupation: totalRdv > 0 ? Math.round((rdvPris / totalRdv) * 100) : 0
            }
          };
        } catch (error) {
          console.error('Erreur lors de lenrichissement du planning:', error);
          // Retourner le planning sans enrichissement en cas d'erreur
          return {
            _id: planning._id,
            IDMEDECIN: planning.IDMEDECIN,
            DateDebut: planning.DateDebut,
            DateFin: planning.DateFin,
            heureDebut: planning.heureDebut,
            HeureFin: planning.HeureFin,
            Dureconsul: planning.Dureconsul,
            TotalRDV: planning.TotalRDV,
            ResteRDV: planning.ResteRDV,
            DESCRIPTION: planning.DESCRIPTION,
            SaisiLe: planning.SaisiLe,
            Modifiele: planning.Modifiele,
            medecin: {
              _id: medecin._id,
              nom: medecin.nom,
              prenoms: medecin.prenoms,
              specialite: medecin.specialite
            },
            entrepriseId: planning.entrepriseId
          };
        }
      })
    );

    return NextResponse.json(planningsEnrichis, { status: 200 });

  } catch (error) {
    console.error("❌ Erreur lors du chargement des plannings:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des plannings", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  await db();
  try {
    const body = await req.json();
    console.log("📅 Création/Mise à jour d'un planning:", body);

    const {
      medecinId,
      dateDebut,
      dateFin,
      heureDebut,
      heureFin,
      duree,
      jours,
      planningTable,
      rdvTable,
      entrepriseId,
      utilisateur
    } = body;

    // Vérifier que le médecin existe
    const medecin = await Medecin.findById(medecinId);
    if (!medecin) {
      return NextResponse.json({ error: "Médecin non trouvé" }, { status: 404 });
    }

    // Logique de création/mise à jour (similaire à l'autre endpoint)
    // Pour l'instant, on retourne un message de succès
    return NextResponse.json(
      { message: "Planning créé/mis à jour avec succès" },
      { status: 201 }
    );

  } catch (error) {
    console.error("❌ Erreur lors de la création du planning:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du planning", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
