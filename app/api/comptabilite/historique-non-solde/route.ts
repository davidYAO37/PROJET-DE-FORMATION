import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IConsultation } from '@/models/consultation';
import { IFacturation } from '@/models/Facturation';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier', 'comptable', 'facturation'];

export async function GET(request: NextRequest) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES);
  if (!context) return tenantErrorResponse;
  const { connection } = context;
  const Consultation = getTenantModel<IConsultation>(connection, 'Consultation');
  const Facturation = getTenantModel<IFacturation>(connection, 'Facturation');

  try {
    const { searchParams } = new URL(request.url);
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '1000', 10));

    if (!dateDebut || !dateFin) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const debutDate = new Date(dateDebut);
    const finDate = new Date(dateFin);
    finDate.setHours(23, 59, 59, 999);
    const result: any[] = [];

    // ===== PARTIE 1: CONSULTATIONS =====
    const consultations = await (Consultation as any).find({
      statutPrescriptionMedecin: { $gte: 2 },
      Restapayer: { $gt: 0 },
      Date_consulation: { $gte: debutDate, $lte: finDate }
    });

    for (const consultation of consultations) {
      const montantTotal = consultation.montantapayer || 0;
      const resteAPayer = consultation.Restapayer || 0;
      const montantEncaisse = Math.max(0, montantTotal - resteAPayer);

      result.push({
        id: consultation._id?.toString() || '',
        type: 'CONSULTATION',
        date: consultation.DateFacturation || consultation.Date_consulation,
        codePrestation: consultation.CodePrestation || '',
        designation: consultation.designationC || '',
        patient: consultation.PatientP || 'Inconnu',
        typePatient: consultation.Assure || '',
        assurance: consultation.assurance || '',
        montantTotal,
        montantEncaisse,
        resteAPayer,
        pourcentagePaye: montantTotal > 0 ? Math.round((montantEncaisse / montantTotal) * 100) : 0
      });
    }

    // ===== PARTIE 2: FACTURATIONS =====
    const facturations = await (Facturation as any).find({
      Restapayer: { $gt: 0 },
      DateFacturation: { $gte: debutDate, $lte: finDate }
    });

    for (const facturation of facturations) {
      const montantTotal = facturation.TotalapayerPatient || 0;
      const resteAPayer = facturation.Restapayer || 0;
      const montantEncaisse = Math.max(0, montantTotal - resteAPayer);

      result.push({
        id: facturation._id?.toString() || '',
        type: 'FACTURATION',
        date: facturation.DateFacturation || facturation.DatePres,
        codePrestation: facturation.CodePrestation || '',
        designation: facturation.Designationtypeacte || '',
        patient: facturation.PatientP || 'Inconnu',
        typePatient: facturation.Assure || '',
        assurance: facturation.Assurance || '',
        montantTotal,
        montantEncaisse,
        resteAPayer,
        pourcentagePaye: montantTotal > 0 ? Math.round((montantEncaisse / montantTotal) * 100) : 0
      });
    }
    
    // Trier par date décroissante
    result.sort((a, b) => (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0));

    const total = result.length;
    const start = (page - 1) * limit;
    const paginated = result.slice(start, start + limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      count: paginated.length,
      total,
      page,
      limit,
    });

  } catch (error) {
    console.error('Erreur historique non soldé:', error);
    return NextResponse.json({
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
