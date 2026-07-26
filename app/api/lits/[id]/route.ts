import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { ILit } from '@/models/lit';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await withTenant(req, ['admin', 'medecin', 'accueil', 'infirmier']);
  if (!context) return response;
  const { connection } = context;

  try {
    const { id } = await params;
    const Lit = getTenantModel<ILit>(connection, 'Lit');
    const lit = await Lit.findById(id).lean();
    if (!lit) return NextResponse.json({ message: 'Lit introuvable' }, { status: 404 });
    return NextResponse.json(lit);
  } catch (error) {
    console.error('Erreur lit GET by id:', error);
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
    const Lit = getTenantModel<ILit>(connection, 'Lit');

    const updated = await Lit.findByIdAndUpdate(id, { $set: body }, { new: true });
    if (!updated) return NextResponse.json({ message: 'Lit introuvable' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erreur lit PUT:', error);
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
    const Lit = getTenantModel<ILit>(connection, 'Lit');
    const deleted = await Lit.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ message: 'Lit introuvable' }, { status: 404 });
    return NextResponse.json({ message: 'Lit supprimé' });
  } catch (error) {
    console.error('Erreur lit DELETE:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la suppression', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}
