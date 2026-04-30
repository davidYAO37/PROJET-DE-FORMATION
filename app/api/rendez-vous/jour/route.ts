import { NextRequest, NextResponse } from 'next/server';
import { RendezVous } from '@/models/RendezVous';
import { PlanningMed } from '@/models/PlanningMed';
import { Patient } from '@/models/patient';
import { Medecin } from '@/models/medecin';
import { db } from '@/db/mongoConnect';

export async function GET(request: NextRequest) {
  try {
    await db();
    
    const { searchParams } = new URL(request.url);
    const medecinId = searchParams.get('medecinId');
    
    if (!medecinId) {
      return NextResponse.json({ error: 'ID du médecin requis' }, { status: 400 });
    }
    
    // Obtenir la date du jour
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const startOfDay = new Date(todayStr);
    const endOfDay = new Date(todayStr);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Récupérer les rendez-vous du médecin pour aujourd'hui avec le planning
    const rendezVous = await RendezVous.find({
      IDMEDECIN: medecinId,
      DatePlanning: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      PatientR: { $ne: '' } // Uniquement les rendez-vous avec patient assigné
    })
    .populate('IDMEDECIN', 'nom prenoms specialite')
    .populate('IDPLANNING_MED', 'heureDebut HeureFin DESCRIPTION')
    .sort({ DatePlanning: 1 })
    .lean();
    
    // Récupérer les informations des patients
    const rendezVousAvecPatients = await Promise.all(
      rendezVous.map(async (rdv: any) => {
        let patientInfo = null;
        
        if (rdv.PatientR) {
          // Chercher le patient par nom ou code dossier
          const patient = await Patient.findOne({
            $or: [
              { Code_dossier: rdv.PatientR },
              { $expr: { $eq: [{ $concat: ['$Nom', ' ', '$Prenoms'] }, rdv.PatientR] } }
            ]
          }).lean();
          
          if (patient) {
            patientInfo = {
              _id: patient._id,
              Nom: patient.Nom,
              Prenoms: patient.Prenoms,
              Code_dossier: patient.Code_dossier,
              Contact: patient.Contact,
              Date_naisse: patient.Date_naisse,
              sexe: patient.sexe,
              Assurance: patient.Assurance
            };
          }
        }
        
        const planning = rdv.IDPLANNING_MED as any;
        const heureDebut = planning?.heureDebut || '08:00';
        const heureFin = planning?.HeureFin || '18:00';
        
        return {
          _id: rdv._id,
          DatePlanning: rdv.DatePlanning,
          HeureDebut: heureDebut,
          HeureFin: heureFin,
          PatientR: rdv.PatientR,
          IDMEDECIN: rdv.IDMEDECIN,
          Titre: rdv.LibelleRDV || 'Rendez-vous',
          Description: rdv.DESCRIPTION || '',
          Statut: rdv.StatutRdv || 'planifié',
          patient: patientInfo,
          // Champs calculés
          nomComplet: patientInfo ? 
            `${patientInfo.Nom} ${patientInfo.Prenoms}`.trim() : 
            rdv.PatientR || 'Patient inconnu',
          age: patientInfo?.Date_naisse ? 
            Math.floor((new Date().getTime() - new Date(patientInfo.Date_naisse).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 
            'N/C',
          codeDossier: patientInfo?.Code_dossier || 'N/C',
          contact: patientInfo?.Contact || 'N/C',
          // Statut du rendez-vous
          estTermine: new Date() > new Date(`${rdv.DatePlanning}T${heureFin}`),
          estEnCours: new Date() >= new Date(`${rdv.DatePlanning}T${heureDebut}`) && 
                     new Date() <= new Date(`${rdv.DatePlanning}T${heureFin}`)
        };
      })
    );
    
    return NextResponse.json({
      rendezVous: rendezVousAvecPatients,
      total: rendezVousAvecPatients.length,
      message: `${rendezVousAvecPatients.length} rendez-vous aujourd'hui`
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des rendez-vous:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur', 
      details: error instanceof Error ? error.message : 'Erreur inconnue',
      rendezVous: [] 
    }, { status: 500 });
  }
}
