import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IHonoraireMed } from '@/models/HonoraireMed';
import { IHonorairePaye } from '@/models/HonorairePaye';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier', 'comptable', 'facturation'];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES);
  if (!context) return tenantErrorResponse;
  const { connection } = context;
  const HonoraireMed = getTenantModel<IHonoraireMed>(connection, 'HonoraireMed');
  const HonorairePaye = getTenantModel<IHonorairePaye>(connection, 'HonorairePaye');

  const { id } = await params;
  const { honoraireId, ancienMontant, montant, modePaiement, banque, numeroCheque, payePar } = await request.json();

  if (!honoraireId || typeof montant !== 'number' || montant <= 0) {
    return NextResponse.json({ success: false, message: 'Données manquantes ou montant invalide' }, { status: 400 });
  }

  const session = await connection.startSession();
  let message = '';

  try {
    await session.withTransaction(async () => {
      const paiement = await HonorairePaye.findById(id).session(session);
      if (!paiement) {
        throw new Error('Paiement introuvable');
      }

      const honoraire = await HonoraireMed.findById(honoraireId).session(session);
      if (!honoraire) {
        throw new Error('Honoraire introuvable');
      }

      const diff = montant - (ancienMontant || 0);
      const nouveauPaye = (honoraire.MontantPayé || 0) + diff;
      const nouveauReste = Math.max(0, (honoraire.Restapayer ?? honoraire.Totalnetapayer ?? 0) - diff);

      if (nouveauPaye > (honoraire.Totalnetapayer || 0)) {
        throw new Error('Le montant total payé dépasserait le net à payer');
      }

      await HonorairePaye.findByIdAndUpdate(
        id,
        {
          MontantPayé: montant,
          Restapayer: nouveauReste,
          PayéPar: payePar || '',
          Recupar: payePar || '',
          Modepaiement: modePaiement || 'Espèce',
          BanqueC: banque || '',
          NCheque: numeroCheque || '',
        },
        { session }
      );

      await HonoraireMed.findByIdAndUpdate(
        honoraireId,
        {
          MontantPayé: nouveauPaye,
          Restapayer: nouveauReste,
        },
        { session }
      );

      message = 'Paiement modifié avec succès';
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Erreur PUT paiement:', error);
    const msg = error instanceof Error ? error.message : 'Erreur';
    const status = msg.includes('introuvable') ? 404 : msg.includes('dépasserait') ? 400 : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  } finally {
    await session.endSession();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES);
  if (!context) return tenantErrorResponse;
  const { connection } = context;
  const HonoraireMed = getTenantModel<IHonoraireMed>(connection, 'HonoraireMed');
  const HonorairePaye = getTenantModel<IHonorairePaye>(connection, 'HonorairePaye');

  const { id } = await params;
  const { honoraireId, montant } = await request.json();

  const session = await connection.startSession();
  let message = '';

  try {
    await session.withTransaction(async () => {
      const paiement = await HonorairePaye.findById(id).session(session);
      if (!paiement) {
        throw new Error('Paiement introuvable');
      }

      const honoraire = await HonoraireMed.findById(honoraireId).session(session);
      if (!honoraire) {
        throw new Error('Honoraire introuvable');
      }

      const montantReel = montant || paiement.MontantPayé || 0;
      const nouveauPaye = Math.max(0, (honoraire.MontantPayé || 0) - montantReel);
      const nouveauReste = (honoraire.Restapayer ?? 0) + montantReel;

      await HonorairePaye.findByIdAndDelete(id, { session });
      await HonoraireMed.findByIdAndUpdate(
        honoraireId,
        {
          MontantPayé: nouveauPaye,
          Restapayer: nouveauReste,
        },
        { session }
      );

      message = 'Paiement annulé avec succès';
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Erreur DELETE paiement:', error);
    const msg = error instanceof Error ? error.message : 'Erreur';
    const status = msg.includes('introuvable') ? 404 : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  } finally {
    await session.endSession();
  }
}
