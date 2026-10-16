import { NextRequest, NextResponse } from 'next/server';
import { getTenantFilter, withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IHonoraireMed } from '@/models/HonoraireMed';
import { IHonorairePaye } from '@/models/HonorairePaye';
import mongoose from 'mongoose';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier', 'comptable', 'facturation'];

export async function GET(request: NextRequest) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES, { actions: ["export_comptable"] });
  if (!context) return tenantErrorResponse;
  const { connection } = context;
  const HonorairePaye = getTenantModel<IHonorairePaye>(connection, 'HonorairePaye');
  getTenantModel(connection, 'Medecin');
  const tenantFilter = getTenantFilter(context);

  const { searchParams } = new URL(request.url);
  const dateDebut = searchParams.get('dateDebut');
  const dateFin = searchParams.get('dateFin');
  const filter: Record<string, any> = { ...tenantFilter };
  if (dateDebut || dateFin) {
    filter.Date = {};
    if (dateDebut) filter.Date.$gte = new Date(dateDebut);
    if (dateFin) {
      const fin = new Date(dateFin);
      fin.setHours(23, 59, 59, 999);
      filter.Date.$lte = fin;
    }
  }

  const data = await HonorairePaye.find(filter)
    .populate('Medecin', 'nom prenoms')
    .sort({ Date: -1 })
    .lean();
  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES, { actions: ["export_comptable"] });
  if (!context) return tenantErrorResponse;
  const { connection } = context;
  const HonoraireMed = getTenantModel<IHonoraireMed>(connection, 'HonoraireMed');
  const HonorairePaye = getTenantModel<IHonorairePaye>(connection, 'HonorairePaye');
  const tenantFilter = getTenantFilter(context);

  const body = await request.json();
  const {
    honoraireId,
    montantClient: montantClientBrut,
    recuPar,
    modePaiement,
    banque,
    nCheque,
    datePaiement,
    payePar,
  } = body;

  // Tous les montants doivent être des entiers
  const montantClient = Math.round(Number(montantClientBrut));

  if (!honoraireId || !Number.isFinite(montantClient) || montantClient <= 0) {
    return NextResponse.json(
      { success: false, message: 'Données de paiement invalides.' },
      { status: 400 }
    );
  }

  try {
    // Mise à jour atomique du bordereau : échoue si le reste à payer est insuffisant
    const honoraire = await HonoraireMed.findOneAndUpdate(
      { _id: honoraireId, ...tenantFilter, Restapayer: { $gte: montantClient } },
      { $inc: { Restapayer: -montantClient, MontantPayé: montantClient } },
      { new: true }
    );

    if (!honoraire) {
      const existe = await HonoraireMed.findOne({ _id: honoraireId, ...tenantFilter }).lean();
      if (!existe) {
        return NextResponse.json({ success: false, message: 'Bordereau introuvable.' }, { status: 404 });
      }
      return NextResponse.json({ success: false, message: 'Le montant saisi dépasse le reste à payer.' }, { status: 400 });
    }

    const nouveauReste = Math.round(honoraire.Restapayer || 0);
    const montantPaye = Math.round(honoraire.MontantPayé || 0);

    try {
      await HonorairePaye.create({
        Date: datePaiement ? new Date(datePaiement) : new Date(),
        Heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        MontantJour: Math.round(montantClient),
        MontantPayé: Math.round(montantClient),
        Restapayer: nouveauReste,
        PayéPar: payePar || '',
        Recupar: recuPar || '',
        Medecin: honoraire.Medecin,
        HonoraireMed: new mongoose.Types.ObjectId(honoraireId),
        BanqueC: banque || '',
        NCheque: nCheque || '',
        Modepaiement: modePaiement || 'Espèce',
        entrepriseId: context.entrepriseId,
      });
    } catch (err) {
      // Rollback : restaurer les montants du bordereau
      await HonoraireMed.findOneAndUpdate(
        { _id: honoraireId, ...tenantFilter },
        { $inc: { Restapayer: montantClient, MontantPayé: -montantClient } }
      );
      throw err;
    }

    return NextResponse.json({
      success: true,
      message: 'Médecin payé avec succès.',
      data: { restapayer: nouveauReste, montantPayé: montantPaye },
    });
  } catch (error) {
    console.error('Erreur paiement honoraire:', error);
    const message = error instanceof Error ? error.message : 'Erreur';
    const status = message.includes('introuvable') ? 404 : message.includes('dépasse') ? 400 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
