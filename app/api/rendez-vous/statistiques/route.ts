import { NextRequest, NextResponse } from 'next/server';
import { RendezVous } from '@/models/RendezVous';
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
    
    // Rendez-vous du jour (avec PatientR non vide)
    const rendezVousDuJour = await RendezVous.countDocuments({
      IDMEDECIN: medecinId,
      DatePlanning: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      PatientR: { $ne: '' }
    });
    
    return NextResponse.json({
      rendezVousDuJour
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de rendez-vous:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
