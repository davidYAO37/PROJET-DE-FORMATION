import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { COMPTE_RENDU_OPERATOIRE_TYPES, COMPTE_RENDU_OPERATOIRE_STATUTS, normalizeCompteRenduOperatoireStatut } from '@/types/compteRenduOperatoire';
import { ICompteRenduOperatoire } from '@/models/compteRenduOperatoire';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier'];

// PUT - Mettre à jour un compte rendu opératoire spécifique
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response: tenantErrorResponse } = await withTenant(req, ROLES);
    if (!context) return tenantErrorResponse;
    const CompteRenduOperatoire = getTenantModel<ICompteRenduOperatoire>(context.connection, 'CompteRenduOperatoire');
    getTenantModel(context.connection, 'Patient');
    getTenantModel(context.connection, 'Medecin');

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
        const isAuthor = cr.medecinId
            ? String(cr.medecinId) === context.user.userId
            : cr.chirurgien?.trim() === userName.trim();
        if (!isAuthor) {
            return NextResponse.json(
                { success: false, error: 'Seul le chirurgien ayant saisi le compte rendu peut le modifier' },
                { status: 403 }
            );
        }

        const currentStatus = normalizeCompteRenduOperatoireStatut(cr.statut);
        if (currentStatus === 'valide' || currentStatus === 'annule') {
            return NextResponse.json(
                { success: false, error: 'Un compte rendu validé ou annulé ne peut plus être modifié' },
                { status: 400 }
            );
        }

        delete body.patientId;
        delete body.patientNom;
        delete body.patientPrenoms;
        delete body.sexe;
        delete body.age;
        delete body.numeroDossier;

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

        if (body.statut) {
            const targetStatus = normalizeCompteRenduOperatoireStatut(body.statut);
            const transitions = {
                brouillon: ['brouillon', 'a_valider', 'annule'],
                a_valider: ['a_valider', 'valide', 'annule'],
            } as const;

            if (!(transitions[currentStatus] as readonly string[]).includes(targetStatus)) {
                return NextResponse.json(
                    { success: false, error: `Transition de ${currentStatus} vers ${targetStatus} interdite` },
                    { status: 400 }
                );
            }

            body.statut = targetStatus;
            if (targetStatus === 'valide') {
                body.validatedAt = new Date();
                body.validatedBy = userName;
            }
            if (targetStatus === 'annule') {
                if (!body.motifAnnulation?.trim()) {
                    return NextResponse.json(
                        { success: false, error: 'Le motif d’annulation est obligatoire' },
                        { status: 400 }
                    );
                }
                body.cancelledAt = new Date();
                body.cancelledBy = userName;
            }
        }

        delete body.validatedAt;
        delete body.validatedBy;
        delete body.cancelledAt;
        delete body.cancelledBy;
        if (body.statut === 'valide') {
            body.validatedAt = new Date();
            body.validatedBy = userName;
        }
        if (body.statut === 'annule') {
            body.cancelledAt = new Date();
            body.cancelledBy = userName;
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
    const { context, response: tenantErrorResponse } = await withTenant(req, ROLES);
    if (!context) return tenantErrorResponse;
    const CompteRenduOperatoire = getTenantModel<ICompteRenduOperatoire>(context.connection, 'CompteRenduOperatoire');

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
        const isAuthor = cr.medecinId
            ? String(cr.medecinId) === context.user.userId
            : cr.chirurgien?.trim() === userName.trim();
        if (!isAuthor) {
            return NextResponse.json(
                { success: false, error: 'Seul le chirurgien ayant saisi le compte rendu peut le supprimer' },
                { status: 403 }
            );
        }

        // Ne pas permettre la suppression si terminé
        if (normalizeCompteRenduOperatoireStatut(cr.statut) !== 'brouillon') {
            return NextResponse.json(
                { success: false, error: 'Seul un compte rendu en brouillon peut être supprimé' },
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