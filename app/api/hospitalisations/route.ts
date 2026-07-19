import { NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { Hospitalisation } from '@/models/hospitalisation';
import { Chambre } from '@/models/chambre';
import { Lit } from '@/models/lit';

export async function GET() {
    try {
        await db();
        const hospitalisations = await Hospitalisation.find().sort({ dateEntree: -1 }).lean();
        return NextResponse.json(hospitalisations);
    } catch (error) {
        console.error('Erreur hospitalisations GET', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await db();
        const body = await request.json();

        if (!body.patientId) {
            return NextResponse.json({ message: 'patientId est requis' }, { status: 400 });
        }

        const hospitalisation = await Hospitalisation.create({
            ...body,
            sourceType: body.avisHospitId ? 'avis_medecin' : 'manuel',
            statut: body.statut || 'en_cours',
            dateEntree: body.dateEntree ? new Date(body.dateEntree) : new Date(),
            dateSortie: body.dateSortie ? new Date(body.dateSortie) : undefined,
        });

        if (body.litId) {
            await Lit.findByIdAndUpdate(body.litId, { etat: 'occupe', patientId: body.patientId, dateOccupation: new Date() });
        }

        if (body.chambreId) {
            await Chambre.findByIdAndUpdate(body.chambreId, { etat: 'occupee' });
        }

        return NextResponse.json(hospitalisation, { status: 201 });
    } catch (error) {
        console.error('Erreur hospitalisations POST', error);
        return NextResponse.json({ message: 'Erreur lors de la création' }, { status: 500 });
    }
}
