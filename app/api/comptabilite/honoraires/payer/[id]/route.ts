import { NextRequest, NextResponse } from 'next/server';
import { getTenantFilter, withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IHonoraireMed } from '@/models/HonoraireMed';
import { IHonorairePaye } from '@/models/HonorairePaye';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier', 'comptable', 'facturation'];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES, { actions: ["export_comptable"] });
  if (!context) return tenantErrorResponse;
  const { connection } = context;
  const HonoraireMed = getTenantModel<IHonoraireMed>(connection, 'HonoraireMed');
  const HonorairePaye = getTenantModel<IHonorairePaye>(connection, 'HonorairePaye');
  const tenantFilter = getTenantFilter(context);

  const { id } = await params;
  const { honoraireId, ancienMontant, montant: montantBrut, modePaiement, banque, numeroCheque, payePar } = await request.json();

  // Tous les montants doivent être des entiers
  const montant = Math.round(Number(montantBrut));

  if (!honoraireId || !Number.isFinite(montant) || montant <= 0) {
    return NextResponse.json({ success: false, message: 'Données manquantes ou montant invalide' }, { status: 400 });
  }

  let message = '';

  try {
    const paiement = await HonorairePaye.findOne({ _id: id, ...tenantFilter }).lean();
    if (!paiement) {
      return NextResponse.json({ success: false, message: 'Paiement introuvable' }, { status: 404 });
    }

    const honoraire = await HonoraireMed.findOne({ _id: honoraireId, ...tenantFilter }).lean();
    if (!honoraire) {
      return NextResponse.json({ success: false, message: 'Honoraire introuvable' }, { status: 404 });
    }

    const diff = montant - Math.round(Number(ancienMontant) || 0);
    const nouveauPaye = Math.round((honoraire.MontantPayé || 0) + diff);
    const nouveauReste = Math.round(Math.max(0, (honoraire.Restapayer ?? honoraire.Totalnetapayer ?? 0) - diff));

    if (nouveauPaye > (honoraire.Totalnetapayer || 0)) {
      return NextResponse.json({ success: false, message: 'Le montant total payé dépasserait le net à payer' }, { status: 400 });
    }

    await HonorairePaye.findOneAndUpdate(
      { _id: id, ...tenantFilter },
      {
        MontantPayé: montant,
        Restapayer: nouveauReste,
        PayéPar: payePar || '',
        Recupar: payePar || '',
        Modepaiement: modePaiement || 'Espèce',
        BanqueC: banque || '',
        NCheque: numeroCheque || '',
      }
    );

    try {
      await HonoraireMed.findOneAndUpdate(
        { _id: honoraireId, ...tenantFilter },
        {
          MontantPayé: nouveauPaye,
          Restapayer: nouveauReste,
        }
      );
    } catch (err) {
      // Rollback : restaurer le paiement à son ancien montant
      await HonorairePaye.findOneAndUpdate(
        { _id: id, ...tenantFilter },
        {
          MontantPayé: paiement.MontantPayé,
          Restapayer: paiement.Restapayer,
          PayéPar: paiement.PayéPar,
          Recupar: paiement.Recupar,
          Modepaiement: paiement.Modepaiement,
          BanqueC: paiement.BanqueC,
          NCheque: paiement.NCheque,
        }
      );
      throw err;
    }

    message = 'Paiement modifié avec succès';
    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Erreur PUT paiement:', error);
    const msg = error instanceof Error ? error.message : 'Erreur';
    const status = msg.includes('introuvable') ? 404 : msg.includes('dépasserait') ? 400 : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES, { actions: ["export_comptable"] });
  if (!context) return tenantErrorResponse;
  const { connection } = context;
  const HonoraireMed = getTenantModel<IHonoraireMed>(connection, 'HonoraireMed');
  const HonorairePaye = getTenantModel<IHonorairePaye>(connection, 'HonorairePaye');
  const tenantFilter = getTenantFilter(context);

  const { id } = await params;
  const { honoraireId, montant } = await request.json();

  let message = '';

  try {
    const paiement = await HonorairePaye.findOne({ _id: id, ...tenantFilter }).lean();
    if (!paiement) {
      return NextResponse.json({ success: false, message: 'Paiement introuvable' }, { status: 404 });
    }

    const honoraire = await HonoraireMed.findOne({ _id: honoraireId, ...tenantFilter }).lean();
    if (!honoraire) {
      return NextResponse.json({ success: false, message: 'Honoraire introuvable' }, { status: 404 });
    }

    const montantReel = Math.round(Number(montant || paiement.MontantPayé || 0));
    const nouveauPaye = Math.round(Math.max(0, (honoraire.MontantPayé || 0) - montantReel));
    const nouveauReste = Math.round((honoraire.Restapayer ?? 0) + montantReel);

    const paiementSupprime = await HonorairePaye.findOneAndDelete({ _id: id, ...tenantFilter });
    try {
      await HonoraireMed.findOneAndUpdate(
        { _id: honoraireId, ...tenantFilter },
        {
          MontantPayé: nouveauPaye,
          Restapayer: nouveauReste,
        }
      );
    } catch (err) {
      // Rollback : recréer le paiement supprimé
      if (paiementSupprime) {
        const doc: any = (paiementSupprime as any).toObject?.() ?? paiementSupprime;
        delete doc._id;
        await HonorairePaye.create(doc);
      }
      throw err;
    }

    message = 'Paiement annulé avec succès';
    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Erreur DELETE paiement:', error);
    const msg = error instanceof Error ? error.message : 'Erreur';
    const status = msg.includes('introuvable') ? 404 : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
