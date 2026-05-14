import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Patient } from '@/models/patient';
import { COMPTE_RENDU_OPERATOIRE_TYPES, COMPTE_RENDU_OPERATOIRE_STATUTS } from '@/types/compteRenduOperatoire';
import { CompteRenduOperatoire } from '@/models/compteRenduOperatoire';
import { db } from '@/db/mongoConnect';



// GET - Récupérer les comptes rendus opératoires
export async function GET(request: NextRequest) {
    try {
        await db();

        const { searchParams } = new URL(request.url);
        const patientId = searchParams.get('patientId');
        const medecinId = searchParams.get('medecinId');
        const statut = searchParams.get('statut');
        const entrepriseId = searchParams.get('entrepriseId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        // Construire le filtre
        const filter: any = {};

        if (patientId) {
            filter.patientId = patientId;
        }

        if (medecinId) {
            filter.medecinId = new mongoose.Types.ObjectId(medecinId);
        }

        if (statut) {
            filter.statut = statut;
        }

        if (entrepriseId) {
            filter.entrepriseId = entrepriseId;
        }

        // Pagination
        const skip = (page - 1) * limit;

        // Récupérer les comptes rendus opératoires
        const comptesRendus = await CompteRenduOperatoire.find(filter)
            .populate('patientId', 'Nom Prenoms Code_dossier Contact')
            .populate('medecinId', 'nom prenoms')
            .sort({ dateCreation: -1 })
            .skip(skip)
            .limit(limit);

        // Compter le total
        const total = await CompteRenduOperatoire.countDocuments(filter);

        return NextResponse.json({
            success: true,
            data: comptesRendus,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error('Erreur lors de la récupération des comptes rendus opératoires:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST - Créer un nouveau compte rendu opératoire
export async function POST(request: NextRequest) {
    try {
        await db();

        const body = await request.json();

        // Validation des champs requis
        const {
            patientId,
            dateOperation,
            chirurgien,
            typeOperation,
            descriptionOperation,
            diagnosticPreOperatoire,
            gestesRealises,
            suitesOperatoires,
            numeroDossier
        } = body;

        if (!patientId || !dateOperation || !chirurgien || !typeOperation || !descriptionOperation || !diagnosticPreOperatoire || !gestesRealises || !suitesOperatoires || !numeroDossier) {
            return NextResponse.json(
                { success: false, error: 'Champs requis manquants' },
                { status: 400 }
            );
        }

        if (!COMPTE_RENDU_OPERATOIRE_TYPES.includes(typeOperation)) {
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

        // Vérifier que le patient existe
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return NextResponse.json(
                { success: false, error: 'Patient non trouvé' },
                { status: 404 }
            );
        }

        // Calculer la durée si heures sont fournies
        let dureeOperation = body.dureeOperation;
        if (body.heureDebut && body.heureFin) {
            const [hDebut, mDebut] = body.heureDebut.split(':').map(Number);
            const [hFin, mFin] = body.heureFin.split(':').map(Number);
            const debutMinutes = hDebut * 60 + mDebut;
            const finMinutes = hFin * 60 + mFin;
            dureeOperation = finMinutes - debutMinutes;
        }

        // Créer le nouveau compte rendu opératoire
        const nouveauCR = new CompteRenduOperatoire({
            ...body,
            patientNom: patient.Nom,
            patientPrenoms: patient.Prenoms,
            dureeOperation,
            statut: body.statut || 'planifie'
        });

        await nouveauCR.save();

        // Peupler les informations pour la réponse
        const crPopule = await CompteRenduOperatoire.findById(nouveauCR._id)
            .populate('patientId', 'Nom Prenoms Code_dossier Contact')
            .populate('medecinId', 'nom prenoms');

        return NextResponse.json({
            success: true,
            message: 'Compte rendu opératoire créé avec succès',
            data: crPopule
        });

    } catch (error: any) {
        console.error('Erreur lors de la création du compte rendu opératoire:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// PUT - Non supporté sur la route collection
export async function PUT(request: NextRequest) {
    return NextResponse.json(
        { success: false, error: 'Modification non supportée sur /api/compterenduoperatoire, utilisez /api/compterenduoperatoire/{id}' },
        { status: 405 }
    );
}

// DELETE - Non supporté sur la route collection
export async function DELETE(request: NextRequest) {
    return NextResponse.json(
        { success: false, error: 'Suppression non supportée sur /api/compterenduoperatoire, utilisez /api/compterenduoperatoire/{id}' },
        { status: 405 }
    );
}