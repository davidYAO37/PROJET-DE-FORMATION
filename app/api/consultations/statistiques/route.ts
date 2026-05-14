import { NextRequest, NextResponse } from 'next/server';
import { Consultation } from '@/models/consultation';
import { db } from '@/db/mongoConnect';

export async function GET(request: NextRequest) {
  try {
    await db();
    
    const { searchParams } = new URL(request.url);
    const medecinId = searchParams.get('medecinId');
    
    if (!medecinId) {
      return NextResponse.json({ error: 'ID du médecin requis' }, { status: 400 });
    }
    
    // Obtenir la date du jour au format YYYY-MM-DD
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const startOfDay = new Date(todayStr);
    const endOfDay = new Date(todayStr);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Récupérer toutes les consultations du médecin pour aujourd'hui
    const consultations = await Consultation.find({
      IDMEDECIN: medecinId,
      Date_consulation: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
    .populate('IdPatient', 'Nom Prenoms Contact Date_naisse sexe')
    .populate('IDMEDECIN', 'nom prenoms')
    .sort({ Date_consulation: 1, Heure_Consultation: 1 })
    .lean();
    
    // Calculer les statistiques
    const patientsRecus = consultations.filter(consultation => 
      consultation.attenteMedecin === 2 // Patient reçu par le médecin (consultation terminée)
    ).length;
    
    const patientsEnAttente = consultations.filter(consultation => 
      consultation.attenteMedecin === 0 // Patient en attente du médecin
    ).length;
    
    return NextResponse.json({
      patientsRecus,
      patientsEnAttente,
      consultations,
      total: consultations.length
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des consultations:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur',
      patientsRecus: 0,
      patientsEnAttente: 0
    }, { status: 500 });
  }
}
