import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { ILit } from '@/models/lit';

export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, ['admin', 'medecin', 'accueil', 'infirmier']);
  if (!context) return response;
  const { connection } = context;

  try {
    const { searchParams } = new URL(req.url);
    const chambreId = searchParams.get('chambreId');
    const etat = searchParams.get('etat');

    const query: Record<string, string> = {};
    if (chambreId) query.chambreId = chambreId;
    if (etat) query.etat = etat;

    const Lit = getTenantModel<ILit>(connection, 'Lit');
    const lits = await Lit.find(query)
      .sort({ numero: 1 })
      .lean();

    return NextResponse.json(lits);
  } catch (error) {
    console.error('Erreur lits GET:', error);
    return NextResponse.json(
      { message: 'Erreur serveur', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { context, response } = await withTenant(req, ['admin', 'accueil']);
  if (!context) return response;
  const { connection } = context;

  try {
    const body = await req.json();
    const Lit = getTenantModel<ILit>(connection, 'Lit');
    const lit = await Lit.create({
      ...body,
      tarifJournalier: Number(body.tarifJournalier || 0),
      prixClinique: Number(body.prixClinique || 0),
      prixMutuel: Number(body.prixMutuel || 0),
      prixPreferentiel: Number(body.prixPreferentiel || 0),
    });
    return NextResponse.json(lit, { status: 201 });
  } catch (error) {
    console.error('Erreur lits POST:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la création', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}
