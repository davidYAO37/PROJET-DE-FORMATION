import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IHonoraireMed } from '@/models/HonoraireMed';
import { ILigneHonoraireMed } from '@/models/LigneHonoraireMed';
import { IConsultation } from '@/models/consultation';
import { IFacturation } from '@/models/Facturation';
import { ILignePrestation } from '@/models/lignePrestation';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES);
  if (!context) return tenantErrorResponse;
  const { connection } = context;
  const HonoraireMed = getTenantModel<IHonoraireMed>(connection, 'HonoraireMed');
  const LigneHonoraireMed = getTenantModel<ILigneHonoraireMed>(connection, 'LigneHonoraireMed');
  const Consultation = getTenantModel<IConsultation>(connection, 'Consultation');
  const Facturation = getTenantModel<IFacturation>(connection, 'Facturation');
  const LignePrestation = getTenantModel<ILignePrestation>(connection, 'LignePrestation');

  try {
    const { id } = await params;

    const honoraire = await HonoraireMed.findById(id).lean();
    if (!honoraire) {
      return NextResponse.json(
        { success: false, message: 'Bordereau introuvable.' },
        { status: 404 }
      );
    }

    const lignes = await LigneHonoraireMed.find({ HonoraireMed: id }).lean();

    // Remettre les statuts des actes
    for (const l of lignes) {
      const type = l.TYPEACTE;
      const idActe = l.IdPres;
      if (!idActe) continue;

      if (type === 'HONORAIRE CONSULTATION') {
        await Consultation.findByIdAndUpdate(idActe, { Statumed: 0 });
      } else if (type === 'HONORAIRE PRESCRIPTION') {
        await Facturation.findByIdAndUpdate(idActe, { Statumed: '0' });
      } else if (type === 'HONORAIRE EXECUTANT') {
        await LignePrestation.findByIdAndUpdate(idActe, { statutExecutant: '0' });
      } else if (type === 'HONORAIRE AIDE OPERATOIRE') {
        await LignePrestation.findByIdAndUpdate(idActe, { AideOperatoirePaye: 0 });
      } else if (type === 'HONORAIRE ANESTHESISTE') {
        await LignePrestation.findByIdAndUpdate(idActe, { AnesthesistePaye: 0 });
      }
    }

    await LigneHonoraireMed.deleteMany({ HonoraireMed: id });
    await HonoraireMed.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Bordereau annulé avec succès.',
    });
  } catch (error) {
    console.error('Erreur annulation honoraire:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur' },
      { status: 500 }
    );
  }
}
