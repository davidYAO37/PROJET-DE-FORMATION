import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IHonoraireMed } from '@/models/HonoraireMed';
import { IHonorairePaye } from '@/models/HonorairePaye';
import mongoose from 'mongoose';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier', 'comptable', 'facturation'];

export async function POST(request: NextRequest) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES);
  if (!context) return tenantErrorResponse;
  const { connection } = context;
  const HonoraireMed = getTenantModel<IHonoraireMed>(connection, 'HonoraireMed');
  const HonorairePaye = getTenantModel<IHonorairePaye>(connection, 'HonorairePaye');

  const body = await request.json();
  const {
    honoraireId,
    montantClient,
    recuPar,
    modePaiement,
    banque,
    nCheque,
    datePaiement,
    payePar,
  } = body;

  if (!honoraireId || typeof montantClient !== 'number' || montantClient <= 0) {
    return NextResponse.json(
      { success: false, message: 'Données de paiement invalides.' },
      { status: 400 }
    );
  }

  const session = await connection.startSession();

  try {
    let result: any;

    await session.withTransaction(async () => {
      const honoraire = await HonoraireMed.findById(honoraireId).session(session).lean();
      if (!honoraire) {
        throw new Error('Bordereau introuvable.');
      }

      const reste = (honoraire.Restapayer as number) || 0;
      if (montantClient > reste) {
        throw new Error('Le montant saisi dépasse le reste à payer.');
      }

      const nouveauReste = reste - montantClient;
      const montantPaye = ((honoraire.MontantPayé as number) || 0) + montantClient;

      await HonoraireMed.findByIdAndUpdate(
        honoraireId,
        {
          Restapayer: Math.round(nouveauReste),
          MontantPayé: Math.round(montantPaye),
        },
        { session }
      );

      await HonorairePaye.create(
        [
          {
            Date: datePaiement ? new Date(datePaiement) : new Date(),
            Heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            MontantJour: Math.round(montantClient),
            MontantPayé: Math.round(montantClient),
            Restapayer: Math.round(nouveauReste),
            PayéPar: payePar || '',
            Recupar: recuPar || '',
            Medecin: honoraire.Medecin,
            HonoraireMed: new mongoose.Types.ObjectId(honoraireId),
            BanqueC: banque || '',
            NCheque: nCheque || '',
            Modepaiement: modePaiement || 'Espèce',
          },
        ],
        { session }
      );

      result = { restapayer: Math.round(nouveauReste), montantPayé: Math.round(montantPaye) };
    });

    return NextResponse.json({
      success: true,
      message: 'Médecin payé avec succès.',
      data: result,
    });
  } catch (error) {
    console.error('Erreur paiement honoraire:', error);
    const message = error instanceof Error ? error.message : 'Erreur';
    const status = message.includes('introuvable') ? 404 : message.includes('dépasse') ? 400 : 500;
    return NextResponse.json({ success: false, message }, { status });
  } finally {
    await session.endSession();
  }
}
