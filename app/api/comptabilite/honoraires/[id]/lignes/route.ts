import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { ILigneHonoraireMed } from '@/models/LigneHonoraireMed';
import { IHonoraireMed } from '@/models/HonoraireMed';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier', 'comptable', 'facturation'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES);
  if (!context) return tenantErrorResponse;
  const { connection } = context;
  const LigneHonoraireMed = getTenantModel<ILigneHonoraireMed>(connection, 'LigneHonoraireMed');
  const HonoraireMed = getTenantModel<IHonoraireMed>(connection, 'HonoraireMed');

  try {
    const { id } = await params;

    const honoraire = await HonoraireMed.findById(id).lean();
    if (!honoraire) {
      return NextResponse.json(
        { success: false, message: 'Bordereau introuvable.' },
        { status: 404 }
      );
    }

    const lignes = await LigneHonoraireMed.find({ HonoraireMed: id })
      .sort({ DatePres: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: lignes,
      honoraire,
    });
  } catch (error) {
    console.error('Erreur GET lignes honoraire:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur' },
      { status: 500 }
    );
  }
}
