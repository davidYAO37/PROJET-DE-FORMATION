import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { caisse } from '@/models/caisse';

export async function GET(request: NextRequest) {
  try {
    await db();
    const { searchParams } = new URL(request.url);
    const entrepriseId = searchParams.get('entrepriseId') || '';
    const id = searchParams.get('id') || '';
    const dateDebut = searchParams.get('dateDebut') || '';
    const dateFin = searchParams.get('dateFin') || '';
    const typeC = searchParams.get('typeC') || '';

    if (id) {
      const doc = await caisse.findById(id).lean();
      if (!doc) return NextResponse.json({ success: false, message: 'Introuvable' }, { status: 404 });
      return NextResponse.json({ success: true, data: doc });
    }

    const filtre: any = {};
    if (entrepriseId) filtre.entrepriseId = entrepriseId;
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
  try {
    await db();
    const body = await request.json();
    const { action } = body;

    if (action === 'creer') {
      const {
        typeC, Operation, MOtif, MOntantC,
        dAteC, HeureC, NomPrenoms, Contact, serviceC,
        AjouterParC, FonctionC, entrepriseId,
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
        entrepriseId,
      });

      await doc.save();
      return NextResponse.json({ success: true, message: 'Enregistrement créé', data: doc });
    }

    if (action === 'modifier') {
      const {
        id, typeC, Operation, MOtif, MOntantC,
        dAteC, HeureC, NomPrenoms, Contact, serviceC,
        MODifieParC, FonctionC, entrepriseId,
      } = body;

      const updated = await caisse.findByIdAndUpdate(
        id,
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
          entrepriseId,
        },
        { new: true }
      );
      if (!updated) return NextResponse.json({ success: false, message: 'Introuvable' }, { status: 404 });
      return NextResponse.json({ success: true, message: 'Modifié', data: updated });
    }

    if (action === 'supprimer') {
      const { id } = body;
      await caisse.findByIdAndDelete(id);
      return NextResponse.json({ success: true, message: 'Supprimé' });
    }

    return NextResponse.json({ success: false, message: 'Action inconnue' }, { status: 400 });
  } catch (error) {
    console.error('Erreur caisse POST:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}
