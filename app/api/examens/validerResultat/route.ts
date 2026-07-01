import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { ExamenHospitalisation } from '@/models/examenHospit';

export async function PUT(req: NextRequest) {
  try {
    await db();
    const body = await req.json();
    const { idHospitalisation, biologiste, observation } = body;

    if (!idHospitalisation) {
      return NextResponse.json(
        { error: 'Paramètres manquants', message: 'idHospitalisation requis.' },
        { status: 400 }
      );
    }

    const now = new Date();

    const updated = await ExamenHospitalisation.findByIdAndUpdate(
      idHospitalisation,
      {
        StatutLaboratoire: 4,
        DateValidation: now,
        dateretour: now,
        ObservationC: observation || '',
        Biologiste: biologiste || '',
      },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { error: 'Document non trouvé', message: `Aucun examen avec l'ID ${idHospitalisation}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Erreur PUT validerResultat:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', message: String(error) },
      { status: 500 }
    );
  }
}
