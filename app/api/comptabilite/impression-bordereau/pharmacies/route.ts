import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IFacturation } from '@/models/Facturation';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier'];

export async function GET(request: NextRequest) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES);
  if (!context) return tenantErrorResponse;
  const Facturation = getTenantModel<IFacturation>(context.connection, 'Facturation');

  try {
    const { searchParams } = new URL(request.url);
    const numfacture = searchParams.get('numfacture') || '';

    if (!numfacture) {
      return NextResponse.json({ success: false, message: 'Référence facture requise' }, { status: 400 });
    }

    const facturations = await Facturation.find({
      Numfacture: numfacture,
      Designationtypeacte: 'PHARMACIE',
    })
      .sort({ SOCIETE_PATIENT: 1, DateModif: 1 })
      .lean() as any[];

    const lignes = facturations.map((f) => ({
      DateModif: f.DateModif,
      PatientP: f.PatientP,
      Numcarte: f.Numcarte,
      Designationtypeacte: f.Designationtypeacte,
      Montanttotal: f.Montanttotal,
      PartAssuranceP: f.PartAssuranceP,
      Partassure: f.Partassure,
      SOCIETE_PATIENT: f.SOCIETE_PATIENT,
      Assurance: f.Assurance,
      Numfacture: f.Numfacture,
    }));

    const totaux = {
      Montanttotal: lignes.reduce((s, l) => s + (l.Montanttotal || 0), 0),
      PartAssuranceP: lignes.reduce((s, l) => s + (l.PartAssuranceP || 0), 0),
      Partassure: lignes.reduce((s, l) => s + (l.Partassure || 0), 0),
    };

    return NextResponse.json({ success: true, lignes, totaux });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur' },
      { status: 500 }
    );
  }
}
