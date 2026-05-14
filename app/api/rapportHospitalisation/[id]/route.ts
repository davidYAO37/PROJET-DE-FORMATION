import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { RapportHospitalisation } from '@/models/rapportHospitalisation';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await db();
  try {
    const { id } = await params;
    const body = await req.json();
    const userName = req.headers.get('x-user-name') || '';

    if (!userName) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non authentifié' },
        { status: 401 }
      );
    }

    const rapport = await RapportHospitalisation.findById(id);
    if (!rapport) {
      return NextResponse.json(
        { success: false, error: 'Rapport d\'hospitalisation non trouvé' },
        { status: 404 }
      );
    }

    if (rapport.medecinTraitant?.trim() !== userName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Seul le médecin traitant ayant saisi le rapport peut le modifier' },
        { status: 403 }
      );
    }

    if (body.dateEntree || body.dateSortie) {
      const dateEntreeObj = new Date(body.dateEntree || rapport.dateEntree);
      const dateSortieObj = new Date(body.dateSortie || rapport.dateSortie);
      if (isNaN(dateEntreeObj.getTime()) || isNaN(dateSortieObj.getTime()) || dateSortieObj < dateEntreeObj) {
        return NextResponse.json(
          { success: false, error: 'Les dates d\'hospitalisation sont invalides ou incohérentes' },
          { status: 400 }
        );
      }
      body.dureeHospitalisation = Math.max(
        1,
        Math.ceil((dateSortieObj.getTime() - dateEntreeObj.getTime()) / (1000 * 60 * 60 * 24))
      );
      body.dateEntree = dateEntreeObj;
      body.dateSortie = dateSortieObj;
    }

    if (body.dateRapport) {
      body.dateRapport = new Date(body.dateRapport);
    }

    const updatedRapport = await RapportHospitalisation.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Rapport d\'hospitalisation mis à jour avec succès',
      data: updatedRapport,
    });
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du rapport d\'hospitalisation:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await db();
  try {
    const { id } = await params;
    const userName = req.headers.get('x-user-name') || '';

    if (!userName) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non authentifié' },
        { status: 401 }
      );
    }

    const rapport = await RapportHospitalisation.findById(id);
    if (!rapport) {
      return NextResponse.json(
        { success: false, error: 'Rapport d\'hospitalisation non trouvé' },
        { status: 404 }
      );
    }

    if (rapport.medecinTraitant?.trim() !== userName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Seul le médecin traitant ayant saisi le rapport peut le supprimer' },
        { status: 403 }
      );
    }

    await RapportHospitalisation.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Rapport d\'hospitalisation supprimé avec succès',
    });
  } catch (error: any) {
    console.error('Erreur lors de la suppression du rapport d\'hospitalisation:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
