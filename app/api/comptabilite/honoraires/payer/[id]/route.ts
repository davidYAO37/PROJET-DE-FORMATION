import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { HonoraireMed } from '@/models/HonoraireMed';
import { HonorairePaye } from '@/models/HonorairePaye';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await db();
    const { id } = await params;
    const { honoraireId, ancienMontant, montant, modePaiement, banque, numeroCheque, payePar } = await request.json();

    if (!honoraireId || typeof montant !== 'number' || montant <= 0) {
      return NextResponse.json({ success: false, message: 'Données manquantes ou montant invalide' }, { status: 400 });
    }

    const paiement = await HonorairePaye.findById(id);
    if (!paiement) {
      return NextResponse.json({ success: false, message: 'Paiement introuvable' }, { status: 404 });
    }

    const honoraire = await HonoraireMed.findById(honoraireId);
    if (!honoraire) {
      return NextResponse.json({ success: false, message: 'Honoraire introuvable' }, { status: 404 });
    }

    const diff = montant - (ancienMontant || 0);
    const nouveauPaye = (honoraire.MontantPayé || 0) + diff;
    const nouveauReste = Math.max(0, (honoraire.Restapayer ?? honoraire.Totalnetapayer ?? 0) - diff);

    if (nouveauPaye > (honoraire.Totalnetapayer || 0)) {
      return NextResponse.json({ success: false, message: 'Le montant total payé dépasserait le net à payer' }, { status: 400 });
    }

    await HonorairePaye.findByIdAndUpdate(id, {
      MontantPayé: montant,
      Restapayer: nouveauReste,
      PayéPar: payePar || '',
      Recupar: payePar || '',
      Modepaiement: modePaiement || 'ESPECE',
      BanqueC: banque || '',
      NCheque: numeroCheque || '',
    });

    try {
      await HonoraireMed.findByIdAndUpdate(honoraireId, {
        MontantPayé: nouveauPaye,
        Restapayer: nouveauReste,
      });
    } catch (updateError) {
      await HonorairePaye.findByIdAndUpdate(id, {
        MontantPayé: ancienMontant,
        Restapayer: (honoraire.Restapayer ?? 0),
        PayéPar: paiement.PayéPar,
        Recupar: paiement.Recupar,
        Modepaiement: paiement.Modepaiement,
        BanqueC: paiement.BanqueC,
        NCheque: paiement.NCheque,
      });
      throw updateError;
    }

    return NextResponse.json({ success: true, message: 'Paiement modifié avec succès' });
  } catch (error) {
    console.error('Erreur PUT paiement:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await db();
    const { id } = await params;
    const { honoraireId, montant } = await request.json();

    const paiement = await HonorairePaye.findById(id);
    if (!paiement) {
      return NextResponse.json({ success: false, message: 'Paiement introuvable' }, { status: 404 });
    }

    const honoraire = await HonoraireMed.findById(honoraireId);
    if (!honoraire) {
      return NextResponse.json({ success: false, message: 'Honoraire introuvable' }, { status: 404 });
    }

    const montantReel = montant || paiement.MontantPayé || 0;
    const nouveauPaye = Math.max(0, (honoraire.MontantPayé || 0) - montantReel);
    const nouveauReste = (honoraire.Restapayer ?? 0) + montantReel;

    await HonorairePaye.findByIdAndDelete(id);

    try {
      await HonoraireMed.findByIdAndUpdate(honoraireId, {
        MontantPayé: nouveauPaye,
        Restapayer: nouveauReste,
      });
    } catch (updateError) {
      await new HonorairePaye({
        ...paiement.toObject(),
        _id: paiement._id,
      }).save();
      throw updateError;
    }

    return NextResponse.json({ success: true, message: 'Paiement annulé avec succès' });
  } catch (error) {
    console.error('Erreur DELETE paiement:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur' },
      { status: 500 }
    );
  }
}
