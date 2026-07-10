import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { Operation } from '@/models/operation';

export async function GET(request: NextRequest) {
  try {
    await db();
    const { searchParams } = new URL(request.url);
    const entrepriseId = searchParams.get('entrepriseId') || '';

    const filtre: any = {};
    if (entrepriseId) filtre.entrepriseId = entrepriseId;

    const ops = await Operation.find(filtre).sort({ Libeleo: 1 }).lean();
    return NextResponse.json({ success: true, data: ops });
  } catch (error) {
    console.error('Erreur operations GET:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await db();
    const body = await request.json();
    const { action, Libeleo, TYPEOP, entrepriseId, id } = body;

    if (action === 'modifier') {
      if (!id || !Libeleo || !TYPEOP) {
        return NextResponse.json({ success: false, message: 'id, Libeleo et TYPEOP requis' }, { status: 400 });
      }
      const doublon = await Operation.findOne({ Libeleo, entrepriseId, _id: { $ne: id } }).lean();
      if (doublon) {
        return NextResponse.json({ success: false, message: 'Un autre libellé identique existe déjà' }, { status: 409 });
      }
      const updated = await Operation.findByIdAndUpdate(id, { Libeleo, TYPEOP }, { new: true });
      if (!updated) return NextResponse.json({ success: false, message: 'Introuvable' }, { status: 404 });
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'supprimer') {
      if (!id) return NextResponse.json({ success: false, message: 'id requis' }, { status: 400 });
      await Operation.findByIdAndDelete(id);
      return NextResponse.json({ success: true });
    }

    // creer (défaut)
    if (!Libeleo || !TYPEOP) {
      return NextResponse.json({ success: false, message: 'Libeleo et TYPEOP requis' }, { status: 400 });
    }
    const existing = await Operation.findOne({ Libeleo, entrepriseId }).lean();
    if (existing) {
      return NextResponse.json({ success: false, message: 'Cette opération existe déjà' }, { status: 409 });
    }
    const op = new Operation({ Libeleo, TYPEOP, entrepriseId });
    await op.save();
    return NextResponse.json({ success: true, data: op });
  } catch (error) {
    console.error('Erreur operations POST:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}
