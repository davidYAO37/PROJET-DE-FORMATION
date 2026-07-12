import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { HonoraireMed } from '@/models/HonoraireMed';
import { LigneHonoraireMed } from '@/models/LigneHonoraireMed';
import { Consultation } from '@/models/consultation';
import { Facturation } from '@/models/Facturation';
import { LignePrestation } from '@/models/lignePrestation';

export async function POST(
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

    const lignes = await LigneHonoraireMed.find({ HonoraireMed: id }).lean();

    // Remettre les statuts des actes
    for (const l of lignes) {
      const type = l.TYPEACTE;
      const idActe = l.IdPres;
      if (!idActe) continue;

      if (type === 'HONORAIRE CONSULTATION') {
        await Consultation.findByIdAndUpdate(idActe, { Statumed: 0 });
      } else if (type === 'HONORAIRE PRESCRIPTION') {
        await Facturation.findByIdAndUpdate(idActe, { Statumed: '0' });
      } else if (type === 'HONORAIRE EXECUTANT') {
        await LignePrestation.findByIdAndUpdate(idActe, { statutExecutant: '0' });
      } else if (type === 'HONORAIRE AIDE OPERATOIRE') {
        await LignePrestation.findByIdAndUpdate(idActe, { AideOperatoirePaye: 0 });
      } else if (type === 'HONORAIRE ANESTHESISTE') {
        await LignePrestation.findByIdAndUpdate(idActe, { AnesthesistePaye: 0 });
      }
    }

    await LigneHonoraireMed.deleteMany({ HonoraireMed: id });
    await HonoraireMed.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Bordereau annulé avec succès.',
    });
  } catch (error) {
    console.error('Erreur annulation honoraire:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur' },
      { status: 500 }
    );
  }
}
