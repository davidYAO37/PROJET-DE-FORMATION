import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import ArretTravail from '@/models/arretTravail';
import { db } from '@/db/mongoConnect';
import { isTypeArretTravail, ARRET_TRAVAIL_STATUTS } from '@/types/arretTravail';

// PUT - Mettre à jour un arrêt de travail spécifique
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

    // Vérifier que l'arrêt existe
    const arret = await ArretTravail.findById(id);
    if (!arret) {
      return NextResponse.json(
        { success: false, error: 'Arrêt de travail non trouvé' },
        { status: 404 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const finDate = new Date(arret.dateFin);
    finDate.setHours(0, 0, 0, 0);

    if (arret.medecinTraitant?.trim() !== userName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Seul le médecin ayant saisi l\'arrêt peut le modifier' },
        { status: 403 }
      );
    }

    if (finDate < today) {
      if (arret.statut === 'en_cours') {
        arret.statut = 'termine';
        await arret.save();
      }
      return NextResponse.json(
        { success: false, error: 'La période est terminée, la modification n\'est plus possible' },
        { status: 400 }
      );
    }

    if (arret.statut !== 'en_cours') {
      return NextResponse.json(
        { success: false, error: 'Seuls les arrêts en cours peuvent être modifiés' },
        { status: 400 }
      );
    }
    // Validation des dates si elles sont modifiées
    if (body.dateDebut || body.dateFin) {
      const debut = new Date(body.dateDebut || arret.dateDebut);
      const fin = new Date(body.dateFin || arret.dateFin);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (debut < today && debut.getTime() !== new Date(arret.dateDebut).setHours(0, 0, 0, 0)) {
        return NextResponse.json(
          { success: false, error: 'La date de début ne peut pas être antérieure à aujourd\'hui' },
          { status: 400 }
        );
      }

      if (debut >= fin) {
        return NextResponse.json(
          { success: false, error: 'La date de fin doit être postérieure à la date de début' },
          { status: 400 }
        );
      }

      // Recalculer les champs dépendants des dates lors de la mise à jour
      body.dureeJours = Math.max(0, Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24)));
      const reprise = new Date(fin);
      reprise.setDate(reprise.getDate() + 1);
      body.dateReprise = reprise;
    }

    if (body.typeArret && !isTypeArretTravail(body.typeArret)) {
      return NextResponse.json(
        { success: false, error: 'Type d\'arrêt invalide' },
        { status: 400 }
      );
    }

    if (body.statut && !ARRET_TRAVAIL_STATUTS.includes(body.statut)) {
      return NextResponse.json(
        { success: false, error: 'Statut d\'arrêt invalide' },
        { status: 400 }
      );
    }

    // Mettre à jour l'arrêt
    const arretUpdate = await ArretTravail.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    ).populate('patientId', 'Nom Prenoms Code_dossier Contact')
      .populate('medecinId', 'nom prenoms');

    return NextResponse.json({
      success: true,
      message: 'Arrêt de travail mis à jour avec succès',
      data: arretUpdate
    });

  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de l\'arrêt de travail:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un arrêt de travail spécifique
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

    // Vérifier que l'arrêt existe
    const arret = await ArretTravail.findById(id);
    if (!arret) {
      return NextResponse.json(
        { success: false, error: 'Arrêt de travail non trouvé' },
        { status: 404 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const finDate = new Date(arret.dateFin);
    finDate.setHours(0, 0, 0, 0);

    if (arret.medecinTraitant?.trim() !== userName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Seul le médecin ayant saisi l\'arrêt peut le supprimer' },
        { status: 403 }
      );
    }

    if (finDate < today) {
      if (arret.statut === 'en_cours') {
        arret.statut = 'termine';
        await arret.save();
      }
      return NextResponse.json(
        { success: false, error: 'La période est terminée, la suppression n\'est plus possible' },
        { status: 400 }
      );
    }

    if (arret.statut !== 'en_cours') {
      return NextResponse.json(
        { success: false, error: 'Seuls les arrêts en cours peuvent être supprimés' },
        { status: 400 }
      );
    }

    // Supprimer l'arrêt
    await ArretTravail.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Arrêt de travail supprimé avec succès'
    });

  } catch (error: any) {
    console.error('Erreur lors de la suppression de l\'arrêt de travail:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
