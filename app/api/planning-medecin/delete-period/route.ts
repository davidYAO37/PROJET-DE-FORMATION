import { IPlanningMed } from "@/models/PlanningMed";
import { IRendezVous } from "@/models/RendezVous";
import { IMedecin } from "@/models/medecin";
import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";

const WRITE_ROLES = ["admin", "medecin", "accueil"];

export async function DELETE(req: NextRequest) {
  const { context, response } = await withTenant(req, WRITE_ROLES);
  if (!context) return response;
  const PlanningMed = getTenantModel<IPlanningMed>(context.connection, "PlanningMed");
  const RendezVous = getTenantModel<IRendezVous>(context.connection, "RendezVous");
  const Medecin = getTenantModel<IMedecin>(context.connection, "Medecin");
  try {
    const { searchParams } = new URL(req.url);
    const medecinId = searchParams.get('medecinId');
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
    const entrepriseId = searchParams.get('entrepriseId');

    console.log('🗑️ Suppression des plannings par période:', { medecinId, dateDebut, dateFin });

    if (!medecinId || !dateDebut || !dateFin) {
      return NextResponse.json({ 
        error: "Paramètres requis: medecinId, dateDebut, dateFin" 
      }, { status: 400 });
    }

    // Vérifier que le médecin existe
    const medecin = await Medecin.findById(medecinId);
    if (!medecin) {
      return NextResponse.json({ error: "Médecin non trouvé" }, { status: 404 });
    }

    // Construire la requête de base
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Début de journée

    const planningQuery: any = {
      IDMEDECIN: medecinId,
      DateDebut: {
        $gte: new Date(dateDebut),
        $lte: new Date(dateFin)
      }
    };

    // Filtrer uniquement les plannings futurs ou en cours
    if (entrepriseId) {
      planningQuery.entrepriseId = entrepriseId;
    }

    // Récupérer tous les plannings dans la période
    const allPlanningsInPeriod = await PlanningMed.find({
      IDMEDECIN: medecinId,
      DateDebut: {
        $gte: new Date(dateDebut),
        $lte: new Date(dateFin)
      },
      ...(entrepriseId && { entrepriseId })
    });

    // Filtrer uniquement ceux qui sont futurs ou en cours
    const planningsToDelete = allPlanningsInPeriod.filter(planning => {
      const planningDate = new Date(planning.DateDebut);
      planningDate.setHours(0, 0, 0, 0);
      return planningDate >= today;
    });
    
    if (planningsToDelete.length === 0) {
      return NextResponse.json({ 
        message: "Aucun planning futur trouvé pour cette période",
        details: {
          planningsSupprimes: 0,
          rdvSupprimes: 0,
          note: "Seuls les plannings futurs ou en cours peuvent être supprimés"
        }
      }, { status: 200 });
    }

    const planningIds = planningsToDelete.map(p => p._id);

    // Compter les rendez-vous à supprimer
    const rdvCount = await RendezVous.countDocuments({
      IDPLANNING_MED: { $in: planningIds },
      entrepriseId: entrepriseId
    });

    console.log(`📊 Suppression de ${planningsToDelete.length} plannings et ${rdvCount} rendez-vous`);

    // Supprimer d'abord tous les rendez-vous associés
    const deleteRdvResult = await RendezVous.deleteMany({
      IDPLANNING_MED: { $in: planningIds },
      entrepriseId: entrepriseId
    });

    // Supprimer les plannings
    const deletePlanningResult = await PlanningMed.deleteMany(planningQuery);

    const message = `✅ Plannings de période supprimés avec succès!\n📅 ${deletePlanningResult.deletedCount} plannings supprimés\n📊 ${deleteRdvResult.deletedCount} rendez-vous associés supprimés`;

    console.log(message);

    return NextResponse.json({ 
      message: "Plannings et rendez-vous de période supprimés avec succès",
      details: {
        planningsSupprimes: deletePlanningResult.deletedCount,
        rdvSupprimes: deleteRdvResult.deletedCount,
        periode: {
          medecin: `Dr ${medecin.nom} ${medecin.prenoms}`,
          dateDebut: new Date(dateDebut).toLocaleDateString('fr-FR'),
          dateFin: new Date(dateFin).toLocaleDateString('fr-FR')
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Erreur lors de la suppression des plannings de période:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression des plannings", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
