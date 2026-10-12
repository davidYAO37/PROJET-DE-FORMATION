import { NextRequest, NextResponse } from 'next/server';
import { getTenantFilter, withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IOperation } from '@/models/operation';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier', 'comptable'];

export async function GET(request: NextRequest) {
  const { context, response } = await withTenant(request, ROLES);
  if (!context) return response;
  const Operation = getTenantModel<IOperation>(context.connection, 'Operation');

  try {
    const ops = await Operation.find(getTenantFilter(context)).sort({ Libeleo: 1 }).lean();
    return NextResponse.json({ success: true, data: ops });
  } catch (error) {
    console.error('Erreur operations GET:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { context, response } = await withTenant(request, ROLES);
  if (!context) return response;
  const Operation = getTenantModel<IOperation>(context.connection, 'Operation');
  const tenantFilter = getTenantFilter(context);

  try {
    const body = await request.json();
    const { action, Libeleo, TYPEOP, id } = body;

    if (action === 'modifier') {
      if (!id || !Libeleo || !TYPEOP) {
        return NextResponse.json({ success: false, message: 'id, Libeleo et TYPEOP requis' }, { status: 400 });
      }
      const doublon = await Operation.findOne({ Libeleo, _id: { $ne: id }, ...tenantFilter }).lean();
      if (doublon) {
        return NextResponse.json({ success: false, message: 'Un autre libellé identique existe déjà' }, { status: 409 });
      }
      const updated = await Operation.findOneAndUpdate({ _id: id, ...tenantFilter }, { Libeleo, TYPEOP }, { new: true });
      if (!updated) return NextResponse.json({ success: false, message: 'Introuvable' }, { status: 404 });
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'supprimer') {
      if (!id) return NextResponse.json({ success: false, message: 'id requis' }, { status: 400 });
      const deleted = await Operation.findOneAndDelete({ _id: id, ...tenantFilter });
      if (!deleted) return NextResponse.json({ success: false, message: 'Introuvable' }, { status: 404 });
      return NextResponse.json({ success: true });
    }

    // creer (défaut)
    if (!Libeleo || !TYPEOP) {
      return NextResponse.json({ success: false, message: 'Libeleo et TYPEOP requis' }, { status: 400 });
    }
    const existing = await Operation.findOne({ Libeleo, ...tenantFilter }).lean();
    if (existing) {
      return NextResponse.json({ success: false, message: 'Cette opération existe déjà' }, { status: 409 });
    }
    const op = new Operation({ Libeleo, TYPEOP, entrepriseId: context.entrepriseId });
    await op.save();
    return NextResponse.json({ success: true, data: op });
  } catch (error) {
    console.error('Erreur operations POST:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}
