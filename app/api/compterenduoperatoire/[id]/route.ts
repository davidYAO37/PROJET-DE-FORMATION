import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { db } from '@/db/mongoConnect';
import { COMPTE_RENDU_OPERATOIRE_TYPES, COMPTE_RENDU_OPERATOIRE_STATUTS } from '@/types/compteRenduOperatoire';
import { CompteRenduOperatoire } from '@/models/compteRenduOperatoire';

// PUT - Mettre à jour un compte rendu opératoire spécifique
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

        // Vérifier que le compte rendu existe
        const cr = await CompteRenduOperatoire.findById(id);
        if (!cr) {
            return NextResponse.json(
                { success: false, error: 'Compte rendu opératoire non trouvé' },
                { status: 404 }
            );
        }

        // Vérifier les permissions (seul le chirurgien peut modifier)
        if (cr.chirurgien?.trim() !== userName.trim()) {
            return NextResponse.json(
                { success: false, error: 'Seul le chirurgien ayant saisi le compte rendu peut le modifier' },
                { status: 403 }
            );
        }

        // Ne pas permettre la modification si terminé
        if (cr.statut === 'termine') {
            return NextResponse.json(
                { success: false, error: 'Les comptes rendus terminés ne peuvent plus être modifiés' },
                { status: 400 }
            );
        }

        // Validation des types
        if (body.typeOperation && !COMPTE_RENDU_OPERATOIRE_TYPES.includes(body.typeOperation)) {
            return NextResponse.json(
                { success: false, error: 'Type d\'opération invalide' },
                { status: 400 }
            );
        }

        if (body.statut && !COMPTE_RENDU_OPERATOIRE_STATUTS.includes(body.statut)) {
            return NextResponse.json(
                { success: false, error: 'Statut invalide' },
                { status: 400 }
            );
        }

        // Recalculer la durée si heures modifiées
        if ((body.heureDebut || body.heureFin) && cr.heureDebut && cr.heureFin) {
            const hDebut = body.heureDebut || cr.heureDebut;
            const hFin = body.heureFin || cr.heureFin;
            const [hd, md] = hDebut.split(':').map(Number);
            const [hf, mf] = hFin.split(':').map(Number);
            const debutMinutes = hd * 60 + md;
            const finMinutes = hf * 60 + mf;
            body.dureeOperation = finMinutes - debutMinutes;
        }

        // Mettre à jour le compte rendu
        const crUpdate = await CompteRenduOperatoire.findByIdAndUpdate(
            id,
            body,
            { new: true, runValidators: true }
        ).populate('patientId', 'Nom Prenoms Code_dossier Contact')
            .populate('medecinId', 'nom prenoms');

        return NextResponse.json({
            success: true,
            message: 'Compte rendu opératoire mis à jour avec succès',
            data: crUpdate
        });

    } catch (error: any) {
        console.error('Erreur lors de la mise à jour du compte rendu opératoire:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Supprimer un compte rendu opératoire spécifique
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

        // Vérifier que le compte rendu existe
        const cr = await CompteRenduOperatoire.findById(id);
        if (!cr) {
            return NextResponse.json(
                { success: false, error: 'Compte rendu opératoire non trouvé' },
                { status: 404 }
            );
        }

        // Vérifier les permissions
        if (cr.chirurgien?.trim() !== userName.trim()) {
            return NextResponse.json(
                { success: false, error: 'Seul le chirurgien ayant saisi le compte rendu peut le supprimer' },
                { status: 403 }
            );
        }

        // Ne pas permettre la suppression si terminé
        if (cr.statut === 'termine') {
            return NextResponse.json(
                { success: false, error: 'Les comptes rendus terminés ne peuvent plus être supprimés' },
                { status: 400 }
            );
        }

        // Supprimer le compte rendu
        await CompteRenduOperatoire.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: 'Compte rendu opératoire supprimé avec succès'
        });

    } catch (error: any) {
        console.error('Erreur lors de la suppression du compte rendu opératoire:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}