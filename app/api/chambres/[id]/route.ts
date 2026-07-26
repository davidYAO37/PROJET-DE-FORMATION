import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IChambre } from '@/models/chambre';
import { IActeClinique } from '@/models/acteclinique';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await withTenant(req, ['admin', 'medecin', 'accueil', 'infirmier']);
  if (!context) return response;
  const { connection } = context;

  try {
    const { id } = await params;
    const Chambre = getTenantModel<IChambre>(connection, 'Chambre');
    const chambre = await Chambre.findById(id).lean();
    if (!chambre) return NextResponse.json({ message: 'Introuvable' }, { status: 404 });
    return NextResponse.json(chambre);
  } catch (error) {
    console.error('Erreur chambre GET by id:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await withTenant(req, ['admin', 'accueil']);
  if (!context) return response;
  const { connection } = context;

  try {
    const { id } = await params;
    const body = await req.json();
    const Chambre = getTenantModel<IChambre>(connection, 'Chambre');
    const ActeClinique = getTenantModel<IActeClinique>(connection, 'ActeClinique');

    const prixClinique = Number(body.prixClinique ?? 0);
    const prixMutuel = Number(body.prixMutuel ?? 0);
    const prixPreferentiel = Number(body.prixPreferentiel ?? 0);

    const updated = await Chambre.findByIdAndUpdate(
      id,
      {
        ...body,
        prixClinique,
        prixMutuel,
        prixPreferentiel,
        tarifJournalier: Number(body.tarifJournalier ?? prixClinique),
        nombreLits: Number(body.nombreLits ?? 1),
      },
      { new: true }
    );

    if (!updated) return NextResponse.json({ message: 'Introuvable' }, { status: 404 });

    // Synchroniser l'acte clinique lié
    if (updated.acteCliniqueId) {
      const designationActe = `Chambre ${updated.numero || 'inconnue'}`;
      await ActeClinique.findByIdAndUpdate(updated.acteCliniqueId, {
        $set: {
          designationacte: designationActe,
          prixClinique,
          prixMutuel,
          prixPreferentiel,
        }
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erreur chambre PUT:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la mise à jour', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await withTenant(req, ['admin']);
  if (!context) return response;
  const { connection } = context;

  try {
    const { id } = await params;
    const Chambre = getTenantModel<IChambre>(connection, 'Chambre');
    const ActeClinique = getTenantModel<IActeClinique>(connection, 'ActeClinique');

    const deleted = await Chambre.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ message: 'Introuvable' }, { status: 404 });

    // Supprimer l'acte clinique lié
    if (deleted.acteCliniqueId) {
      await ActeClinique.findByIdAndDelete(deleted.acteCliniqueId);
    }

    return NextResponse.json({ message: 'Supprimée' });
  } catch (error) {
    console.error('Erreur chambre DELETE:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la suppression', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}
