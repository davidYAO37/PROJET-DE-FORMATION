import { NextRequest, NextResponse } from 'next/server';
import { IRendezVous } from '@/models/RendezVous';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';

const READ_ROLES = ["admin", "medecin", "accueil", "caisse", "comptable", "infirmier"];

export async function GET(request: NextRequest) {
  try {
    const { context, response } = await withTenant(request, READ_ROLES);
    if (!context) return response;
    const RendezVous = getTenantModel<IRendezVous>(context.connection, "RendezVous");

    const { searchParams } = new URL(request.url);
    const medecinId = searchParams.get('medecinId');
    const all = searchParams.get('all') === 'true';
    
    // Obtenir la date du jour au format YYYY-MM-DD
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const startOfDay = new Date(todayStr);
    const endOfDay = new Date(todayStr);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Construire la requête : soit tous les rendez-vous du jour, soit filtrés par médecin
    const query: any = {
      DatePlanning: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      PatientR: { $ne: '' }
    };
    
    if (medecinId) {
      query.IDMEDECIN = medecinId;
    }
    
    // Rendez-vous du jour (avec PatientR non vide)
    const rendezVousDuJour = await RendezVous.countDocuments(query);
    
    return NextResponse.json({
      rendezVousDuJour
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de rendez-vous:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
