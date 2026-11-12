import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IChambre } from '@/models/chambre';
import { ILit } from '@/models/lit';

// GET /api/chambres/par-acte?acteId=... -> chambre liée à l'acte clinique + ses lits libres
export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, ['admin', 'medecin', 'accueil', 'caisse', 'infirmier']);
  if (!context) return response;
  const { connection } = context;

  try {
    const { searchParams } = new URL(req.url);
    const acteId = searchParams.get('acteId');
    if (!acteId || !mongoose.isValidObjectId(acteId)) {
      return NextResponse.json({ chambre: null, lits: [] });
    }

    const Chambre = getTenantModel<IChambre>(connection, 'Chambre');
    const Lit = getTenantModel<ILit>(connection, 'Lit');

    const chambre = await Chambre.findOne({ acteCliniqueId: acteId }).lean();
    if (!chambre) {
      return NextResponse.json({ chambre: null, lits: [] });
    }

    const lits = await Lit.find({ chambreId: chambre._id, etat: 'libre' })
      .sort({ numero: 1 })
      .lean();

    return NextResponse.json({ chambre, lits });
  } catch (error) {
    console.error('Erreur chambres/par-acte GET:', error);
    return NextResponse.json(
      { message: 'Erreur serveur', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}
