import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { Consultation } from '@/models';
import { Facturation } from '@/models/Facturation';

export async function GET(request: NextRequest) {
  try {
    await db();

    const { searchParams } = new URL(request.url);
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');

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
      Date_consulation: { $gte: debutDate, $lte: finDate }
    });

    for (const consultation of consultations) {
      const montantEncaisse = consultation.Montantencaisse || 0;
      const montantTotal = consultation.montantapayer || 0;

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
        resteAPayer: consultation.Restapayer || 0,
        pourcentagePaye: montantTotal > 0 ? Math.round((montantEncaisse / montantTotal) * 100) : 0
      });
    }

    // ===== PARTIE 2: FACTURATIONS =====
    const facturations = await (Facturation as any).find({
      DateModif: { $gte: debutDate, $lte: finDate }
    });

    for (const facturation of facturations) {
      const montantEncaisse = facturation.MontantRecu || 0;
      const montantTotal = facturation.TotalapayerPatient || 0;

      result.push({
        id: facturation._id?.toString() || '',
        type: 'FACTURATION',
        date: facturation.DateFacturation || facturation.DatePres || facturation.DateModif,
        codePrestation: facturation.CodePrestation || '',
        designation: facturation.Designationtypeacte || '',
        patient: facturation.PatientP || 'Inconnu',
        typePatient: facturation.Assure || '',
        assurance: facturation.Assurance || '',
        montantTotal,
        montantEncaisse,
        resteAPayer: facturation.Restapayer || 0,
        pourcentagePaye: montantTotal > 0 ? Math.round((montantEncaisse / montantTotal) * 100) : 0
      });
    }
    
    // Trier par date décroissante
    result.sort((a, b) => (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0));

    return NextResponse.json({
      success: true,
      data: result,
      count: result.length
    });

  } catch (error) {
    console.error('Erreur historique non soldé:', error);
    return NextResponse.json({
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
