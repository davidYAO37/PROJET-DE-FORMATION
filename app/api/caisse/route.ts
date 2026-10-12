import { NextRequest, NextResponse } from 'next/server';
import { getTenantFilter, withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { ICaisse } from '@/models/caisse';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier', 'caisse', 'comptable'];

export async function GET(request: NextRequest) {
  const { context, response } = await withTenant(request, ROLES);
  if (!context) return response;
  const caisse = getTenantModel<ICaisse>(context.connection, 'Caisse');

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || '';
    const tenantFilter = getTenantFilter(context);
    const dateDebut = searchParams.get('dateDebut') || '';
    const dateFin = searchParams.get('dateFin') || '';
    const typeC = searchParams.get('typeC') || '';

    if (id) {
      const doc = await caisse.findOne({ _id: id, ...tenantFilter }).lean();
      if (!doc) return NextResponse.json({ success: false, message: 'Introuvable' }, { status: 404 });
      return NextResponse.json({ success: true, data: doc });
    }

    const filtre: any = { ...tenantFilter };
    if (typeC) filtre.typeC = typeC;
    if (dateDebut && dateFin) {
      const debut = new Date(dateDebut);
      const fin = new Date(dateFin);
      fin.setHours(23, 59, 59, 999);
      filtre.dAteC = { $gte: debut, $lte: fin };
    }

    const docs = await caisse.find(filtre).sort({ dAteC: -1, HeureC: -1 }).lean();
    return NextResponse.json({ success: true, data: docs, count: docs.length });
  } catch (error) {
    console.error('Erreur caisse GET:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { context, response } = await withTenant(request, ROLES);
  if (!context) return response;
  const caisse = getTenantModel<ICaisse>(context.connection, 'Caisse');
  const tenantFilter = getTenantFilter(context);

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'creer') {
      const {
        typeC, Operation, MOtif, MOntantC,
        dAteC, HeureC, NomPrenoms, Contact, serviceC,
        AjouterParC, FonctionC,
      } = body;

      const doc = new caisse({
        typeC,
        Operation,
        MOtif,
        MOntantC: Number(MOntantC) || 0,
        dAteC: dAteC ? new Date(dAteC) : new Date(),
        HeureC,
        NomPrenoms,
        Contact,
        serviceC,
        AjouterParC,
        FonctionC,
        entrepriseId: context.entrepriseId,
      });

      await doc.save();
      return NextResponse.json({ success: true, message: 'Enregistrement créé', data: doc });
    }

    if (action === 'modifier') {
      const {
        id, typeC, Operation, MOtif, MOntantC,
        dAteC, HeureC, NomPrenoms, Contact, serviceC,
        MODifieParC, FonctionC,
      } = body;

      const updated = await caisse.findOneAndUpdate(
        { _id: id, ...tenantFilter },
        {
          typeC,
          Operation,
          MOtif,
          MOntantC: Number(MOntantC) || 0,
          dAteC: dAteC ? new Date(dAteC) : undefined,
          HeureC,
          NomPrenoms,
          Contact,
          serviceC,
          MODifieParC,
          FonctionC,
          MODifLe: new Date(),
          entrepriseId: context.entrepriseId,
        },
        { new: true }
      );
      if (!updated) return NextResponse.json({ success: false, message: 'Introuvable' }, { status: 404 });
      return NextResponse.json({ success: true, message: 'Modifié', data: updated });
    }

    if (action === 'supprimer') {
      const { id } = body;
      const deleted = await caisse.findOneAndDelete({ _id: id, ...tenantFilter });
      if (!deleted) return NextResponse.json({ success: false, message: 'Introuvable' }, { status: 404 });
      return NextResponse.json({ success: true, message: 'Supprimé' });
    }

    return NextResponse.json({ success: false, message: 'Action inconnue' }, { status: 400 });
  } catch (error) {
    console.error('Erreur caisse POST:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}
