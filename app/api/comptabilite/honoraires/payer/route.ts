import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { HonoraireMed } from '@/models/HonoraireMed';
import { HonorairePaye } from '@/models/HonorairePaye';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    await db();
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

    const honoraire = await HonoraireMed.findById(honoraireId).lean();
    if (!honoraire) {
      return NextResponse.json(
        { success: false, message: 'Bordereau introuvable.' },
        { status: 404 }
      );
    }

    const reste = (honoraire.Restapayer as number) || 0;
    if (montantClient > reste) {
      return NextResponse.json(
        { success: false, message: 'Le montant saisi dépasse le reste à payer.' },
        { status: 400 }
      );
    }

    const nouveauReste = reste - montantClient;
    const montantPaye = ((honoraire.MontantPayé as number) || 0) + montantClient;

    await HonoraireMed.findByIdAndUpdate(honoraireId, {
      Restapayer: Math.round(nouveauReste),
      MontantPayé: Math.round(montantPaye),
    });

    await HonorairePaye.create({
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
    });

    return NextResponse.json({
      success: true,
      message: 'Médecin payé avec succès.',
      data: { restapayer: Math.round(nouveauReste), montantPayé: Math.round(montantPaye) },
    });
  } catch (error) {
    console.error('Erreur paiement honoraire:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur' },
      { status: 500 }
    );
  }
}
