import { db } from "@/db/mongoConnect";
import { PlanningMed } from "@/models/PlanningMed";
import { RendezVous } from "@/models/RendezVous";
import { Medecin } from "@/models/medecin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  await db();
  try {
    const body = await req.json();
    console.log("Données reçues pour création planning:", body);
    
    const { 
      medecinId, 
      dateDebut, 
      dateFin, 
      heureDebut, 
      heureFin, 
      duree, 
      jours, 
      planningTable, 
      rdvTable 
    } = body;

    // Récupérer l'utilisateur connecté depuis les headers ou le corps
    const utilisateur = body.utilisateur || "utilisateur";
    const idEntreprise = body.entrepriseId;

    // Vérifier que le médecin existe
    const medecin = await Medecin.findById(medecinId);
    if (!medecin) {
      return NextResponse.json({ error: "Médecin non trouvé" }, { status: 404 });
    }

    let totalPlanningsCrees = 0;
    let totalPlanningsModifies = 0;
    let totalRdvConserve = 0;
    let totalRdvSupprime = 0;

    // Parcourir chaque jour du planning demandé
    for (const planningRow of planningTable) {
      // Vérifier si un planning existe déjà pour ce médecin à cette date
      const existingPlanning = await PlanningMed.findOne({
        IDMEDECIN: medecinId,
        DateDebut: new Date(planningRow.date),
        DateFin: new Date(planningRow.date),
        entrepriseId: idEntreprise
      });

      if (existingPlanning) {
        // CAS 1: PLANNING EXISTANT - Gestion intelligente
        console.log(`📅 Planning existant trouvé pour ${planningRow.date}`);
        
        // Récupérer les rendez-vous existants pour ce planning
        const existingRdvs = await RendezVous.find({
          IDPLANNING_MED: existingPlanning._id,
          entrepriseId: idEntreprise
        });

        // Séparer les RDV avec patient et les RDV disponibles
        const rdvAvecPatient = existingRdvs.filter(rdv => rdv.PatientR && rdv.PatientR.trim() !== "");
        const rdvDisponibles = existingRdvs.filter(rdv => !rdv.PatientR || rdv.PatientR.trim() === "");

        console.log(`👥 RDV avec patient: ${rdvAvecPatient.length}`);
        console.log(`⏰ RDV disponibles: ${rdvDisponibles.length}`);

        // Supprimer uniquement les RDV disponibles (sans patient)
        for (const rdv of rdvDisponibles) {
          await RendezVous.findByIdAndDelete(rdv._id);
          totalRdvSupprime++;
        }
        console.log(`🗑️ ${rdvDisponibles.length} RDV disponibles supprimés`);

        // Mettre à jour les informations du planning existant
        existingPlanning.heureDebut = planningRow.debut;
        existingPlanning.HeureFin = planningRow.fin;
        existingPlanning.datedebutSys = new Date(`${planningRow.date} ${planningRow.debut}`);
        existingPlanning.DateFinSys = new Date(`${planningRow.date} ${planningRow.fin}`);
        existingPlanning.Dureconsul = duree;
        existingPlanning.TotalRDV = rdvTable.length + rdvAvecPatient.length;
        existingPlanning.ResteRDV = rdvTable.length;
        existingPlanning.Modifiele = new Date();
        existingPlanning.ModifierPar = utilisateur;
        await existingPlanning.save();
        totalPlanningsModifies++;

        // Ajouter les nouveaux rendez-vous disponibles
        for (const rdvRow of rdvTable) {
          const newRdv = new RendezVous({
            DisponibiliteSaisiePar: utilisateur,
            DateDisponinibilite: `${planningRow.date} ${rdvRow.Heurerdv.split(' H ')[0]}:${rdvRow.Heurerdv.split(' H ')[1].split(' Min')[0].padStart(2, '0')}`,
            DatePlanning: new Date(planningRow.date),
            IDMEDECIN: medecinId,
            IDPARTIENT: 0,
            PatientR: "",
            LibelleRDV: "",
            IDPLANNING_MED: existingPlanning._id,
            Medecinr: `PR ${medecin.nom} ${medecin.prenoms}`,
            entrepriseId: idEntreprise
          });
          await newRdv.save();
        }
        console.log(`➕ ${rdvTable.length} nouveaux RDV ajoutés`);
        totalRdvConserve += rdvAvecPatient.length;

      } else {
        // CAS 2: NOUVEAU PLANNING
        console.log(`🆕 Création nouveau planning pour ${planningRow.date}`);
        
        const newPlanning = new PlanningMed({
          DateDebut: new Date(planningRow.date),
          DateFin: new Date(planningRow.date),
          DESCRIPTION: planningRow.observation,
          IDMEDECIN: medecinId,
          heureDebut: planningRow.debut,
          HeureFin: planningRow.fin,
          datedebutSys: new Date(`${planningRow.date} ${planningRow.debut}`),
          DateFinSys: new Date(`${planningRow.date} ${planningRow.fin}`),
          Dureconsul: duree,
          TotalRDV: rdvTable.length,
          ResteRDV: rdvTable.length,
          SaisiLe: new Date(),
          Modifiele: new Date(),
          saisiepar: utilisateur,
          ModifierPar: utilisateur,
          entrepriseId: idEntreprise
        });
        
        const savedPlanning = await newPlanning.save();
        totalPlanningsCrees++;

        // Ajouter les rendez-vous pour ce nouveau planning
        for (const rdvRow of rdvTable) {
          const newRdv = new RendezVous({
            DisponibiliteSaisiePar: utilisateur,
            DateDisponinibilite: `${planningRow.date} ${rdvRow.Heurerdv.split(' H ')[0]}:${rdvRow.Heurerdv.split(' H ')[1].split(' Min')[0].padStart(2, '0')}`,
            DatePlanning: new Date(planningRow.date),
            IDMEDECIN: medecinId,
            IDPARTIENT: 0,
            PatientR: "",
            LibelleRDV: "",
            IDPLANNING_MED: savedPlanning._id,
            Medecinr: `PR ${medecin.nom} ${medecin.prenoms}`,
            entrepriseId: idEntreprise
          });
          await newRdv.save();
        }
        console.log(`➕ ${rdvTable.length} RDV créés pour le nouveau planning`);
      }
    }

    const message = `✅ Planning terminé avec succès!\n` +
                  `📊 Plannings créés: ${totalPlanningsCrees}\n` +
                  `🔄 Plannings modifiés: ${totalPlanningsModifies}\n` +
                  `👥 RDV avec patient conservés: ${totalRdvConserve}\n` +
                  `🗑️ RDV disponibles supprimés: ${totalRdvSupprime}\n` +
                  `➕ Nouveaux RDV créés: ${planningTable.length * rdvTable.length}`;

    return NextResponse.json({ 
      message: "Planning traité avec succès",
      details: {
        planningsCrees: totalPlanningsCrees,
        planningsModifies: totalPlanningsModifies,
        rdvConserve: totalRdvConserve,
        rdvSupprime: totalRdvSupprime,
        nouveauxRdv: planningTable.length * rdvTable.length
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Erreur création planning:", error);
    return NextResponse.json({ error: "Erreur création planning" }, { status: 500 });
  }
}
