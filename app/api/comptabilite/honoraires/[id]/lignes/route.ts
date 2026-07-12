import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { LigneHonoraireMed } from '@/models/LigneHonoraireMed';
import { HonoraireMed } from '@/models/HonoraireMed';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await db();
    const { id } = await params;

    const honoraire = await HonoraireMed.findById(id).lean();
    if (!honoraire) {
      return NextResponse.json(
        { success: false, message: 'Bordereau introuvable.' },
        { status: 404 }
      );
    }

    const lignes = await LigneHonoraireMed.find({ HonoraireMed: id })
      .sort({ DatePres: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: lignes,
      honoraire,
    });
  } catch (error) {
    console.error('Erreur GET lignes honoraire:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur' },
      { status: 500 }
    );
  }
}
